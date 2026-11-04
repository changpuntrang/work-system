import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// ฟังก์ชันอ่านฐานข้อมูลแบบปลอดภัย (ไม่ทำลายข้อมูลเก่าที่มีอยู่)
const readDb = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData = { 
        settings: { payType: 'daily', rateValue: 500, otRatePerHour: 75 }, 
        users: [
          { id: '1', username: 'admin', password: '123', role: 'admin', status: 'approved' }
        ], 
        logs: [] 
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    // ตรวจสอบโครงสร้างพื้นฐาน ถ้าไม่มีให้เติมโดยไม่ลบของเดิม
    let isModified = false;
    if (!parsed.settings) {
      parsed.settings = { payType: 'daily', rateValue: 500, otRatePerHour: 75 };
      isModified = true;
    }
    if (!parsed.users) {
      parsed.users = [{ id: '1', username: 'admin', password: '123', role: 'admin', status: 'approved' }];
      isModified = true;
    } else {
      // เช็คว่ามี admin เผื่อไว้ไหม ถ้ายังไม่มีให้เพิ่มเข้าไป
      const hasAdmin = parsed.users.some(u => u.username === 'admin');
      if (!hasAdmin) {
        parsed.users.push({ id: '1', username: 'admin', password: '123', role: 'admin', status: 'approved' });
        isModified = true;
      }
    }
    if (!parsed.logs) {
      parsed.logs = [];
      isModified = true;
    }

    if (isModified) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }

    return parsed;
  } catch (err) {
    console.error('Error reading DB:', err);
    return { settings: {}, users: [{ id: '1', username: 'admin', password: '123', role: 'admin', status: 'approved' }], logs: [] };
  }
};

// ฟังก์ชันบันทึกฐานข้อมูล
const writeDb = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
};

// --- API ต่างๆ ของระบบ ---

// 1. ดึงข้อมูล Logs ทั้งหมด
app.get('/api/logs', (req, res) => {
  const db = readDb();
  res.json(db.logs || []);
});

// 2. บันทึก Logs ใหม่
app.post('/api/logs', (req, res) => {
  const db = readDb();
  const newLog = {
    _id: Date.now().toString(),
    ...req.body
  };
  if (!db.logs) db.logs = [];
  db.logs.push(newLog);
  writeDb(db);
  res.json({ success: true, log: newLog });
});

// 3. แก้ไขรายการทำงาน (Logs) - สำหรับ Admin
app.put('/api/logs/:id', (req, res) => {
  const logId = req.params.id;
  const db = readDb();
  
  const index = (db.logs || []).findIndex(l => l._id === logId || l.id === logId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการที่ต้องการแก้ไข' });
  }

  db.logs[index] = {
    ...db.logs[index],
    ...req.body,
    _id: db.logs[index]._id || db.logs[index].id,
    username: db.logs[index].username
  };

  writeDb(db);
  res.json({ success: true, logs: db.logs });
});

// 4. ลบรายการทำงาน (Logs) - สำหรับ Admin
app.delete('/api/logs/:id', (req, res) => {
  const logId = req.params.id;
  const db = readDb();
  
  const initialLength = (db.logs || []).length;
  db.logs = (db.logs || []).filter(l => l._id !== logId && l.id !== logId);

  if (db.logs.length === initialLength) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการที่ต้องการลบ' });
  }

  writeDb(db);
  res.json({ success: true, logs: db.logs });
});

// 5. ดึงข้อมูลการตั้งค่า
app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings || {});
});

// 6. อัปเดตการตั้งค่า
app.put('/api/settings', (req, res) => {
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  writeDb(db);
  res.json(db.settings);
});

// 7. ดึงข้อมูล User ทั้งหมด
app.get('/api/users', (req, res) => {
  const db = readDb();
  res.json(db.users || []);
});

// 8. เข้าสู่ระบบ
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const user = (db.users || []).find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }
  if (user.status !== 'approved' && user.role !== 'admin') {
    return res.json({ success: false, message: 'บัญชีของคุณยังไม่ได้รับการอนุมัติจาก Admin' });
  }
  res.json({ success: true, user });
});

// 9. ลงทะเบียนสมาชิกใหม่
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  if (!db.users) db.users = [];

  const existing = db.users.find(u => u.username === username);
  if (existing) {
    return res.json({ success: false, message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
  }

  const newUser = {
    id: Date.now().toString(),
    username,
    password,
    role: 'user',
    status: 'pending'
  };

  db.users.push(newUser);
  writeDb(db);
  res.json({ success: true, message: 'ลงทะเบียนสำเร็จ! กรุณารอ Admin อนุมัติก่อนเข้าใช้งาน' });
});

// 10. Admin เพิ่มสมาชิก
app.post('/api/users/admin-add', (req, res) => {
  const { username, password, role } = req.body;
  const db = readDb();
  if (!db.users) db.users = [];

  const existing = db.users.find(u => u.username === username);
  if (existing) {
    return res.json({ success: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' });
  }

  const newUser = {
    id: Date.now().toString(),
    username,
    password,
    role: role || 'user',
    status: 'approved'
  };

  db.users.push(newUser);
  writeDb(db);
  res.json({ success: true, users: db.users });
});

// 11. อัปเดตสถานะสมาชิก (อนุมัติ / ระงับ)
app.put('/api/users/:id/status', (req, res, next) => {
  const userId = req.params.id;
  const { status } = req.body;
  const db = readDb();

  const user = (db.users || []).find(u => u.id === userId || u._id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้นี้' });
  }

  user.status = status;
  writeDb(db);
  res.json({ success: true, users: db.users });
});

// 12. ลบสมาชิก
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const db = readDb();
  
  const initialLength = (db.users || []).length;
  db.users = (db.users || []).filter(u => u.id !== userId && u._id !== userId);

  if (db.users.length === initialLength) {
    return res.status(404).json({ success: false, message: 'ไม่พบสมาชิกที่ต้องการลบ' });
  }

  writeDb(db);
  res.json({ success: true, users: db.users });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});