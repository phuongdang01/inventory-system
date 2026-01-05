# HỆ THỐNG QUẢN LÝ XUẤT NHẬP KHO

## Mô tả dự án
Hệ thống quản lý kho hàng toàn diện với các chức năng:
- Quản lý sản phẩm và danh mục
- Quản lý phiếu nhập/xuất kho
- Báo cáo tồn kho và xuất nhập tồn
- Dashboard thống kê
- Cảnh báo tồn kho
- Quản lý người dùng với phân quyền

## Công nghệ sử dụng

### Backend
- **Node.js** + **Express.js** - API Server
- **SQL Server** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **HTML5** + **CSS3** + **JavaScript** (Vanilla)
- **Font Awesome** - Icons
- Responsive design

## Cấu trúc dự án

```
InventoryManagementSystem/
├── database/
│   ├── schema.sql              # Database schema
│   ├── stored_procedures.sql   # Stored procedures
│   └── sample_data.sql         # Dữ liệu mẫu
├── backend/
│   ├── config/
│   │   └── database.js         # Cấu hình database
│   ├── middleware/
│   │   └── auth.js             # Authentication middleware
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   ├── products.js         # Products routes
│   │   ├── imports.js          # Import orders routes
│   │   ├── exports.js          # Export orders routes
│   │   └── reports.js          # Reports routes
│   ├── server.js               # Main server file
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── config.js
    │   ├── auth.js
    │   ├── api.js
    │   ├── app.js
    │   └── pages/
    │       ├── dashboard.js
    │       ├── products.js
    │       ├── imports.js
    │       ├── exports.js
    │       ├── inventory.js
    │       └── reports.js
    └── index.html
```

## Hướng dẫn cài đặt

### 1. Cài đặt SQL Server

Tải và cài đặt SQL Server hoặc SQL Server Express:
- https://www.microsoft.com/en-us/sql-server/sql-server-downloads

Hoặc sử dụng SQL Server đã có sẵn.

### 2. Tạo Database

1. Mở SQL Server Management Studio (SSMS)
2. Kết nối đến SQL Server
3. Chạy các file SQL theo thứ tự:
   ```
   database/schema.sql
   database/stored_procedures.sql
   database/sample_data.sql
   ```# Bước 1: Cài dependencies
cd backend
npm install

# Bước 2: Tạo file .env
copy .env.example .env

# Bước 3: Chạy!
npm start

### 3. Cài đặt Backend

1. Di chuyển đến thư mục backend:
   ```bash
   cd backend
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   ```

3. Tạo file `.env` từ `.env.example`:
   ```bash
   copy .env.example .env
   ```

4. Cập nhật thông tin kết nối trong file `.env`:
   ```
   DB_SERVER=localhost
   DB_PORT=1433
   DB_USER=sa
   DB_PASSWORD=YourPassword123
   DB_NAME=InventoryManagementDB
   
   JWT_SECRET=your-secret-key-change-this
   JWT_EXPIRES_IN=24h
   
   PORT=3000
   NODE_ENV=development
   ```

5. Khởi động server:
   ```bash
   npm start
   ```
   
   Hoặc sử dụng nodemon cho development:
   ```bash
   npm run dev
   ```

Server sẽ chạy tại: http://localhost:3000

### 4. Cài đặt Frontend

1. Mở file `frontend/index.html` bằng trình duyệt
2. Hoặc sử dụng Live Server trong VS Code

**Lưu ý:** Đảm bảo backend đang chạy trước khi mở frontend.

## Tài khoản đăng nhập mặc định

```
Admin:
- Username: admin
- Password: admin123

Manager:
- Username: manager1
- Password: manager123

Staff:
- Username: staff1
- Password: staff123
```

## API Endpoints

### Authentication
- POST `/api/auth/login` - Đăng nhập
- GET `/api/auth/me` - Lấy thông tin user hiện tại

