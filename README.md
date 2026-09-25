# Bookstore MongoDB — เรียน MongoDB ใน 3 ชั่วโมง

ตัวอย่างประกอบการสอน **ระบบร้านหนังสือ** — Part 1 รันด้วย Node.js ทีละไฟล์ (ไม่ต้องลง mongosh) · Part 2–3 อยู่ใน `app.js` ไฟล์เดียว

หน้าเว็บรวมโค้ด (กดคัดลอกได้ทีละไฟล์): `https://<account>.github.io/bookstore-mongodb/`

| ไฟล์ | ใช้ใน |
|---|---|
| `db.js`, `01-connect.js` … `06-delete.js` | Part 1 — เชื่อมต่อและ CRUD ด้วย Node.js driver (รันทีละไฟล์) |
| `part1-mongosh.js` | Part 1 แบบ mongosh — ทางเลือกสำหรับคนที่ทำ offline |
| `app.js` | Part 2 — Express + Mongoose (CRUD) และ Part 3 — สั่งซื้อแบบ ACID transaction |
| `public/index.html` | หน้าเว็บ (HTML + `fetch`) เรียก API ของ app.js — เปิด http://localhost:3000 |
| `homework.md` | การบ้าน: ระบบจัดการอุปกรณ์ในห้องแล็บ |

## เริ่มต้น

ต้องมี Node.js 20 ขึ้นไป (แนะนำ 22 LTS) ไม่ต้องติดตั้ง mongosh

- **MongoDB Atlas** (แนะนำ): สร้าง cluster ฟรี → Connect → Drivers → คัดลอก connection string
- **Offline**: MongoDB Community Server บนเครื่อง หรือ `npm run db:up` (Docker)
  — Part 3 (transaction) ต้องเป็น replica set: ใช้ Atlas หรือ Docker ของโปรเจกต์นี้

```bash
git clone https://github.com/<account>/bookstore-mongodb.git
cd bookstore-mongodb
npm install
# แก้ const uri ใน db.js และ app.js: ใส่ connection string จาก Atlas (user / password ของตัวเอง)

# Part 1 — รันทีละไฟล์
node 01-connect.js        # You successfully connected to MongoDB!
node 02-insert.js
node 03-find.js
node 04-operators.js
node 05-update.js
node 06-delete.js

# Part 2–3 — เปิด API
npm run dev
```

> connection string มีรหัสผ่านอยู่ในนั้น — อย่า push รหัสผ่านจริงขึ้น GitHub สาธารณะ (การแยกไปไว้ในไฟล์ `.env` เป็นหัวข้อถัดไป)
>
> Offline: เปลี่ยน `uri` เป็น `mongodb://127.0.0.1:27017/?directConnection=true` (มีบรรทัด comment ไว้ให้แล้ว)

## แก้ปัญหาการเชื่อมต่อ

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| Warning `MODULE_TYPELESS_PACKAGE_JSON` หรือ `SyntaxError: Cannot use import` | `package.json` ไม่มี `"type": "module"` | `npm pkg set type=module` |
| รันแล้วไม่มี output เลย | รันไฟล์ที่มีแค่ `export function` (เช่น `node db.js`) | รัน `node 01-connect.js` |
| `querySrv EBADNAME _mongodb._tcp.<cluster>.mongodb.net` | ยังไม่ได้แก้ `uri` (ยังเป็น `<cluster>`) | คัดลอก connection string จาก Atlas มาใส่ใน `uri` |
| ค้าง ~30 วินาที แล้ว `MongoServerSelectionError` | Atlas ยังไม่อนุญาต IP ของเครื่อง | Atlas → Network Access → Add Current IP Address |
| `bad auth : authentication failed` | user หรือ password ไม่ถูก | Atlas → Database Access → Edit Password แล้วแก้ใน `uri` (ไม่ต้องมี `<` `>`) |
| ทำงานเสร็จแต่โปรแกรมไม่จบ | ไม่ได้ปิดการเชื่อมต่อ | `await disconnectFromMongoDB()` ท้ายไฟล์ |

## เปิดหน้าเว็บ

`app.js` เปิดไฟล์ในโฟลเดอร์ `public/` ให้ด้วย `app.use(express.static('public'))`
หลัง `npm run dev` เปิด **http://localhost:3000** (รันคำสั่งจากโฟลเดอร์โปรเจกต์ เพราะ `'public'` นับจากโฟลเดอร์ที่รัน)

1. กด **ใส่ข้อมูลตัวอย่าง** → ตารางแสดงหนังสือ 4 เล่ม
2. ใส่จำนวน 2 ที่ `เริ่มต้น MongoDB` → **สั่งซื้อ** → สต็อกลดจาก 10 เหลือ 8
3. ลอง rollback: ใส่ 1 ที่ `เริ่มต้น MongoDB` และ 1 ที่ `Node.js สำหรับมือใหม่` (stock 0) → **สั่งซื้อ**
   → ขึ้นกล่องแดง `400 สต็อกไม่พอ` และสต็อกของ `เริ่มต้น MongoDB` ยังเป็น 8
4. เพิ่มหนังสือโดยไม่ใส่ชื่อ → ขึ้น `400 ... ต้องระบุชื่อหนังสือ` (validation จาก Schema)

## ลองเรียก API ด้วย curl

```bash
# 1) ใส่ข้อมูลตัวอย่าง (คัดลอก _id ของหนังสือจากผลลัพธ์)
curl -X POST http://localhost:3000/seed

# 2) ดูหนังสือ
curl http://localhost:3000/books
curl "http://localhost:3000/books?tag=database"

# 3) เพิ่มหนังสือ (ข้อมูลผิด -> 400)
curl -X POST http://localhost:3000/books -H "content-type: application/json" \
  -d '{"isbn":"978-616-000-005-9","title":"Express API","price":450,"stock":3}'

# 4) สั่งซื้อ (transaction) — ใส่ _id จริงแทน <id>
curl -X POST http://localhost:3000/orders -H "content-type: application/json" \
  -d '{"customer":"สมชาย","items":[{"bookId":"<id>","qty":2}]}'

# 5) ดูใบสั่งซื้อ
curl http://localhost:3000/orders
```

ลอง rollback: สั่งซื้อ 2 รายการ โดยรายการที่ 2 เป็นหนังสือ `Node.js สำหรับมือใหม่` (stock = 0)
จะได้ 400 และสต็อกของรายการแรกต้องไม่ลดลง

## นำขึ้น GitHub (สำหรับผู้สอน)

1. สร้าง repository ชื่อ `bookstore-mongodb` (Public)
2. แก้ `<account>` เป็นชื่อบัญชีจริงใน `package.json` และ README นี้ แล้วรัน `npm run docs`
3. push ขึ้น GitHub

   ```bash
   git init
   git add .
   git commit -m "Bookstore MongoDB"
   git branch -M main
   git remote add origin https://github.com/<account>/bookstore-mongodb.git
   git push -u origin main
   ```

4. **Settings → Pages → Deploy from a branch → `main` / `/docs`** รอ 1 นาที
   หน้าเว็บจะอยู่ที่ `https://<account>.github.io/bookstore-mongodb/`

แก้โค้ดเมื่อไร ให้รัน `npm run docs` แล้ว commit `docs/index.html` ไปด้วย
