const { MongoClient } = require('mongodb');
require('dotenv').config();

const oldUri = 'mongodb+srv://sumankumar821311_db_user:e6tYVXxhD2jRTRbn@cluster0.dpt7ky6.mongodb.net/?retryWrites=true&w=majority';
const newUri = process.env.MONGO_URI;

const migrateMeta = async () => {
  try {
    const oldClient = new MongoClient(oldUri);
    const newClient = new MongoClient(newUri);

    await oldClient.connect();
    await newClient.connect();

    const oldDb = oldClient.db('aniumeDB');
    const newDb = newClient.db(process.env.DATABASE_NAME || 'rajmmamn');

    const collections = ['sliders', 'top5', 'socials'];

    for (const cName of collections) {
      console.log(`📡 Migrating ${cName}...`);
      const data = await oldDb.collection(cName).find({}).toArray();
      
      if (data.length > 0) {
        // Clear new database collection first to avoid duplicates
        await newDb.collection(cName).deleteMany({});
        // Insert old data
        await newDb.collection(cName).insertMany(data);
        console.log(`✅ Successfully migrated ${data.length} items to ${cName}.`);
      } else {
        console.log(`⚠️ No data found for ${cName} in aniumeDB.`);
      }
    }

    console.log('\n🎉 Metadata Migration Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Failed:', err);
    process.exit(1);
  }
};

migrateMeta();
