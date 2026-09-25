// 06-delete.js — Delete   รัน: node 06-delete.js
import { connectToMongoDB, disconnectFromMongoDB } from './db.js';

const client = await connectToMongoDB();
const books = client.db('bookstore').collection('books');

// ลบ 1 รายการ
const r1 = await books.deleteOne({ isbn: '978-616-000-004-2' });
console.log('deleteOne ->', r1.deletedCount);

// ลบทุกรายการที่ตรงเงื่อนไข
const r2 = await books.deleteMany({ stock: 0 });
console.log('deleteMany ->', r2.deletedCount);

// ระวัง! filter ว่าง {} = ลบทั้ง collection
// await books.deleteMany({});

console.log('เหลือหนังสือ', await books.countDocuments(), 'เล่ม');
await disconnectFromMongoDB();
