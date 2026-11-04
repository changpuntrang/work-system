import React, { useState, useEffect } from 'react';

export default function App() {
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({ 
    payType: 'daily', 
    rateValue: 500, 
    otRatePerHour: 93.75, 
    ssoPercent: 5, 
    lateRatePerMinute: 2,
    password: '1234' 
  });
  
  const [userRates, setUserRates] = useState(() => {
    const saved = localStorage.getItem('userRates');
    return saved ? JSON.parse(saved) : {};
  });

  // แยกประวัติ 10 รายการล่าสุดตามรายบุคคล (รูปแบบ: { username: [item1, item2, ...] })
  const [userJobHistories, setUserJobHistories] = useState(() => {
    const saved = localStorage.getItem('userJobHistories');
    return saved ? JSON.parse(saved) : {};
  });

  const [userLocationHistories, setUserLocationHistories] = useState(() => {
    const saved = localStorage.getItem('userLocationHistories');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [activeTab, setActiveTab] = useState('auth');

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState('login');
  const [authInput, setAuthInput] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [allUsers, setAllUsers] = useState([]);
  const [adminNewUser, setAdminNewUser] = useState({ username: '', password: '', role: 'user' });

  const [form, setForm] = useState({
    date: '', location: '', jobDescription: '', startTime: '08:00', endTime: '17:00', otHours: 0, lateMinutes: 0, note: ''
  });

  const [editingLog, setEditingLog] = useState(null);
  
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('date');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');

  const [sortOrder, setSortOrder] = useState('desc');
  const [chartMonth, setChartMonth] = useState(new Date().toISOString().slice(0, 7));

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [calcMonth, setCalcMonth] = useState(new Date().toISOString().slice(0, 7));
  const [calcPeriod, setCalcPeriod] = useState('10');
  const [calcSelectedUser, setCalcSelectedUser] = useState('');

  // Admin ตั้งค่าเรทรายบุคคล
  const [targetUserRateEdit, setTargetUserRateEdit] = useState('');
  const [customUserRateForm, setCustomUserRateForm] = useState({
    payType: 'daily',
    rateValue: 500,
    otRatePerHour: 93.75,
    ssoPercent: 5,
    lateRatePerMinute: 2
  });

  useEffect(() => {
    fetchLogs();
    fetchSettings();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('userRates', JSON.stringify(userRates));
  }, [userRates]);

  useEffect(() => {
    localStorage.setItem('userJobHistories', JSON.stringify(userJobHistories));
  }, [userJobHistories]);

  useEffect(() => {
    localStorage.setItem('userLocationHistories', JSON.stringify(userLocationHistories));
  }, [userLocationHistories]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (allUsers.length > 0) {
      if (!calcSelectedUser) setCalcSelectedUser('admin');
      if (!targetUserRateEdit) setTargetUserRateEdit(allUsers[0].username);
    }
  }, [allUsers]);

  useEffect(() => {
    if (targetUserRateEdit && userRates[targetUserRateEdit]) {
      setCustomUserRateForm(userRates[targetUserRateEdit]);
    } else {
      setCustomUserRateForm({
        payType: settings.payType,
        rateValue: settings.rateValue,
        otRatePerHour: settings.otRatePerHour,
        ssoPercent: settings.ssoPercent,
        lateRatePerMinute: settings.lateRatePerMinute
      });
    }
  }, [targetUserRateEdit, settings, userRates]);

  // ดึงข้อมูลอัตโนมัติเฉพาะของ User คนนั้นๆ เมื่อเลือกวันที่ซ้ำ
  useEffect(() => {
    if (form.date && currentUser) {
      const existingLog = logs.find(l => {
        const logUser = l.username || 'admin';
        return logUser === currentUser.username && l.date === form.date;
      });
      if (existingLog) {
        setForm(prev => ({
          ...prev,
          location: existingLog.location || '',
          jobDescription: existingLog.jobDescription || '',
          startTime: existingLog.startTime || '08:00',
          endTime: existingLog.endTime || '17:00',
          otHours: existingLog.otHours || 0,
          lateMinutes: existingLog.lateMinutes || 0,
          note: existingLog.note || ''
        }));
      }
    }
  }, [form.date]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/settings');
      const data = await res.json();
      setSettings(prev => ({
        ...prev,
        ...data,
        ssoPercent: data.ssoPercent !== undefined ? data.ssoPercent : 5,
        lateRatePerMinute: data.lateRatePerMinute !== undefined ? data.lateRatePerMinute : 2
      }));
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      const data = await res.json();
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const formatDateToDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const yearNum = parseInt(parts[0], 10);
      const thaiYear = yearNum < 2500 ? yearNum + 543 : yearNum;
      return `${parts[2]}/${parts[1]}/${thaiYear}`;
    }
    return dateStr;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authInput)
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setAuthInput({ username: '', password: '' });
        setActiveTab('log');
        return;
      } else {
        setAuthError(data.message);
      }
    } catch (err) {
      if (authInput.username === 'admin') {
        setCurrentUser({ username: 'admin', role: 'admin', status: 'approved' });
      } else {
        setCurrentUser({ username: authInput.username || 'user', role: 'user', status: 'approved' });
      }
      setActiveTab('log');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authInput)
      });
      const data = await res.json();
      if (data.success) {
        setAuthSuccess(data.message);
        setAuthInput({ username: '', password: '' });
        fetchUsers();
      } else {
        setAuthError(data.message);
      }
    } catch (err) {
      setAuthSuccess('ลงทะเบียนสำเร็จ (โหมดจำลอง)');
      setAuthInput({ username: '', password: '' });
    }
  };

  const handleUpdateUserStatus = async (userId, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setAllUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const handleAdminAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/users/admin-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminNewUser)
      });
      const data = await res.json();
      if (data.success) {
        setAllUsers(data.users);
        setAdminNewUser({ username: '', password: '', role: 'user' });
        alert('เพิ่มสมาชิกสำเร็จ!');
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Failed to add user:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('คุณต้องการลบสมาชิกนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setAllUsers(data.users);
        alert('ลบสมาชิกสำเร็จ');
      } else {
        alert(data.message || 'ไม่สามารถลบสมาชิกได้');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('คุณต้องการลบรายการทำงานนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/logs/${logId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        alert('ลบรายการทำงานสำเร็จ');
      } else {
        alert(data.message || 'ไม่สามารถลบรายการได้');
      }
    } catch (err) {
      console.error('Failed to delete log:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleUpdateLog = async (e) => {
    e.preventDefault();
    if (!editingLog) return;
    try {
      const res = await fetch(`http://localhost:5000/api/logs/${editingLog._id || editingLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLog)
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setEditingLog(null);
        alert('แก้ไขรายการทำงานสำเร็จ!');
      } else {
        alert(data.message || 'ไม่สามารถแก้ไขรายการได้');
      }
    } catch (err) {
      console.error('Failed to update log:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล!');
      setActiveTab('auth');
      return;
    }

    const usernameKey = currentUser.username;

    // บันทึกประวัติเฉพาะของ User คนนี้ (สูงสุด 10 รายการล่าสุด)
    if (form.jobDescription) {
      setUserJobHistories(prev => {
        const userList = prev[usernameKey] || [];
        const filtered = userList.filter(item => item !== form.jobDescription);
        return {
          ...prev,
          [usernameKey]: [form.jobDescription, ...filtered].slice(0, 10)
        };
      });
    }

    if (form.location) {
      setUserLocationHistories(prev => {
        const userList = prev[usernameKey] || [];
        const filtered = userList.filter(item => item !== form.location);
        return {
          ...prev,
          [usernameKey]: [form.location, ...filtered].slice(0, 10)
        };
      });
    }

    const existingIndex = logs.findIndex(l => {
      const logUser = l.username || 'admin';
      return logUser === currentUser.username && l.date === form.date;
    });

    if (existingIndex !== -1) {
      const targetLog = logs[existingIndex];
      const logId = targetLog._id || targetLog.id;
      try {
        const res = await fetch(`http://localhost:5000/api/logs/${logId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, username: currentUser.username })
        });
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
          setForm({ date: '', location: '', jobDescription: '', startTime: '08:00', endTime: '17:00', otHours: 0, lateMinutes: 0, note: '' });
          alert('อัปเดตข้อมูลของวันนี้สำเร็จ!');
          return;
        }
      } catch (err) {
        const updatedLogs = [...logs];
        updatedLogs[existingIndex] = { ...form, id: logId, username: currentUser.username };
        setLogs(updatedLogs);
        setForm({ date: '', location: '', jobDescription: '', startTime: '08:00', endTime: '17:00', otHours: 0, lateMinutes: 0, note: '' });
        alert('อัปเดตข้อมูลของวันนี้สำเร็จ (โหมดสำรอง)!');
        return;
      }
    }

    try {
      const res = await fetch('http://localhost:5000/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, username: currentUser.username })
      });
      if (!res.ok) throw new Error();
      setForm({ date: '', location: '', jobDescription: '', startTime: '08:00', endTime: '17:00', otHours: 0, lateMinutes: 0, note: '' });
      fetchLogs();
      alert('บันทึกข้อมูลสำเร็จ!');
    } catch (err) {
      const newLog = { ...form, id: Date.now(), username: currentUser.username };
      setLogs([newLog, ...logs]);
      setForm({ date: '', location: '', jobDescription: '', startTime: '08:00', endTime: '17:00', otHours: 0, lateMinutes: 0, note: '' });
      alert('บันทึกข้อมูลสำเร็จ (โหมดสำรอง)!');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      setSettings(prev => ({ ...prev, ...data }));
      alert('บันทึกการตั้งค่าเรทกลางเรียบร้อย');
      fetchLogs();
    } catch (err) {
      alert('บันทึกการตั้งค่าเรทกลางเรียบร้อย (โหมดจำลอง)');
    }
  };

  const handleSaveUserCustomRate = (e) => {
    e.preventDefault();
    const calculatedOt = Number(((Number(customUserRateForm.rateValue) / 8) * 1.5).toFixed(2));
    const finalData = { ...customUserRateForm, otRatePerHour: calculatedOt };
    setUserRates(prev => ({
      ...prev,
      [targetUserRateEdit]: finalData
    }));
    alert(`บันทึกเรทเฉพาะบุคคลสำหรับ "${targetUserRateEdit}" สำเร็จ (OT คำนวณอัตโนมัติ ${calculatedOt} บาท/ชม.)!`);
  };

  const handleBackupAllData = () => {
    const backupData = {
      logs,
      settings,
      allUsers,
      userRates,
      userJobHistories,
      userLocationHistories,
      backupDate: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `work_system_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getPeriodDateRange = (monthStr, periodType) => {
    if (!monthStr) return { start: '', end: '' };
    const [year, month] = monthStr.split('-').map(Number);
    let startDate, endDate;
    if (periodType === '10') {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      startDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-26`;
      endDate = `${year}-${String(month).padStart(2, '0')}-10`;
    } else {
      startDate = `${year}-${String(month).padStart(2, '0')}-11`;
      endDate = `${year}-${String(month).padStart(2, '0')}-25`;
    }
    return { start: startDate, end: endDate };
  };

  const filteredLogs = logs.filter(l => {
    const logUser = l.username || 'admin'; 

    if (currentUser?.role !== 'admin') {
      if (logUser !== currentUser?.username) return false;
    } else {
      if (selectedUserFilter !== 'all' && logUser !== selectedUserFilter) return false;
    }

    const matchText = 
      (l.location && l.location.toLowerCase().includes(search.toLowerCase())) ||
      (l.jobDescription && l.jobDescription.toLowerCase().includes(search.toLowerCase())) ||
      (l.note && l.note.toLowerCase().includes(search.toLowerCase()));

    if (!matchText) return false;

    if (filterMode === 'date') {
      const matchStartDate = startDateFilter ? l.date >= startDateFilter : true;
      const matchEndDate = endDateFilter ? l.date <= endDateFilter : true;
      return matchStartDate && matchEndDate;
    } else if (filterMode === 'location') {
      return locationFilter ? l.location && l.location.toLowerCase().includes(locationFilter.toLowerCase()) : true;
    } else if (filterMode === 'period10' || filterMode === 'period25') {
      const pType = filterMode === 'period10' ? '10' : '25';
      const range = getPeriodDateRange(calcMonth, pType);
      return l.date >= range.start && l.date <= range.end;
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const totalFilteredOtHours = filteredLogs.reduce((sum, l) => sum + (Number(l.otHours) || 0), 0);
  const totalFilteredOtPay = totalFilteredOtHours * (settings.otRatePerHour || 0);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const displayedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const chartFilteredLogs = logs.filter(l => {
    const logUser = l.username || 'admin';
    if (currentUser?.role !== 'admin') {
      if (logUser !== currentUser?.username) return false;
    }
    if (chartMonth && l.date) {
      return l.date.startsWith(chartMonth);
    }
    return true;
  });

  const locationStats = {};
  chartFilteredLogs.forEach(l => {
    const loc = l.location ? l.location.trim() : 'ไม่ระบุสถานที่';
    if (!locationStats[loc]) {
      locationStats[loc] = { totalDays: 0, totalOt: 0 };
    }
    locationStats[loc].totalDays += 1;
    locationStats[loc].totalOt += Number(l.otHours) || 0;
  });

  const locationArray = Object.keys(locationStats).map(loc => ({
    location: loc,
    ...locationStats[loc]
  }));

  const maxDays = Math.max(...locationArray.map(item => item.totalDays), 1);

  const handlePrintFilteredReport = () => {
    const printWindow = window.open('', '_blank');
    let filterDescription = 'รายงานข้อมูลทั้งหมด';
    if (filterMode === 'date') {
      filterDescription = startDateFilter || endDateFilter ? `ช่วงวันที่: ${formatDateToDisplay(startDateFilter) || 'เริ่มต้น'} ถึง ${formatDateToDisplay(endDateFilter) || 'ปัจจุบัน'}` : 'รายงานข้อมูลทุกช่วงเวลา';
    } else if (filterMode === 'location') {
      filterDescription = locationFilter ? `สถานที่ทำงานประกอบด้วย: "${locationFilter}"` : 'สถานที่ทำงานทั้งหมด';
    } else if (filterMode === 'period10' || filterMode === 'period25') {
      const pType = filterMode === 'period10' ? 'วันที่ 10' : 'วันที่ 25';
      filterDescription = `รอบตัดยอดประจำ${pType} (${calcMonth})`;
    }

    const isAdmin = currentUser?.role === 'admin';
    const sortedLogsForPrint = [...filteredLogs].sort((a, b) => new Date(a.date) - new Date(b.date));

    const htmlContent = `
      <html>
        <head>
          <title>รายงานการทำงาน</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; }
            p { text-align: center; font-size: 14px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; font-size: 14px; font-weight: bold; text-align: right; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h2>รายงานการทำงาน ${isAdmin && selectedUserFilter !== 'all' ? `(ผู้ใช้: ${selectedUserFilter})` : ''}</h2>
          <p>${filterDescription} | เรียงลำดับ: วันที่เก่าไปใหม่ ${search ? `| คำค้นหา: "${search}"` : ''}</p>
          <table>
            <thead>
              <tr>
                <th>วัน / เดือน / ปี</th>
                <th>ผู้บันทึก</th>
                <th>ลักษณะงานที่ทำ</th>
                <th>สถานที่ทำงาน</th>
                <th>เวลาเริ่ม</th>
                <th>เวลาเลิก</th>
                <th>OT (ชม.)</th>
                <th>มาสาย (นาที)</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${sortedLogsForPrint.length === 0 ? '<tr><td colspan="9" style="text-align:center;">ไม่มีข้อมูลตามเงื่อนไขนี้</td></tr>' : 
                sortedLogsForPrint.map(l => {
                  const dispDate = formatDateToDisplay(l.date);
                  return `
                    <tr>
                      <td>${dispDate}</td>
                      <td>${l.username || 'admin'}</td>
                      <td>${l.jobDescription || '-'}</td>
                      <td>${l.location || '-'}</td>
                      <td>${l.startTime}</td>
                      <td>${l.endTime}</td>
                      <td>${l.otHours || 0}</td>
                      <td>${l.lateMinutes || 0}</td>
                      <td>${l.note || '-'}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
          </table>
          <div class="summary">
            รวมรายการทั้งหมด: ${sortedLogsForPrint.length} รายการ<br>
            รวมชั่วโมง OT: ${totalFilteredOtHours} ชั่วโมง
            ${isAdmin ? `<br>รวมเงินค่า OT: ${totalFilteredOtPay.toLocaleString()} บาท` : ''}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // การคำนวณสำหรับ Admin
  const targetUserForCalc = currentUser?.role === 'admin' ? (calcSelectedUser || 'admin') : currentUser?.username;
  const rawActiveRate = userRates[targetUserForCalc] || settings;
  const calculatedOtRate = Number(((Number(rawActiveRate.rateValue) / 8) * 1.5).toFixed(2));
  const activeRateForCalc = { ...rawActiveRate, otRatePerHour: calculatedOtRate };

  const currentPeriodLogs = logs.filter(l => {
    const logUser = l.username || 'admin';
    if (targetUserForCalc && logUser !== targetUserForCalc) return false;
    const range = getPeriodDateRange(calcMonth, calcPeriod);
    return l.date >= range.start && l.date <= range.end;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const calculatedDaysCount = currentPeriodLogs.length;
  const totalRegularPay = activeRateForCalc.payType === 'daily' 
    ? calculatedDaysCount * (Number(activeRateForCalc.rateValue) || 0) 
    : currentPeriodLogs.reduce((sum, l) => {
        const [sH, sM] = (l.startTime || '08:00').split(':').map(Number);
        const [eH, eM] = (l.endTime || '17:00').split(':').map(Number);
        const hours = Math.max(0, (eH + eM / 60) - (sH + sM / 60));
        return sum + (hours * (Number(activeRateForCalc.rateValue) || 0));
      }, 0);

  const totalOtPay = currentPeriodLogs.reduce((sum, l) => sum + ((Number(l.otHours) || 0) * (Number(activeRateForCalc.otRatePerHour) || 0)), 0);
  const grossPay = totalRegularPay + totalOtPay;

  const ssoDeduction = grossPay * ((Number(activeRateForCalc.ssoPercent) || 0) / 100);
  const totalLateMinutes = currentPeriodLogs.reduce((sum, l) => sum + (Number(l.lateMinutes) || 0), 0);
  const lateDeduction = totalLateMinutes * (Number(activeRateForCalc.lateRatePerMinute) || 0);

  const grandTotalPay = Math.max(0, grossPay - ssoDeduction - lateDeduction);

  // การคำนวณสำหรับหน้า "สรุปรายรับของฉัน" ของ User
  const rawMyRate = currentUser ? (userRates[currentUser.username] || settings) : settings;
  const myCalculatedOtRate = Number(((Number(rawMyRate.rateValue) / 8) * 1.5).toFixed(2));
  const myActiveRate = { ...rawMyRate, otRatePerHour: myCalculatedOtRate };

  const myPeriodLogs = logs.filter(l => {
    const logUser = l.username || 'admin';
    if (currentUser && logUser !== currentUser.username) return false;
    const range = getPeriodDateRange(calcMonth, calcPeriod);
    return l.date >= range.start && l.date <= range.end;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const myDaysCount = myPeriodLogs.length;
  const myRegularPay = myActiveRate.payType === 'daily' 
    ? myDaysCount * (Number(myActiveRate.rateValue) || 0) 
    : myPeriodLogs.reduce((sum, l) => {
        const [sH, sM] = (l.startTime || '08:00').split(':').map(Number);
        const [eH, eM] = (l.endTime || '17:00').split(':').map(Number);
        const hours = Math.max(0, (eH + eM / 60) - (sH + sM / 60));
        return sum + (hours * (Number(myActiveRate.rateValue) || 0));
      }, 0);

  const myOtPay = myPeriodLogs.reduce((sum, l) => sum + ((Number(l.otHours) || 0) * (Number(myActiveRate.otRatePerHour) || 0)), 0);
  const myGrossPay = myRegularPay + myOtPay;
  const mySsoDeduction = myGrossPay * ((Number(myActiveRate.ssoPercent) || 0) / 100);
  const myLateMinutesCount = myPeriodLogs.reduce((sum, l) => sum + (Number(l.lateMinutes) || 0), 0);
  const myLateDeduction = myLateMinutesCount * (Number(myActiveRate.lateRatePerMinute) || 0);
  const myGrandTotalPay = Math.max(0, myGrossPay - mySsoDeduction - myLateDeduction);

  // ดึงประวัติเฉพาะของ User ปัจจุบันมาแสดงใน datalist
  const currentJobHistory = currentUser && userJobHistories[currentUser.username] ? userJobHistories[currentUser.username] : [];
  const currentLocationHistory = currentUser && userLocationHistories[currentUser.username] ? userLocationHistories[currentUser.username] : [];

  const exportExcelByPeriod = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFFวัน / เดือน / ปี,ผู้บันทึก,ลักษณะงานที่ทำ,สถานที่ทำงาน,เวลาเริ่มทำงาน,เวลาเลิกงาน,OT (ชม.),มาสาย (นาที),หมายเหตุ\n";
    currentPeriodLogs.forEach(l => {
      const dispDate = formatDateToDisplay(l.date);
      csvContent += `${dispDate},"${l.username || 'admin'}","${l.jobDescription || ''}","${l.location || ''}",${l.startTime},${l.endTime},${l.otHours || 0},${l.lateMinutes || 0},"${l.note || ''}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `work_report_${targetUserForCalc}_period_${calcPeriod}_${calcMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportPDFByPeriod = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>รายงานประจำรอบวันที่ ${calcPeriod} - ${calcMonth}</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; }
            p { text-align: center; font-size: 14px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; font-size: 14px; font-weight: bold; text-align: right; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h2>รายงานการทำงานประจำรอบวันที่ ${calcPeriod} (${calcMonth}) - สมาชิก: ${targetUserForCalc}</h2>
          <p>ระบบบันทึกการทำงานประจำวัน (เรียงจากวันที่เก่าไปใหม่)</p>
          <table>
            <thead>
              <tr>
                <th>วัน / เดือน / ปี</th>
                <th>ผู้บันทึก</th>
                <th>ลักษณะงานที่ทำ</th>
                <th>สถานที่ทำงาน</th>
                <th>เวลาเริ่ม</th>
                <th>เวลาเลิก</th>
                <th>OT (ชม.)</th>
                <th>มาสาย (นาที)</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${currentPeriodLogs.length === 0 ? '<tr><td colspan="9" style="text-align:center;">ไม่มีข้อมูลในรอบนี้</td></tr>' : 
                currentPeriodLogs.map(l => {
                  const dispDate = formatDateToDisplay(l.date);
                  return `
                    <tr>
                      <td>${dispDate}</td>
                      <td>${l.username || 'admin'}</td>
                      <td>${l.jobDescription || '-'}</td>
                      <td>${l.location || '-'}</td>
                      <td>${l.startTime}</td>
                      <td>${l.endTime}</td>
                      <td>${l.otHours || 0}</td>
                      <td>${l.lateMinutes || 0}</td>
                      <td>${l.note || '-'}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
          </table>
          <div class="summary">
            รวมวันทำงาน: ${calculatedDaysCount} วัน | เรทค่าแรง: ${activeRateForCalc.rateValue} (${activeRateForCalc.payType}) | ค่าแรงปกติ: ${totalRegularPay.toLocaleString()} บาท | ค่า OT: ${totalOtPay.toLocaleString()} บาท<br>
            หักประกันสังคม (${activeRateForCalc.ssoPercent || 0}%): -${ssoDeduction.toLocaleString()} บาท | หักมาสาย (${totalLateMinutes} นาที): -${lateDeduction.toLocaleString()} บาท<br>
            รวมรายรับสุทธิ: ${grandTotalPay.toLocaleString()} บาท
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className={`min-h-screen p-3 sm:p-6 lg:p-8 font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className={`p-4 sm:p-6 rounded-2xl shadow-sm border flex flex-col lg:flex-row justify-between items-center gap-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} text-2xl`}>📋</div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>ระบบบันทึกการทำงาน</h1>
              {currentUser && (
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${currentUser.role === 'admin' ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-blue-900/50 text-blue-300 border border-blue-700'}`}>
                    {currentUser.role.toUpperCase()}
                  </span>
                  <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    ผู้ใช้งาน: {currentUser.username}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 w-full lg:w-auto">
            {currentUser && (
              <>
                <button 
                  type="button"
                  onClick={() => setActiveTab('log')} 
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer ${activeTab === 'log' ? 'bg-indigo-600 text-white shadow-indigo-500/25 shadow-md' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
                >
                  📋 บันทึกการทำงาน
                </button>

                <button 
                  type="button"
                  onClick={() => setActiveTab('chart')} 
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer ${activeTab === 'chart' ? 'bg-indigo-600 text-white shadow-indigo-500/25 shadow-md' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
                >
                  📊 กราฟสถิติ & KPI
                </button>

                {currentUser.role !== 'admin' && (
                  <button 
                    type="button"
                    onClick={() => setActiveTab('mypass')} 
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer ${activeTab === 'mypass' ? 'bg-indigo-600 text-white shadow-indigo-500/25 shadow-md' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
                  >
                    💰 สรุปรายรับของฉัน
                  </button>
                )}

                {currentUser.role === 'admin' && (
                  <button 
                    type="button"
                    onClick={() => setActiveTab('settings')} 
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-indigo-500/25 shadow-md' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
                  >
                    ⚙️ จัดการระบบ
                  </button>
                )}

                <button 
                  type="button"
                  onClick={() => { setCurrentUser(null); setActiveTab('auth'); }} 
                  className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition border border-red-500/20 cursor-pointer"
                >
                  ออกจากระบบ
                </button>
              </>
            )}

            {!currentUser && (
              <button 
                type="button"
                onClick={() => setActiveTab('auth')} 
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer ${activeTab === 'auth' ? 'bg-indigo-600 text-white shadow-indigo-500/25 shadow-md' : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
              >
                🔐 เข้าสู่ระบบ / สมัครสมาชิก
              </button>
            )}

            <button 
              type="button"
              onClick={() => setDarkMode(!darkMode)} 
              className={`p-2.5 rounded-xl text-sm transition border cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
              title="สลับโหมดมืด/สว่าง"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* TAB 1: บันทึกงาน */}
        {activeTab === 'log' && (
          <div className="space-y-6">
            {!currentUser ? (
              <div className={`p-10 rounded-2xl shadow-sm border text-center space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="text-5xl">🔒</div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>กรุณาเข้าสู่ระบบก่อนใช้งาน</h2>
                <p className={`text-sm max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>คุณต้องเข้าสู่ระบบหรือลงทะเบียนสมาชิกใหม่ และได้รับการอนุมัติจาก Admin ก่อนจึงจะสามารถบันทึกและดูรายการทำงานได้</p>
                <div className="flex justify-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('auth')} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/25 cursor-pointer"
                  >
                    ไปหน้าเข้าสู่ระบบ
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={`p-6 sm:p-8 rounded-2xl shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className={`flex items-center gap-2 mb-6 border-b pb-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className="text-xl">✍️</span>
                    <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>เพิ่มบันทึกประจำวัน</h2>
                  </div>
                  
                  <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        วัน / เดือน / ปี <span className="text-indigo-400 lowercase font-normal">(เลือกวันที่เก่าเพื่อแก้ไขได้)</span>
                      </label>
                      <input 
                        type="date" 
                        required 
                        className={`w-full border px-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white [color-scheme:dark]' : 'bg-slate-50/50 border-slate-200 text-slate-800 [color-scheme:light]'}`} 
                        value={form.date} 
                        onChange={e => setForm({...form, date: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ลักษณะงานที่ทำ</label>
                      <input 
                        type="text" 
                        list="userJobHistoryList"
                        placeholder="ระบุลักษณะงาน..." 
                        required 
                        className={`w-full border px-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`} 
                        value={form.jobDescription} 
                        onChange={e => setForm({...form, jobDescription: e.target.value})} 
                      />
                      <datalist id="userJobHistoryList">
                        {currentJobHistory.map((item, idx) => (
                          <option key={idx} value={item} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>สถานที่ทำงาน</label>
                      <input 
                        type="text" 
                        list="userLocationHistoryList"
                        placeholder="ระบุสถานที่..." 
                        required 
                        className={`w-full border px-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`} 
                        value={form.location} 
                        onChange={e => setForm({...form, location: e.target.value})} 
                      />
                      <datalist id="userLocationHistoryList">
                        {currentLocationHistory.map((item, idx) => (
                          <option key={idx} value={item} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>เวลาเริ่มทำงาน</label>
                      <input 
                        type="time" 
                        required 
                        className={`w-full border px-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`} 
                        value={form.startTime} 
                        onChange={e => setForm({...form, startTime: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>เวลาเลิกงาน</label>
                      <input 
                        type="time" 
                        required 
                        className={`w-full border px-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`} 
                        value={form.endTime} 
                        onChange={e => setForm({...form, endTime: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>จำนวนโอที (ชม.)</label>
                      <input 
                        type="number" 
                        step="0.5" 
                        className={`w-full border px-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`} 
                        value={form.otHours} 
                        onChange={e => setForm({...form, otHours: Number(e.target.value)})} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>มาสาย (นาที)</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="ระบุจำนวนนาทีที่มาสาย..."
                        className={`w-full border px-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`} 
                        value={form.lateMinutes} 
                        onChange={e => setForm({...form, lateMinutes: Number(e.target.value)})} 
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>หมายเหตุ</label>
                      <input 
                        type="text" 
                        placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)..." 
                        className={`w-full border px-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`} 
                        value={form.note} 
                        onChange={e => setForm({...form, note: e.target.value})} 
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
                      <button 
                        type="submit" 
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl transition shadow-lg shadow-indigo-500/25 font-semibold text-sm cursor-pointer"
                      >
                        💾 บันทึกข้อมูลการทำงาน
                      </button>
                    </div>
                  </form>
                </div>

                <div className={`p-6 sm:p-8 rounded-2xl shadow-sm border space-y-5 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>รายงานการทำงาน</h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <button 
                        type="button"
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border flex items-center gap-1.5 cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                        title="คลิกเพื่อสลับการเรียงลำดับวันที่"
                      >
                        {sortOrder === 'desc' ? '🔽 เรียง: ใหม่ไปเก่า' : '🔼 เรียง: เก่าไปใหม่'}
                      </button>

                      <button 
                        type="button"
                        onClick={handlePrintFilteredReport}
                        className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer"
                      >
                        🖨️ พิมพ์รายงานตามที่กรอง (เก่าไปใหม่)
                      </button>
                    </div>
                  </div>

                  <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                    <div className={`grid grid-cols-1 ${currentUser?.role === 'admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
                      {currentUser?.role === 'admin' && (
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>เลือกดูข้อมูลผู้ใช้</label>
                          <select 
                            className={`border px-3 py-2 rounded-xl w-full text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                            value={selectedUserFilter}
                            onChange={e => setSelectedUserFilter(e.target.value)}
                          >
                            <option value="all">👥 ผู้ใช้ทั้งหมด (ทุกคน)</option>
                            <option value="admin">admin (ผู้ดูแลระบบ)</option>
                            {allUsers.map(u => (
                              <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>คำค้นหาทั่วไป</label>
                        <input 
                          type="text" 
                          placeholder="พิมพ์ค้นหาลักษณะงาน / หมายเหตุ..." 
                          className={`border px-3 py-2 rounded-xl w-full text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} 
                          value={search} 
                          onChange={e => setSearch(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>ประเภทการกรองข้อมูล</label>
                        <select 
                          className={`border px-3 py-2 rounded-xl w-full text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                          value={filterMode}
                          onChange={e => setFilterMode(e.target.value)}
                        >
                          <option value="date">📅 กรองตามช่วงวันที่กำหนดเอง</option>
                          <option value="location">📍 กรองตามสถานที่ทำงาน</option>
                          <option value="period10">📌 กรองรอบตัดยอด (วันที่ 10)</option>
                          <option value="period25">📌 กรองรอบตัดยอด (วันที่ 25)</option>
                        </select>
                      </div>
                    </div>

                    {filterMode === 'date' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>ตั้งแต่วันที่</label>
                          <input 
                            type="date" 
                            className={`border px-3 py-2 rounded-xl w-full text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white [color-scheme:dark]' : 'bg-white border-slate-300 [color-scheme:light]'}`} 
                            value={startDateFilter} 
                            onChange={e => setStartDateFilter(e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>ถึงวันที่</label>
                          <input 
                            type="date" 
                            className={`border px-3 py-2 rounded-xl w-full text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white [color-scheme:dark]' : 'bg-white border-slate-300 [color-scheme:light]'}`} 
                            value={endDateFilter} 
                            onChange={e => setEndDateFilter(e.target.value)} 
                          />
                        </div>
                      </div>
                    )}

                    {filterMode === 'location' && (
                      <div className="pt-1">
                        <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>ระบุชื่อสถานที่ทำงานที่ต้องการค้นหา</label>
                        <input 
                          type="text" 
                          placeholder="เช่น พังงา, กรุงเทพฯ..." 
                          className={`border px-3 py-2 rounded-xl w-full text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} 
                          value={locationFilter} 
                          onChange={e => setLocationFilter(e.target.value)} 
                        />
                      </div>
                    )}

                    {(filterMode === 'period10' || filterMode === 'period25') && (
                      <div className="pt-1">
                        <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>เลือกเดือนสำหรับรอบตัดยอด {filterMode === 'period10' ? 'วันที่ 10' : 'วันที่ 25'}</label>
                        <input 
                          type="month" 
                          className={`border px-3 py-2 rounded-xl w-full sm:w-64 text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white [color-scheme:dark]' : 'bg-white border-slate-300 [color-scheme:light]'}`} 
                          value={calcMonth} 
                          onChange={e => setCalcMonth(e.target.value)} 
                        />
                      </div>
                    )}
                  </div>

                  <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className={`text-xs uppercase tracking-wider border-b ${darkMode ? 'bg-slate-800 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          <th className="p-3.5">วัน / เดือน / ปี</th>
                          <th className="p-3.5">ผู้บันทึก</th>
                          <th className="p-3.5">ลักษณะงาน</th>
                          <th className="p-3.5">สถานที่</th>
                          <th className="p-3.5">เวลาเริ่ม</th>
                          <th className="p-3.5">เวลาเลิก</th>
                          <th className="p-3.5">OT (ชม.)</th>
                          <th className="p-3.5">มาสาย (นาที)</th>
                          <th className="p-3.5">หมายเหตุ</th>
                          {currentUser?.role === 'admin' && <th className="p-3.5 text-center">จัดการ</th>}
                        </tr>
                      </thead>
                      <tbody className={`text-sm divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {displayedLogs.length === 0 ? (
                          <tr>
                            <td colSpan={currentUser?.role === 'admin' ? 10 : 9} className="text-center p-8 text-slate-400">ไม่พบข้อมูลการทำงานตามเงื่อนไขที่กำหนด</td>
                          </tr>
                        ) : (
                          displayedLogs.map(l => (
                            <tr key={l._id || l.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}`}>
                              <td className="p-3.5 whitespace-nowrap font-medium text-indigo-400">{formatDateToDisplay(l.date)}</td>
                              <td className="p-3.5 whitespace-nowrap font-semibold">{l.username || 'admin'}</td>
                              <td className="p-3.5 font-medium">{l.jobDescription || '-'}</td>
                              <td className="p-3.5">{l.location || '-'}</td>
                              <td className="p-3.5 whitespace-nowrap">{l.startTime}</td>
                              <td className="p-3.5 whitespace-nowrap">{l.endTime}</td>
                              <td className="p-3.5 font-semibold text-indigo-500">{l.otHours || 0}</td>
                              <td className="p-3.5 font-semibold text-red-400">{l.lateMinutes || 0}</td>
                              <td className={`p-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{l.note || '-'}</td>
                              {currentUser?.role === 'admin' && (
                                <td className="p-3.5 text-center space-x-1.5 whitespace-nowrap">
                                  <button 
                                    type="button"
                                    onClick={() => setEditingLog({ ...l })} 
                                    className="bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition border border-amber-500/20 cursor-pointer"
                                  >
                                    แก้ไข
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleDeleteLog(l._id || l.id)} 
                                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition border border-red-500/20 cursor-pointer"
                                  >
                                    ลบ
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-4 text-sm ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>พบข้อมูลทั้งหมด: </span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{filteredLogs.length} รายการ</span>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>รวม OT: </span>
                        <span className="font-bold text-indigo-500">{totalFilteredOtHours} ชั่วโมง</span>
                      </div>
                      {currentUser?.role === 'admin' && (
                        <div>
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>รวมเงิน OT: </span>
                          <span className="font-bold text-green-500">{totalFilteredOtPay.toLocaleString()} บาท</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>แสดงหน้า {page} จาก {totalPages || 1}</span>
                    <div className="space-x-2">
                      <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)} className={`px-4 py-2 border rounded-xl text-xs sm:text-sm disabled:opacity-40 transition cursor-pointer ${darkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-gray-100 text-slate-700'}`}>ก่อนหน้า</button>
                      <button type="button" disabled={page >= totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} className={`px-4 py-2 border rounded-xl text-xs sm:text-sm disabled:opacity-40 transition cursor-pointer ${darkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-gray-100 text-slate-700'}`}>ถัดไป</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: สรุปรายรับของฉัน (พนักงานธรรมดา - พร้อม KPI Cards สวยๆ) */}
        {activeTab === 'mypass' && currentUser && currentUser.role !== 'admin' && (
          <div className={`p-6 sm:p-8 rounded-2xl shadow-sm border space-y-6 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className={`border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div>
                <h2 className="text-xl font-bold text-indigo-400">💰 สรุปรายรับและ KPI ของฉัน ({currentUser.username})</h2>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ตรวจสอบยอดเงินสุทธิและสถิติภาพรวมประจำรอบ</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input 
                  type="month" 
                  className={`border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white [color-scheme:dark]' : 'bg-white border-slate-300 [color-scheme:light]'}`} 
                  value={calcMonth} 
                  onChange={e => setCalcMonth(e.target.value)} 
                />
                <select 
                  className={`border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                  value={calcPeriod}
                  onChange={e => setCalcPeriod(e.target.value)}
                >
                  <option value="10">รอบวันที่ 10</option>
                  <option value="25">รอบวันที่ 25</option>
                </select>
              </div>
            </div>

            {/* KPI Cards สรุปตัวเลขเด่นๆ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-2 ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
                  <span>วันทำงานทั้งหมด</span>
                  <span className="text-lg">🗓️</span>
                </div>
                <div>
                  <div className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{myDaysCount} วัน</div>
                  <div className="text-xs text-indigo-400 mt-1">เรท {myActiveRate.rateValue} บาท ({myActiveRate.payType === 'daily' ? 'รายวัน' : 'รายชั่วโมง'})</div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-2 ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
                  <span>ชั่วโมง OT สะสม</span>
                  <span className="text-lg">⏰</span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-amber-500">
                    {myPeriodLogs.reduce((sum, l) => sum + (Number(l.otHours) || 0), 0)} ชม.
                  </div>
                  <div className="text-xs text-amber-400/80 mt-1">ค่า OT ~{myOtPay.toLocaleString()} บาท</div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-2 ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
                  <span>มาสายรวม</span>
                  <span className="text-lg">⚠️</span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-red-400">{myLateMinutesCount} นาที</div>
                  <div className="text-xs text-red-400/80 mt-1">หักเงิน ~{myLateDeduction.toLocaleString()} บาท</div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-2 bg-gradient-to-br ${darkMode ? 'from-indigo-950/40 to-purple-950/40 border-indigo-500/30' : 'from-indigo-50 to-purple-50 border-indigo-200'}`}>
                <div className="flex justify-between items-center text-indigo-400 text-xs font-semibold uppercase">
                  <span>รายรับสุทธิประมาณการ</span>
                  <span className="text-lg">💵</span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-green-500">{myGrandTotalPay.toLocaleString()} บาท</div>
                  <div className="text-xs text-slate-400 mt-1">หลังหักประกันสังคม ({myActiveRate.ssoPercent}%) แล้ว</div>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className="text-sm font-bold text-indigo-400 mb-2">📋 รายละเอียดการคำนวณเงิน</h3>
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>ยอดค่าแรงปกติ:</span>
                <span className="font-bold text-blue-500">{myRegularPay.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>ยอดค่าโอที (OT @ {myActiveRate.otRatePerHour} บ./ชม.):</span>
                <span className="font-bold text-amber-500">{myOtPay.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>หัก ประกันสังคม ({myActiveRate.ssoPercent}%):</span>
                <span className="font-bold text-red-400">-{mySsoDeduction.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>หัก มาสายรวม ({myLateMinutesCount} นาที):</span>
                <span className="font-bold text-red-400">-{myLateDeduction.toLocaleString()} บาท</span>
              </div>
              <div className={`flex justify-between text-base pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>รวมรายรับสุทธิของคุณ:</span>
                <span className="font-bold text-green-500 text-xl">{myGrandTotalPay.toLocaleString()} บาท</span>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-3">
                <button type="button" onClick={() => {
                  let csvContent = "data:text/csv;charset=utf-8,\uFEFFวัน / เดือน / ปี,ผู้บันทึก,ลักษณะงานที่ทำ,สถานที่ทำงาน,เวลาเริ่มทำงาน,เวลาเลิกงาน,OT (ชม.),มาสาย (นาที),หมายเหตุ\n";
                  myPeriodLogs.forEach(l => {
                    const dispDate = formatDateToDisplay(l.date);
                    csvContent += `${dispDate},"${l.username}","${l.jobDescription || ''}","${l.location || ''}",${l.startTime},${l.endTime},${l.otHours || 0},${l.lateMinutes || 0},"${l.note || ''}"\n`;
                  });
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `my_work_report_${currentUser.username}_${calcMonth}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer">
                  📥 ดาวน์โหลด Excel ของฉัน
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal สำหรับ Admin แก้ไขรายการทำงาน */}
        {editingLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-2xl p-6 sm:p-8 rounded-2xl shadow-xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
              <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-700/50">
                <h3 className="text-lg font-bold">✏️ แก้ไขรายการทำงาน (Admin)</h3>
                <button 
                  type="button"
                  onClick={() => setEditingLog(null)} 
                  className="text-slate-400 hover:text-red-500 text-xl font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateLog} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>วัน / เดือน / ปี</label>
                  <input 
                    type="date" 
                    required 
                    className={`w-full border px-3.5 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white [color-scheme:dark]' : 'bg-slate-50 border-slate-200 [color-scheme:light]'}`} 
                    value={editingLog.date || ''} 
                    onChange={e => setEditingLog({...editingLog, date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ลักษณะงาน</label>
                  <input 
                    type="text" 
                    required 
                    className={`w-full border px-3.5 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={editingLog.jobDescription || ''} 
                    onChange={e => setEditingLog({...editingLog, jobDescription: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>สถานที่ทำงาน</label>
                  <input 
                    type="text" 
                    required 
                    className={`w-full border px-3.5 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={editingLog.location || ''} 
                    onChange={e => setEditingLog({...editingLog, location: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>จำนวน OT (ชม.)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    className={`w-full border px-3.5 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={editingLog.otHours || 0} 
                    onChange={e => setEditingLog({...editingLog, otHours: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>เวลาเริ่ม</label>
                  <input 
                    type="time" 
                    required 
                    className={`w-full border px-3.5 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={editingLog.startTime || '08:00'} 
                    onChange={e => setEditingLog({...editingLog, startTime: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>เวลาเลิก</label>
                  <input 
                    type="time" 
                    required 
                    className={`w-full border px-3.5 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={editingLog.endTime || '17:00'} 
                    onChange={e => setEditingLog({...editingLog, endTime: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>มาสาย (นาที)</label>
                  <input 
                    type="number" 
                    min="0"
                    className={`w-full border px-3.5 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={editingLog.lateMinutes || 0} 
                    onChange={e => setEditingLog({...editingLog, lateMinutes: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>หมายเหตุ</label>
                  <input 
                    type="text" 
                    className={`w-full border px-3.5 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={editingLog.note || ''} 
                    onChange={e => setEditingLog({...editingLog, note: e.target.value})} 
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                  <button 
                    type="button" 
                    onClick={() => setEditingLog(null)} 
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/25 cursor-pointer"
                  >
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB: กราฟสถิติ (แบบ Premium Gradient Bars สวยหรู) */}
        {activeTab === 'chart' && currentUser && (
          <div className={`p-6 sm:p-8 rounded-2xl shadow-sm border space-y-6 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>📊 กราฟสถิติสถานที่ทำงาน & วิเคราะห์ไซท์งาน</h2>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>เปรียบเทียบสถิติจำนวนวันทำงานและชั่วโมง OT ในแต่ละพื้นที่</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input 
                  type="month" 
                  className={`border px-3 py-2 rounded-xl text-sm outline-none w-full sm:w-auto ${darkMode ? 'bg-slate-800 border-slate-700 text-white [color-scheme:dark]' : 'bg-white border-slate-300 [color-scheme:light]'}`}
                  value={chartMonth}
                  onChange={e => setChartMonth(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setChartMonth('')}
                  className={`px-3.5 py-2 rounded-xl text-xs border transition w-full sm:w-auto cursor-pointer ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'}`}
                >
                  ทุกเดือน
                </button>
              </div>
            </div>

            <div className={`p-6 sm:p-8 rounded-2xl border space-y-8 ${darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
              {locationArray.length === 0 ? (
                <div className="text-center py-12 text-slate-400">ไม่พบข้อมูลการทำงานในเดือนนี้</div>
              ) : (
                locationArray.map((item, idx) => {
                  const percent = Math.min(Math.round((item.totalDays / maxDays) * 100), 100);
                  return (
                    <div key={idx} className="space-y-2.5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-sm">
                        <span className={`font-bold flex items-center gap-2 text-base ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                          📍 {item.location}
                        </span>
                        <div className={`text-xs px-3 py-1 rounded-full border flex items-center gap-3 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                          <span>วันทำงาน: <strong className="text-indigo-400">{item.totalDays} วัน</strong></span>
                          <span className="text-slate-500">|</span>
                          <span>OT สะสม: <strong className="text-emerald-400">{item.totalOt} ชม.</strong></span>
                        </div>
                      </div>
                      
                      {/* แท่งกราฟแบบ Gradient ไล่สีพร้อมมิติเงาเรืองแสง */}
                      <div className={`w-full h-4 rounded-full overflow-hidden p-0.5 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                          style={{ width: `${Math.max(percent, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: เข้าสู่ระบบ / สมัครสมาชิก */}
        {activeTab === 'auth' && (
          <div className={`max-w-md mx-auto p-6 sm:p-8 rounded-2xl shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className={`flex justify-center gap-6 mb-6 border-b pb-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <button 
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                className={`font-semibold text-sm transition pb-1 border-b-2 cursor-pointer ${authMode === 'login' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-slate-400'}`}
              >
                เข้าสู่ระบบ
              </button>
              <button 
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                className={`font-semibold text-sm transition pb-1 border-b-2 cursor-pointer ${authMode === 'register' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-slate-400'}`}
              >
                ลงทะเบียนสมาชิกใหม่
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <h3 className={`text-base font-bold text-center mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>🔐 เข้าสู่ระบบใช้งาน</h3>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ชื่อผู้ใช้ (Username)</label>
                  <input 
                    type="text" 
                    required 
                    className={`w-full border px-4 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`}
                    value={authInput.username}
                    onChange={e => setAuthInput({...authInput, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>รหัสผ่าน (Password)</label>
                  <input 
                    type="password" 
                    required 
                    className={`w-full border px-4 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`}
                    value={authInput.password}
                    onChange={e => setAuthInput({...authInput, password: e.target.value})}
                  />
                </div>
                {authError && <p className="text-red-400 text-xs text-center font-medium">{authError}</p>}
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition font-semibold text-sm shadow-lg shadow-indigo-500/25 cursor-pointer">
                  เข้าสู่ระบบ
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <h3 className={`text-base font-bold text-center mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>📝 ลงทะเบียนขอใช้งาน</h3>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>กำหนดชื่อผู้ใช้ (Username)</label>
                  <input 
                    type="text" 
                    required 
                    className={`w-full border px-4 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`}
                    value={authInput.username}
                    onChange={e => setAuthInput({...authInput, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>กำหนดรหัสผ่าน (Password)</label>
                  <input 
                    type="password" 
                    required 
                    className={`w-full border px-4 py-2.5 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-800'}`}
                    value={authInput.password}
                    onChange={e => setAuthInput({...authInput, password: e.target.value})}
                  />
                </div>
                {authError && <p className="text-red-400 text-xs text-center font-medium">{authError}</p>}
                {authSuccess && <p className="text-green-500 text-xs text-center font-medium">{authSuccess}</p>}
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl transition font-semibold text-sm shadow-lg shadow-green-500/25 cursor-pointer">
                  ส่งคำขอลงทะเบียน (รออนุมัติ)
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: Admin Control Panel / กำหนดเรทรายบุคคล */}
        {activeTab === 'settings' && currentUser?.role === 'admin' && (
          <div className={`p-6 sm:p-8 rounded-2xl shadow-sm border transition-colors duration-300 space-y-8 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div>
                <h2 className="text-xl font-bold text-purple-400">👑 เมนูผู้ดูแลระบบ & กำหนดเรทรายบุคคล</h2>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>จัดการสมาชิก ตั้งค่าเรทมาตรฐาน และตั้งค่าเรทค่าแรงเฉพาะบุคคลได้</p>
              </div>
              <button 
                type="button" 
                onClick={handleBackupAllData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm"
              >
                💾 สำรองข้อมูลระบบ (Backup JSON)
              </button>
            </div>

            {/* ส่วนตั้งค่าเรทแยกตามรายบุคคล (คำนวณ OT อัตโนมัติ: (ค่าแรง/8)*1.5 ) */}
            <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
              <h3 className="text-sm font-bold text-indigo-400">👤 กำหนดเรทค่าแรงแยกตามรายบุคคล (คำนวณ OT อัตโนมัติ)</h3>
              <form onSubmit={handleSaveUserCustomRate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>เลือกสมาชิกที่ต้องการตั้งค่าเรทเฉพาะ</label>
                    <select 
                      className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                      value={targetUserRateEdit}
                      onChange={e => setTargetUserRateEdit(e.target.value)}
                    >
                      <option value="admin">admin (ผู้ดูแลระบบ)</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>ประเภทการคิด</label>
                    <select 
                      className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                      value={customUserRateForm.payType}
                      onChange={e => setCustomUserRateForm({...customUserRateForm, payType: e.target.value})}
                    >
                      <option value="daily">รายวัน</option>
                      <option value="hourly">รายชั่วโมง</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>เรทค่าแรง ({customUserRateForm.payType === 'daily' ? 'บ./วัน' : 'บ./ชม.'})</label>
                    <input 
                      type="number" 
                      className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                      value={customUserRateForm.rateValue}
                      onChange={e => {
                        const val = Number(e.target.value);
                        const autoOt = customUserRateForm.payType === 'daily' ? Number(((val / 8) * 1.5).toFixed(2)) : customUserRateForm.otRatePerHour;
                        setCustomUserRateForm({
                          ...customUserRateForm,
                          rateValue: val,
                          otRatePerHour: autoOt
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>เรท OT (คำนวณอัตโนมัติ)</label>
                    <input 
                      type="number" 
                      readOnly
                      className={`w-full border px-3 py-2 rounded-xl text-sm outline-none opacity-75 cursor-not-allowed ${darkMode ? 'bg-slate-900 border-slate-700 text-indigo-400 font-bold' : 'bg-slate-100 border-slate-300 text-indigo-600 font-bold'}`}
                      value={Number(((customUserRateForm.rateValue / 8) * 1.5).toFixed(2))}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>หักประกันสังคม (%)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                      value={customUserRateForm.ssoPercent}
                      onChange={e => setCustomUserRateForm({...customUserRateForm, ssoPercent: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>หักมาสาย (บ./นาที)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                      value={customUserRateForm.lateRatePerMinute}
                      onChange={e => setCustomUserRateForm({...customUserRateForm, lateRatePerMinute: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl transition text-sm font-semibold cursor-pointer">
                    💾 บันทึกเรทเฉพาะบุคคลนี้
                  </button>
                </div>
              </form>
            </div>

            <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
              <h3 className="text-sm font-bold text-indigo-400">➕ เพิ่มบัญชีสมาชิกใหม่ (โดย Admin)</h3>
              <form onSubmit={handleAdminAddUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>ชื่อผู้ใช้</label>
                  <input type="text" required className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} value={adminNewUser.username} onChange={e => setAdminNewUser({...adminNewUser, username: e.target.value})} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>รหัสผ่าน</label>
                  <input type="password" required className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} value={adminNewUser.password} onChange={e => setAdminNewUser({...adminNewUser, password: e.target.value})} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>ระดับสิทธิ์</label>
                  <select className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} value={adminNewUser.role} onChange={e => setAdminNewUser({...adminNewUser, role: e.target.value})}>
                    <option value="user">User (ผู้ใช้งานทั่วไป)</option>
                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl transition text-sm font-semibold cursor-pointer">เพิ่มสมาชิก</button>
                </div>
              </form>
            </div>

            <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>👥 รายชื่อสมาชิกทั้งหมดและการจัดการ</h3>
              <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <table className="w-full text-left border-collapse text-sm min-w-[600px]">
                  <thead>
                    <tr className={`border-b text-xs uppercase tracking-wider ${darkMode ? 'border-slate-800 text-slate-400 bg-slate-800/50' : 'border-slate-200 text-slate-500 bg-slate-50'}`}>
                      <th className="p-3">ชื่อผู้ใช้</th>
                      <th className="p-3">สิทธิ์</th>
                      <th className="p-3">สถานะ</th>
                      <th className="p-3 text-center">จัดการสถานะ</th>
                      <th className="p-3 text-center">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {allUsers.map(u => (
                      <tr key={u.id}>
                        <td className={`p-3 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{u.username}</td>
                        <td className="p-3 uppercase text-xs text-slate-400">{u.role}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border dark:border-green-700' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 dark:border dark:border-amber-700'}`}>
                            {u.status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          {u.role !== 'admin' && u.status !== 'approved' && (
                            <button type="button" onClick={() => handleUpdateUserStatus(u.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer">อนุมัติ</button>
                          )}
                          {u.role !== 'admin' && u.status === 'approved' && (
                            <button type="button" onClick={() => handleUpdateUserStatus(u.id, 'rejected')} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer">ระงับ</button>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {u.username !== 'admin' && (
                            <button type="button" onClick={() => handleDeleteUser(u.id)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 rounded-lg text-xs font-semibold transition border border-red-500/20 cursor-pointer">ลบ</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <form onSubmit={handleUpdateSettings} className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
              <h3 className="text-sm font-bold text-indigo-400">📝 กำหนดเรทค่าจ้างกลาง (ค่าเริ่มต้นของระบบ)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>ประเภทการคิดค่าแรง</label>
                  <select className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} value={settings.payType} onChange={e => setSettings({...settings, payType: e.target.value})}>
                    <option value="daily">รายวัน (Fixed Daily)</option>
                    <option value="hourly">รายชั่วโมง (Hourly)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>เรทค่าแรงกลาง ({settings.payType === 'daily' ? 'บาท/วัน' : 'บาท/ชม.'})</label>
                  <input type="number" className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} value={settings.rateValue} onChange={e => {
                    const val = Number(e.target.value);
                    const autoOt = Number(((val / 8) * 1.5).toFixed(2));
                    setSettings({...settings, rateValue: val, otRatePerHour: autoOt});
                  }} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>เรท OT กลาง (คำนวณอัตโนมัติ)</label>
                  <input type="number" readOnly className={`w-full border px-3 py-2 rounded-xl text-sm outline-none opacity-75 cursor-not-allowed ${darkMode ? 'bg-slate-900 border-slate-700 text-indigo-400 font-bold' : 'bg-slate-100 border-slate-300 text-indigo-600 font-bold'}`} value={Number(((settings.rateValue / 8) * 1.5).toFixed(2))} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>หักประกันสังคม (%)</label>
                  <input type="number" step="0.1" className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} value={settings.ssoPercent} onChange={e => setSettings({...settings, ssoPercent: Number(e.target.value)})} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>หักมาสาย (บาท / นาที)</label>
                  <input type="number" step="0.5" className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} value={settings.lateRatePerMinute} onChange={e => setSettings({...settings, lateRatePerMinute: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition text-sm font-semibold cursor-pointer">บันทึกเรทกลาง</button>
              </div>
            </form>

            <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
              <h3 className="text-sm font-bold text-indigo-400">📄 คำนวณค่าแรงและออกรายงานให้สมาชิก (รายคน)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>เลือกสมาชิกที่ต้องการคิดค่าแรง</label>
                  <select 
                    className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                    value={calcSelectedUser}
                    onChange={e => setCalcSelectedUser(e.target.value)}
                  >
                    <option value="admin">admin (ผู้ดูแลระบบ)</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>เลือกเดือนของรายงาน</label>
                  <input 
                    type="month" 
                    className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white [color-scheme:dark]' : 'bg-white border-slate-300 [color-scheme:light]'}`} 
                    value={calcMonth} 
                    onChange={e => setCalcMonth(e.target.value)} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>เลือกรอบการตัดยอดรายงาน</label>
                  <select 
                    className={`w-full border px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                    value={calcPeriod}
                    onChange={e => setCalcPeriod(e.target.value)}
                  >
                    <option value="10">รอบวันที่ 10 (ตัดยอด 26 เดือนก่อน ถึง 10 เดือนนี้)</option>
                    <option value="25">รอบวันที่ 25 (ตัดยอด 11 ถึง 25 เดือนนี้)</option>
                  </select>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>จำนวนวันทำงานของ <strong className="text-indigo-400">{targetUserForCalc}</strong> ในรอบนี้:</span>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{calculatedDaysCount} วัน</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>เรทที่ใช้คำนวณ:</span>
                  <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {activeRateForCalc.rateValue} บาท ({activeRateForCalc.payType === 'daily' ? 'รายวัน' : 'รายชั่วโมง'}) | OT: {activeRateForCalc.otRatePerHour} บ./ชม.
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>ยอดค่าแรงปกติรวม:</span>
                  <span className="font-bold text-blue-500">{totalRegularPay.toLocaleString()} บาท</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>ยอดค่าโอที (OT) รวม:</span>
                  <span className="font-bold text-amber-500">{totalOtPay.toLocaleString()} บาท</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>หัก ประกันสังคม ({activeRateForCalc.ssoPercent || 0}%):</span>
                  <span className="font-bold text-red-400">-{ssoDeduction.toLocaleString()} บาท</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>หัก มาสายรวม ({totalLateMinutes} นาที @ {activeRateForCalc.lateRatePerMinute || 0} บาท/นาที):</span>
                  <span className="font-bold text-red-400">-{lateDeduction.toLocaleString()} บาท</span>
                </div>
                <div className={`flex justify-between text-base pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>รวมรายรับสุทธิของ {targetUserForCalc}:</span>
                  <span className="font-bold text-green-500 text-xl">{grandTotalPay.toLocaleString()} บาท</span>
                </div>

                <div className="flex flex-wrap justify-end gap-3 pt-3">
                  <button type="button" onClick={exportExcelByPeriod} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer">
                    📥 บันทึกเป็น Excel (CSV)
                  </button>
                  <button type="button" onClick={exportPDFByPeriod} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer">
                    🖨️ พิมพ์ / บันทึกเป็น PDF
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}