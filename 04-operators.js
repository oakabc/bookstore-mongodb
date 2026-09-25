// 04-operators.js — Query operators   รัน: node 04-operators.js
import { connectToMongoDB, disconnectFromMongoDB } from './db.js';

const client = await connectToMongoDB();
const books = client.db('bookstore').collection('books');
const show = { projection: { _id: 0, title: 1, price: 1, stock: 1 } };

// ราคา 300–400 บาท
console.table(await books.find({ price: { $gte: 300, $lte: 400 } }, show).toArray());

// หมวด database หรือ design
console.table(await books.find({ tags: { $in: ['database', 'design'] } }, show).toArray());

// มีของ และ ราคาต่ำกว่า 400 (AND โดยปริยาย)
console.table(await books.find({ stock: { $gt: 0 }, price: { $lt: 400 } }, show).toArray());

// ชื่อขึ้นต้นด้วย "Java"
console.table(await books.find({ title: { $regex: '^Java' } }, show).toArray());

// หมดสต็อก หรือ ราคาเกิน 400
console.table(await books.find({ $or: [{ stock: 0 }, { price: { $gt: 400 } }] }, show).toArray());

await disconnectFromMongoDB();
