// 01-connect.js — ทดสอบการเชื่อมต่อ   รัน: node 01-connect.js
import { connectToMongoDB, disconnectFromMongoDB } from './db.js';

const client = await connectToMongoDB();

// ping ไปที่ server ถ้าได้ { ok: 1 } แปลว่าพร้อมใช้งาน
const result = await client.db('admin').command({ ping: 1 });
console.log('ping:', result);

await disconnectFromMongoDB();
