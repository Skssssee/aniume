const { MongoClient } = require('mongodb');
require('dotenv').config();

const find3k = async () => {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();

        for (const dbInfo of dbs.databases) {
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            for (const coll of collections) {
                if (coll.name === 'files' || coll.name.includes('file')) {
                    const count = await db.collection(coll.name).countDocuments();
                    console.log(`FOUND FILE COLL: DB: ${dbInfo.name} | Coll: ${coll.name} | Count: ${count}`);
                    if (count > 0) {
                        const sample = await db.collection(coll.name).findOne();
                        console.log(`Sample: ${JSON.stringify(sample).substring(0, 200)}`);
                    }
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
};

find3k();
