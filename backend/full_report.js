const { MongoClient } = require('mongodb');
require('dotenv').config();

const fullReport = async () => {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();
        
        console.log('| Database | Collection | Count | Sample Field |');
        console.log('|----------|------------|-------|--------------|');
        
        for (const dbInfo of dbs.databases) {
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            for (const coll of collections) {
                const count = await db.collection(coll.name).countDocuments();
                if (count > 0) {
                    const sample = await db.collection(coll.name).findOne();
                    const sampleField = Object.keys(sample).find(k => k !== '_id') || 'N/A';
                    console.log(`| ${dbInfo.name} | ${coll.name} | ${count} | ${sampleField} |`);
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
};

fullReport();
