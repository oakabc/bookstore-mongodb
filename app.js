// app.js — ร้านหนังสือ: Express + Mongoose ในไฟล์เดียว
import express from 'express';
import mongoose from 'mongoose';

// Atlas → Connect → Drivers → คัดลอก connection string แล้วใส่ user / password ของตัวเอง
const uri = 'mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/?appName=Cluster0';
// offline: const uri = 'mongodb://127.0.0.1:27017/?directConnection=true';

// ===== 1) Schema + Model =====
const bookSchema = new mongoose.Schema(
  {
    isbn: { type: String, required: [true, 'ต้องระบุ ISBN'], unique: true },
    title: { type: String, required: [true, 'ต้องระบุชื่อหนังสือ'] },
    author: String,
    price: { type: Number, required: true, min: [0, 'ราคาต้องไม่ติดลบ'] },
    stock: { type: Number, default: 0, min: [0, 'สต็อกต้องไม่ติดลบ'] },
    tags: [String],
  },
  { timestamps: true }
);
const Book = mongoose.model('Book', bookSchema);

const itemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' }, // reference
  title: String, // snapshot: ชื่อและราคา ณ วันที่ซื้อ
  price: Number,
  qty: Number,
});
const orderSchema = new mongoose.Schema(
  { customer: { type: String, required: true }, items: [itemSchema], total: Number },
  { timestamps: true }
);
const Order = mongoose.model('Order', orderSchema);

const app = express();
app.use(express.json());
app.use(express.static('public')); // เปิดหน้าเว็บใน public/ ที่ http://localhost:3000

// ===== 2) CRUD หนังสือ =====
app.get('/books', async (req, res) => {
  const filter = req.query.tag ? { tags: req.query.tag } : {};
  res.json(await Book.find(filter).sort({ title: 1 }));
});

app.get('/books/:id', async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ error: 'ไม่พบหนังสือ' });
  res.json(book);
});

app.post('/books', async (req, res) => {
  const book = await Book.create(req.body); // ตรวจข้อมูลตาม schema ก่อนบันทึก
  res.status(201).json(book);
});

app.patch('/books/:id', async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after', // คืนค่าหลังแก้
    runValidators: true, //     ตรวจ min / required ตอน update ด้วย
  });
  if (!book) return res.status(404).json({ error: 'ไม่พบหนังสือ' });
  res.json(book);
});

app.delete('/books/:id', async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return res.status(404).json({ error: 'ไม่พบหนังสือ' });
  res.status(204).end();
});

// ===== 3) สั่งซื้อแบบ transaction (ACID) =====
// body: { "customer": "สมชาย", "items": [{ "bookId": "...", "qty": 2 }] }
app.post('/orders', async (req, res) => {
  const { customer, items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'ต้องมีรายการหนังสืออย่างน้อย 1 รายการ' });
  }

  const order = await mongoose.connection.transaction(async (session) => {
    const lines = [];
    for (const { bookId, qty } of items) {
      // ตัดสต็อกเฉพาะเมื่อมีของพอ
      const book = await Book.findOneAndUpdate(
        { _id: bookId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { session, returnDocument: 'after' }
      );
      if (!book) {
        const err = new Error(`สต็อกไม่พอ: ${bookId}`);
        err.status = 400;
        throw err; // throw = rollback ทุกอย่างใน transaction
      }
      lines.push({ book: book._id, title: book.title, price: book.price, qty });
    }
    const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
    const [created] = await Order.create([{ customer, items: lines, total }], { session });
    return created; // return = commit
  });

  res.status(201).json(order);
});

app.get('/orders', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('items.book', 'title stock');
  res.json(orders);
});

// ===== 4) ข้อมูลตัวอย่าง =====
app.post('/seed', async (req, res) => {
  await Order.deleteMany({});
  await Book.deleteMany({});
  const books = await Book.insertMany([
    { isbn: '978-616-000-001-1', title: 'เริ่มต้น MongoDB', author: 'อรุณี แสงทอง', price: 350, stock: 10, tags: ['database', 'nosql'] },
    { isbn: '978-616-000-002-8', title: 'JavaScript ฉบับเข้าใจง่าย', author: 'อรุณี แสงทอง', price: 290, stock: 5, tags: ['javascript'] },
    { isbn: '978-616-000-003-5', title: 'ออกแบบฐานข้อมูล', author: 'Daniel Park', price: 420, stock: 2, tags: ['database', 'design'] },
    { isbn: '978-616-000-004-2', title: 'Node.js สำหรับมือใหม่', author: 'Daniel Park', price: 390, stock: 0, tags: ['javascript', 'nodejs'] },
  ]);
  res.json(books);
});

// ===== 5) จัดการ error =====
app.use((err, req, res, next) => {
  const badInput = err.name === 'ValidationError' || err.name === 'CastError';
  const status = err.status || (badInput ? 400 : err.code === 11000 ? 409 : 500);
  res.status(status).json({ error: err.message });
});

// ===== 6) เชื่อมต่อ database แล้วเปิด server =====
const PORT = 3000;
mongoose
  .connect(uri, { dbName: 'bookstore' }) // ใช้ database ชื่อ bookstore
  .then(() => app.listen(PORT, () => console.log(`Bookstore API -> http://localhost:${PORT}`)))
  .catch((err) => console.error('เชื่อมต่อ MongoDB ไม่ได้:', err.message));
