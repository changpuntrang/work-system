  // ฟังก์ชันเปลี่ยนรหัสผ่านใช้งานจริง
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: 'รหัสผ่านใหม่ไม่ตรงกัน กรุณากรอกใหม่อีกครั้ง', type: 'error' });
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setPasswordMessage({ text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษรขึ้นไป', type: 'error' });
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id || currentUser.id,
          username: currentUser.username,
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setPasswordMessage({ text: 'เปลี่ยนรหัสผ่านสำเร็จ! สามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที', type: 'success' });
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage({ text: data.message || 'รหัสผ่านเดิมไม่ถูกต้อง', type: 'error' });
      }
    } catch (err) {
      setPasswordMessage({ text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', type: 'error' });
    }
  };
