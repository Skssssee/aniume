const mongoose = require('mongoose');
require('dotenv').config();

const debugDB = async () => {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const db = mongoose.connection.client.db('aniumeDB');
    const collections = await db.listCollections().toArray();
    console.log('Collections in aniumeDB:');
    for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        console.log(` - ${coll.name}: ${count} docs`);
        if (count > 0) {
            const sample = await db.collection(coll.name).findOne();
            console.log(`   Sample Keys: ${Object.keys(sample).join(', ')}`);
        }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

debugDB();
