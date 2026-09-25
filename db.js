// db.js — เชื่อมต่อ MongoDB ด้วย Node.js driver (ใช้ร่วมกันทุกไฟล์ใน Part 1)
import { MongoClient } from 'mongodb';

// Atlas → Connect → Drivers → คัดลอก connection string แล้วใส่ user / password ของตัวเอง
const uri = 'mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/?appName=Cluster0';
// offline: const uri = 'mongodb://127.0.0.1:27017/?directConnection=true';
const client = new MongoClient(uri);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('You successfully connected to MongoDB!');
    return client;
  } catch (err) {
    console.dir(err);
    process.exit(1); // เชื่อมต่อไม่ได้ -> หยุดโปรแกรม
  }
}

// Call this only when your application terminates
export async function disconnectFromMongoDB() {
  await client.close();
}
