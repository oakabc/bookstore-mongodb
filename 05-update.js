// 05-update.js — Update   รัน: node 05-update.js
import { connectToMongoDB, disconnectFromMongoDB } from './db.js';

const client = await connectToMongoDB();
const books = client.db('bookstore').collection('books');

// รับหนังสือเข้า 5 เล่ม + ปรับราคา + เพิ่ม tag
const r1 = await books.updateOne(
  { isbn: '978-616-000-001-1' },
  { $inc: { stock: 5 }, $set: { price: 320 }, $push: { tags: 'beginner' } }
);
console.log('matched', r1.matchedCount, 'modified', r1.modifiedCount);

// ขาย 2 เล่ม: ตัดสต็อกเฉพาะเมื่อมีของพอ
const r2 = await books.updateOne(
  { isbn: '978-616-000-001-1', stock: { $gte: 2 } },
  { $inc: { stock: -2 } }
);
console.log('ขายได้?', r2.modifiedCount === 1);

// ลดราคาหนังสือหมวด javascript ทุกเล่ม 10%
const r3 = await books.updateMany({ tags: 'javascript' }, { $mul: { price: 0.9 } });
console.log('updateMany ->', r3.modifiedCount, 'เล่ม');

console.table(await books.find({}, { projection: { _id: 0, title: 1, price: 1, stock: 1 } }).toArray());
await disconnectFromMongoDB();
