// 02-insert.js — Create   รัน: node 02-insert.js
import { connectToMongoDB, disconnectFromMongoDB } from './db.js';

const client = await connectToMongoDB();
const books = client.db('bookstore').collection('books');

await books.deleteMany({}); // ล้างข้อมูลเก่า ให้รันซ้ำได้

const one = await books.insertOne({
  isbn: '978-616-000-001-1', title: 'เริ่มต้น MongoDB',
  price: 350, stock: 10, tags: ['database', 'nosql'],
  publisher: { name: 'ดาวเหนือ', city: 'กรุงเทพฯ' }, // object ซ้อนได้
});
console.log('insertOne ->', one.insertedId);

const many = await books.insertMany([
  { isbn: '978-616-000-002-8', title: 'JavaScript ฉบับเข้าใจง่าย',
    price: 290, stock: 5, tags: ['javascript'] },
  { isbn: '978-616-000-003-5', title: 'ออกแบบฐานข้อมูล',
    price: 420, stock: 2, tags: ['database', 'design'] },
  { isbn: '978-616-000-004-2', title: 'Node.js สำหรับมือใหม่',
    price: 390, stock: 0, tags: ['javascript', 'nodejs'] },
]);
console.log('insertMany ->', many.insertedCount, 'เล่ม');

await disconnectFromMongoDB();
