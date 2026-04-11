const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const repair = async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db(process.env.DATABASE_NAME || 'rajmmamn');
    console.log('Connected to Raw DB for repair...');

    const animes = await db.collection('animes').find({}).toArray();
    let totalRepaired = 0;

    for (const anime of animes) {
        let modified = false;
        const fixedEpisodes = anime.episodes.map(ep => {
            if (!ep._id) {
                ep._id = new ObjectId();
                totalRepaired++;
                modified = true;
            }
            return ep;
        });
        
        if (modified) {
            await db.collection('animes').updateOne(
                { _id: anime._id },
                { $set: { episodes: fixedEpisodes } }
            );
            console.log(`✅ Repaired IDs for: ${anime.title}`);
        }
    }

    console.log(`\n🎉 Success! Total episodes repaired: ${totalRepaired}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Repair Failed:', err);
    process.exit(1);
  }
};

repair();
