const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    const uri = "mongodb+srv://sumankumar821311_db_user:e6tYVXxhD2jRTRbn@cluster0.dpt7ky6.mongodb.net/Cluster0?appName=Cluster0";
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    const files = await db.collection('forwarded_files').find().toArray();
    console.log('Forwarded Files Count in Cluster0:', files.length);

    await mongoose.disconnect();
}

check().catch(console.error);
