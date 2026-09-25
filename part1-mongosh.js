// Part 1 — คำสั่ง MongoDB พื้นฐานใน mongosh (คัดลอกไปพิมพ์ทีละคำสั่ง)
// หรือรันทั้งไฟล์: mongosh "mongodb://127.0.0.1:27017/?directConnection=true" part1-mongosh.js

db = db.getSiblingDB('bookstore'); // ใน mongosh แบบพิมพ์เอง ใช้: use bookstore
db.books.deleteMany({});

// ---------- Create ----------
db.books.insertOne({
  isbn: '978-616-000-001-1',
  title: 'เริ่มต้น MongoDB',
  price: 350,
  stock: 10,
  tags: ['database', 'nosql'],
  publisher: { name: 'ดาวเหนือ', city: 'กรุงเทพฯ' },
});

db.books.insertMany([
  { isbn: '978-616-000-002-8', title: 'JavaScript ฉบับเข้าใจง่าย', price: 290, stock: 5, tags: ['javascript'] },
  { isbn: '978-616-000-003-5', title: 'ออกแบบฐานข้อมูล', price: 420, stock: 2, tags: ['database', 'design'] },
  { isbn: '978-616-000-004-2', title: 'Node.js สำหรับมือใหม่', price: 390, stock: 0, tags: ['javascript', 'nodejs'] },
]);

// ---------- Read ----------
db.books.find();
db.books.find({ tags: 'database' });
db.books.find({ stock: { $gt: 0 } }, { title: 1, price: 1, _id: 0 });
db.books.find({ 'publisher.city': 'กรุงเทพฯ' });
db.books.find().sort({ price: -1 }).limit(5);
db.books.findOne({ isbn: '978-616-000-001-1' });

// ---------- Query operators ----------
db.books.find({ price: { $gte: 300, $lte: 400 } });
db.books.find({ tags: { $in: ['database', 'design'] } });
db.books.find({ title: { $regex: '^Java' } });
db.books.find({ $or: [{ stock: 0 }, { price: { $gt: 400 } }] });

// ---------- Update ----------
db.books.updateOne(
  { isbn: '978-616-000-001-1' },
  { $inc: { stock: 5 }, $set: { price: 320 }, $push: { tags: 'beginner' } }
);
db.books.updateOne({ isbn: '978-616-000-001-1', stock: { $gte: 2 } }, { $inc: { stock: -2 } });

// ---------- Delete ----------
db.books.deleteOne({ isbn: '978-616-000-004-2' });

print('เหลือหนังสือ', db.books.countDocuments(), 'เล่ม');