### Products
- GET `/api/products` - Danh sách sản phẩm
- GET `/api/products/:id` - Chi tiết sản phẩm
- POST `/api/products` - Thêm sản phẩm (Admin/Manager)
- PUT `/api/products/:id` - Cập nhật sản phẩm (Admin/Manager)
- DELETE `/api/products/:id` - Xóa sản phẩm (Admin)

### Import Orders
- GET `/api/imports` - Danh sách phiếu nhập
- GET `/api/imports/:id` - Chi tiết phiếu nhập
- POST `/api/imports` - Tạo phiếu nhập
- POST `/api/imports/:id/approve` - Duyệt phiếu nhập (Admin/Manager)
- POST `/api/imports/:id/cancel` - Hủy phiếu nhập (Admin/Manager)

### Export Orders
- GET `/api/exports` - Danh sách phiếu xuất
- GET `/api/exports/:id` - Chi tiết phiếu xuất
- POST `/api/exports` - Tạo phiếu xuất
- POST `/api/exports/:id/approve` - Duyệt phiếu xuất (Admin/Manager)
- POST `/api/exports/:id/cancel` - Hủy phiếu xuất (Admin/Manager)

### Reports
- GET `/api/reports/dashboard` - Dashboard data
- GET `/api/reports/inventory` - Báo cáo tồn kho
- GET `/api/reports/movement` - Báo cáo xuất nhập tồn
- GET `/api/reports/statistics` - Thống kê

## Tính năng chính

### 1. Quản lý sản phẩm
- Thêm, sửa, xóa sản phẩm
- Phân loại theo danh mục
- Thiết lập mức tồn kho min/max
- Quản lý đơn giá

### 2. Quản lý phiếu nhập
- Tạo phiếu nhập từ nhà cung cấp
- Thêm nhiều sản phẩm vào 1 phiếu
- Duyệt phiếu để cập nhật tồn kho
- Theo dõi trạng thái phiếu

### 3. Quản lý phiếu xuất
- Tạo phiếu xuất cho khách hàng
- Hỗ trợ nhiều loại xuất: Bán, Chuyển kho, Trả hàng, Hao hụt
- Kiểm tra tồn kho trước khi xuất
- Duyệt phiếu để trừ tồn kho

### 4. Báo cáo & Thống kê
- Dashboard tổng quan
- Báo cáo tồn kho theo sản phẩm/kho
- Báo cáo xuất nhập tồn theo thời gian
- Cảnh báo tồn kho thấp/cao
- Lịch sử giao dịch

### 5. Phân quyền người dùng
- **Admin**: Toàn quyền
- **Manager**: Quản lý và duyệt phiếu
- **Staff**: Tạo phiếu và xem báo cáo

## Database Schema

### Các bảng chính:
- **Users**: Người dùng
- **Warehouses**: Kho hàng
- **Categories**: Danh mục sản phẩm
- **Products**: Sản phẩm
- **Suppliers**: Nhà cung cấp
- **Customers**: Khách hàng
- **Inventory**: Tồn kho
- **ImportOrders** + **ImportOrderDetails**: Phiếu nhập
- **ExportOrders** + **ExportOrderDetails**: Phiếu xuất
- **TransactionHistory**: Lịch sử giao dịch
- **StockAlerts**: Cảnh báo tồn kho

## Troubleshooting

### Backend không khởi động được
1. Kiểm tra SQL Server đã chạy chưa
2. Kiểm tra thông tin kết nối trong `.env`
3. Kiểm tra port 3000 có bị chiếm không

### Frontend không kết nối được Backend
1. Kiểm tra backend đã chạy tại port 3000
2. Kiểm tra `API_CONFIG.BASE_URL` trong `frontend/js/config.js`
3. Kiểm tra CORS đã được bật trong backend

### Lỗi đăng nhập
1. Kiểm tra database đã có dữ liệu mẫu chưa
2. Chạy lại file `sample_data.sql`

## Tác giả
Nhóm 5 - Báo cáo KTPMUD

## License
MIT
