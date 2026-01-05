# 🚀 HƯỚNG DẪN CHẠY HỆ THỐNG (SQLite - SIÊU ĐƠN GIẢN!)

## ✅ Đã chuyển sang SQLite - Không cần cài SQL Server!

### Bước 1: Cài đặt dependencies
```bash
cd backend
npm install
```

**Lưu ý:** `npm install` sẽ tự động cài SQLite, không cần tải gì thêm!

### Bước 2: Tạo file .env
```bash
copy .env.example .env
```

File `.env` sẽ có nội dung:
```env
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

### Bước 3: Chạy server
```bash
npm start
```

**Chỉ vậy thôi!** 🎉

Database sẽ tự động:
- ✅ Tạo file `inventory.db`
- ✅ Tạo tất cả bảng
- ✅ Thêm dữ liệu mẫu

### Bước 4: Mở frontend
Mở file: `frontend/index.html` trong trình duyệt

### Đăng nhập:
```
Username: admin
Password: admin123
```

---

## 📁 File database

Database được lưu tại: `backend/inventory.db`

Bạn có thể xem database bằng:
- **DB Browser for SQLite**: https://sqlitebrowser.org/ (miễn phí, dễ dùng)
- Hoặc xem trực tiếp qua VS Code extension: "SQLite Viewer"

---

## ❓ Nếu có lỗi

### Lỗi: "Cannot find module 'better-sqlite3'"
```bash
cd backend
npm install better-sqlite3
```

### Lỗi: Port 3000 đã được sử dụng
Đổi `PORT=3000` thành `PORT=3001` trong file `.env`

### Database bị lỗi
Xóa file `backend/inventory.db` và chạy lại `npm start`

---

## 🎯 So sánh SQL Server vs SQLite

| SQL Server (Trước) | SQLite (Bây giờ) |
|-------------------|------------------|
| ❌ Phải cài SQL Server (vài GB) | ✅ Không cần cài gì |
| ❌ Phải cài SSMS | ✅ Không cần tool |
| ❌ Phức tạp | ✅ Cực kỳ đơn giản |
| ❌ Nhiều bước setup | ✅ Chỉ 3 bước! |

---

## 🌟 Ưu điểm SQLite

- ✅ Database là 1 file duy nhất
- ✅ Dễ dàng backup (copy file .db)
- ✅ Không cần server riêng
- ✅ Phù hợp cho học tập/demo
- ✅ Hiệu suất tốt cho ứng dụng nhỏ

---

## 📚 Các bước chi tiết

### 1. Cài Node.js (nếu chưa có)
Tải tại: https://nodejs.org/ (Chọn LTS version)

### 2. Mở terminal trong VS Code
- Nhấn `` Ctrl + ` `` hoặc View → Terminal
- Chạy các lệnh bên trên

### 3. Kiểm tra server đã chạy
Mở trình duyệt: http://localhost:3000/api/health

Nếu thấy `{"success": true, ...}` → Thành công! 🎉

---

**LƯU Ý:** 
- Frontend không cần thay đổi gì cả!
- Tất cả chức năng vẫn hoạt động bình thường
- SQLite phù hợp cho học tập và demo
- Nếu cần deploy production, có thể nâng cấp lên PostgreSQL hoặc MySQL sau
