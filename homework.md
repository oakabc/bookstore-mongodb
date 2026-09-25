# การบ้าน: ระบบจัดการอุปกรณ์ในห้องแล็บ

นำสิ่งที่ทำกับร้านหนังสือในห้องเรียน ไปสร้าง **ระบบยืม–คืนอุปกรณ์ในห้องแล็บ** ใช้ database ชื่อ `labdb`

| ร้านหนังสือ (ในห้อง) | ระบบแล็บ (การบ้าน) |
|---|---|
| `books` | `equipment` (อุปกรณ์) |
| `orders` | `loans` (รายการยืม) |
| ตัดสต็อก + สร้าง order | เปลี่ยนสถานะอุปกรณ์เป็น `borrowed` + สร้าง loan |

## ส่วนที่ 1 — Node.js driver (30 คะแนน)

ส่งไฟล์ `hw1.js` ที่ใช้ `db.js` เชื่อมต่อ (รันด้วย `node hw1.js`) — ทำด้วย mongosh แทนได้สำหรับคนที่ทำ offline

1. insert อุปกรณ์อย่างน้อย 6 ชิ้น แต่ละชิ้นมี `code` (เช่น `LAB-001`), `name`, `category`, `room`, `status` (`available` / `borrowed` / `maintenance`), `price`
2. หาอุปกรณ์ที่ว่างในห้อง `LAB-3` แสดงเฉพาะ `code` และ `name`
3. หาอุปกรณ์ราคา 5,000–20,000 บาท
4. หาอุปกรณ์หมวด `optics` หรือ `electronics` (ใช้ `$in`)
5. เปลี่ยนสถานะอุปกรณ์ 1 ชิ้นเป็น `maintenance`
6. ลบอุปกรณ์ 1 ชิ้น

## ส่วนที่ 2 — app.js (40 คะแนน)

ส่งโปรเจกต์ (ไม่รวม `node_modules`) ที่รันด้วย `npm start` ได้

1. Schema `Equipment`: `code` (required, unique), `name` (required), `category`, `room`, `status` (ใช้ `enum`, ค่าเริ่มต้น `available`), `price` (min 0)
2. Routes: `GET /equipment` (กรองด้วย `?status=` ได้), `GET /equipment/:id`, `POST /equipment`, `PATCH /equipment/:id`, `DELETE /equipment/:id`
3. ข้อมูลผิด (เช่น ไม่มี `name` หรือ `status` ไม่อยู่ใน enum) ต้องได้ 400

## ส่วนที่ 3 — ยืมด้วย transaction (30 คะแนน)

1. Schema `Loan`: `borrower` (ชื่อผู้ยืม), `equipment` (ref ไปที่ Equipment), `dueDate`, `returnedAt`
2. `POST /loans` body `{ "borrower": "สมชาย", "equipmentId": "..." }` ทำใน transaction เดียว
   - เปลี่ยนสถานะอุปกรณ์ `available` → `borrowed` **เฉพาะเมื่อยังว่าง** (ไม่ว่าง → 400 และไม่สร้าง loan)
   - สร้าง loan พร้อม `dueDate` = วันนี้ + 7 วัน
3. `POST /loans/:id/return` บันทึก `returnedAt` และเปลี่ยนอุปกรณ์กลับเป็น `available` (ใน transaction)
4. ทดสอบ: ยืมอุปกรณ์ชิ้นเดียวกัน 2 ครั้ง ครั้งที่ 2 ต้องได้ 400 และจำนวน loans ต้องเพิ่มแค่ 1

## โบนัส — หน้าเว็บ (+10 คะแนน)

ดัดแปลง `public/index.html` ของร้านหนังสือเป็นหน้าเว็บระบบแล็บ แล้วเพิ่ม `app.use(express.static('public'))` ใน app.js

1. ตารางอุปกรณ์จาก `GET /equipment` พร้อมช่องกรองตาม `status`
2. ปุ่ม "ยืม" ในแต่ละแถว เรียก `POST /loans` — ยืมซ้ำต้องเห็นข้อความ error จาก server บนหน้าเว็บ
3. ปุ่ม "คืน" เรียก `POST /loans/:id/return` แล้วโหลดตารางใหม่ให้เห็นสถานะเปลี่ยน

**คำถามท้ายบท:** ถ้าไม่ใช้ transaction ในข้อ 3.2 แล้วการสร้าง loan ล้มเหลว จะเกิดอะไรขึ้นกับสถานะอุปกรณ์
