// 03-find.js — Read   รัน: node 03-find.js   (รัน 02-insert.js ก่อน)
import { connectToMongoDB, disconnectFromMongoDB } from './db.js';

const client = await connectToMongoDB();
const books = client.db('bookstore').collection('books');

// ทั้งหมด — find() คืน cursor ต้อง .toArray()
console.table(await books.find().toArray());

// กรองด้วยเงื่อนไข (filter)
console.table(await books.find({ tags: 'database' }).toArray());

// เลือกเฉพาะ field ที่จะแสดง (projection)
const projection = { _id: 0, title: 1, price: 1 };
console.table(await books.find({ stock: { $gt: 0 } }, { projection }).toArray());

// field ที่ซ้อนอยู่ ใช้ dot notation
console.log(await books.find({ 'publisher.city': 'กรุงเทพฯ' }).toArray());

// เรียงลำดับ และจำกัดจำนวน
console.table(await books.find().sort({ price: -1 }).limit(2).toArray());

// เอาแค่รายการเดียว
console.log(await books.findOne({ isbn: '978-616-000-001-1' }));

await disconnectFromMongoDB();
