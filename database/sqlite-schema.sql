-- =============================================
-- HỆ THỐNG QUẢN LÝ XUẤT NHẬP KHO - SQLite
-- =============================================

-- =============================================
-- BẢNG NGƯỜI DÙNG
-- =============================================
CREATE TABLE IF NOT EXISTS Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    FullName TEXT NOT NULL,
    Email TEXT,
    Phone TEXT,
    Role TEXT CHECK (Role IN ('Admin', 'Manager', 'Staff')) DEFAULT 'Staff',
    IsActive INTEGER DEFAULT 1,
    LastLogin DATETIME,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- BẢNG KHO
-- =============================================
CREATE TABLE IF NOT EXISTS Warehouses (
    WarehouseID INTEGER PRIMARY KEY AUTOINCREMENT,
    WarehouseName TEXT NOT NULL,
    Location TEXT,
    Capacity REAL,
    ManagerID INTEGER,
    IsActive INTEGER DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ManagerID) REFERENCES Users(UserID)
);

-- =============================================
-- BẢNG DANH MỤC SẢN PHẨM
-- =============================================
CREATE TABLE IF NOT EXISTS Categories (
    CategoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryName TEXT NOT NULL,
    Description TEXT,
    ParentCategoryID INTEGER,
    IsActive INTEGER DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ParentCategoryID) REFERENCES Categories(CategoryID)
);

-- =============================================
-- BẢNG NHÀ CUNG CẤP
-- =============================================
CREATE TABLE IF NOT EXISTS Suppliers (
    SupplierID INTEGER PRIMARY KEY AUTOINCREMENT,
    SupplierName TEXT NOT NULL,
    ContactPerson TEXT,
    Email TEXT,
    Phone TEXT,
    Address TEXT,
    TaxCode TEXT,
    IsActive INTEGER DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- BẢNG KHÁCH HÀNG
-- =============================================
CREATE TABLE IF NOT EXISTS Customers (
    CustomerID INTEGER PRIMARY KEY AUTOINCREMENT,
    CustomerName TEXT NOT NULL,
    ContactPerson TEXT,
    Email TEXT,
    Phone TEXT,
    Address TEXT,
    TaxCode TEXT,
    CustomerType TEXT CHECK (CustomerType IN ('Individual', 'Company')) DEFAULT 'Individual',
    IsActive INTEGER DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- BẢNG SẢN PHẨM
-- =============================================
CREATE TABLE IF NOT EXISTS Products (
    ProductID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductCode TEXT UNIQUE NOT NULL,
    ProductName TEXT NOT NULL,
    CategoryID INTEGER,
    Unit TEXT NOT NULL,
    Description TEXT,
    MinStockLevel INTEGER DEFAULT 0,
    MaxStockLevel INTEGER DEFAULT 0,
    ReorderPoint INTEGER DEFAULT 0,
    UnitPrice REAL DEFAULT 0,
    Image TEXT,
    IsActive INTEGER DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- =============================================
-- BẢNG TỒN KHO
-- =============================================
CREATE TABLE IF NOT EXISTS Inventory (
    InventoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID INTEGER NOT NULL,
    WarehouseID INTEGER NOT NULL,
    Quantity INTEGER DEFAULT 0,
    LastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    UNIQUE(ProductID, WarehouseID)
);

-- =============================================
-- BẢNG PHIẾU NHẬP KHO
-- =============================================
CREATE TABLE IF NOT EXISTS ImportOrders (
    ImportOrderID INTEGER PRIMARY KEY AUTOINCREMENT,
    ImportOrderCode TEXT UNIQUE NOT NULL,
    WarehouseID INTEGER NOT NULL,
    SupplierID INTEGER NOT NULL,
    ImportDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    TotalAmount REAL DEFAULT 0,
    Status TEXT CHECK (Status IN ('Pending', 'Approved', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    Notes TEXT,
    CreatedBy INTEGER NOT NULL,
    ApprovedBy INTEGER,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID)
);

-- =============================================
-- BẢNG CHI TIẾT PHIẾU NHẬP
-- =============================================
CREATE TABLE IF NOT EXISTS ImportOrderDetails (
    ImportOrderDetailID INTEGER PRIMARY KEY AUTOINCREMENT,
    ImportOrderID INTEGER NOT NULL,
    ProductID INTEGER NOT NULL,
    Quantity INTEGER NOT NULL,
    UnitPrice REAL NOT NULL,
    ExpiryDate DATE,
    BatchNumber TEXT,
    Notes TEXT,
    FOREIGN KEY (ImportOrderID) REFERENCES ImportOrders(ImportOrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- =============================================
-- BẢNG PHIẾU XUẤT KHO
-- =============================================
CREATE TABLE IF NOT EXISTS ExportOrders (
    ExportOrderID INTEGER PRIMARY KEY AUTOINCREMENT,
    ExportOrderCode TEXT UNIQUE NOT NULL,
    WarehouseID INTEGER NOT NULL,
    CustomerID INTEGER,
    ExportDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    TotalAmount REAL DEFAULT 0,
    ExportType TEXT CHECK (ExportType IN ('Sale', 'Transfer', 'Return', 'Loss')) DEFAULT 'Sale',
    Status TEXT CHECK (Status IN ('Pending', 'Approved', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    Notes TEXT,
    CreatedBy INTEGER NOT NULL,
    ApprovedBy INTEGER,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID)
);

-- =============================================
-- BẢNG CHI TIẾT PHIẾU XUẤT
-- =============================================
CREATE TABLE IF NOT EXISTS ExportOrderDetails (
    ExportOrderDetailID INTEGER PRIMARY KEY AUTOINCREMENT,
    ExportOrderID INTEGER NOT NULL,
    ProductID INTEGER NOT NULL,
    Quantity INTEGER NOT NULL,
    UnitPrice REAL NOT NULL,
    Notes TEXT,
    FOREIGN KEY (ExportOrderID) REFERENCES ExportOrders(ExportOrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- =============================================
-- BẢNG LỊCH SỬ GIAO DỊCH
-- =============================================
CREATE TABLE IF NOT EXISTS TransactionHistory (
    TransactionID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID INTEGER NOT NULL,
    WarehouseID INTEGER NOT NULL,
    TransactionType TEXT CHECK (TransactionType IN ('IN', 'OUT', 'ADJUST')) NOT NULL,
    Quantity INTEGER NOT NULL,
    QuantityBefore INTEGER,
    QuantityAfter INTEGER,
    ReferenceID INTEGER,
    ReferenceType TEXT,
    TransactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INTEGER NOT NULL,
    Notes TEXT,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

-- =============================================
-- BẢNG CẢNH BÁO TỒN KHO
-- =============================================
CREATE TABLE IF NOT EXISTS StockAlerts (
    AlertID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID INTEGER NOT NULL,
    WarehouseID INTEGER NOT NULL,
    AlertType TEXT CHECK (AlertType IN ('LowStock', 'OverStock', 'Expired')) NOT NULL,
    AlertMessage TEXT,
    IsResolved INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ResolvedAt DATETIME,
    ResolvedBy INTEGER,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (ResolvedBy) REFERENCES Users(UserID)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_username ON Users(Username);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(Role);
CREATE INDEX IF NOT EXISTS idx_products_code ON Products(ProductCode);
CREATE INDEX IF NOT EXISTS idx_products_category ON Products(CategoryID);
CREATE INDEX IF NOT EXISTS idx_products_name ON Products(ProductName);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON Inventory(ProductID);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON Inventory(WarehouseID);
CREATE INDEX IF NOT EXISTS idx_import_date ON ImportOrders(ImportDate);
CREATE INDEX IF NOT EXISTS idx_import_status ON ImportOrders(Status);
CREATE INDEX IF NOT EXISTS idx_export_date ON ExportOrders(ExportDate);
CREATE INDEX IF NOT EXISTS idx_export_status ON ExportOrders(Status);
CREATE INDEX IF NOT EXISTS idx_transaction_product ON TransactionHistory(ProductID);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON TransactionHistory(TransactionDate);

-- =============================================
-- DỮ LIỆU MẪU
-- =============================================

-- Thêm người dùng
INSERT INTO Users (Username, Password, FullName, Email, Phone, Role) VALUES
('admin', 'admin123', 'Quản trị viên', 'admin@inventory.com', '0901234567', 'Admin'),
('manager1', 'manager123', 'Nguyễn Văn A', 'nguyenvana@inventory.com', '0912345678', 'Manager'),
('staff1', 'staff123', 'Trần Thị B', 'tranthib@inventory.com', '0923456789', 'Staff'),
('staff2', 'staff123', 'Lê Văn C', 'levanc@inventory.com', '0934567890', 'Staff');

-- Thêm kho
INSERT INTO Warehouses (WarehouseName, Location, Capacity, ManagerID) VALUES
('Kho Hà Nội', 'Số 10, Đường Láng, Đống Đa, Hà Nội', 10000, 2),
('Kho Hồ Chí Minh', 'Số 20, Nguyễn Huệ, Quận 1, TP.HCM', 15000, 2),
('Kho Đà Nẵng', 'Số 30, Hải Châu, Đà Nẵng', 8000, 2);

-- Thêm danh mục
INSERT INTO Categories (CategoryName, Description) VALUES
('Điện tử', 'Các thiết bị điện tử'),
('Thực phẩm', 'Thực phẩm và đồ uống'),
('Văn phòng phẩm', 'Đồ dùng văn phòng'),
('Gia dụng', 'Đồ dùng gia đình'),
('Thời trang', 'Quần áo và phụ kiện');

-- Thêm nhà cung cấp
INSERT INTO Suppliers (SupplierName, ContactPerson, Email, Phone, Address, TaxCode) VALUES
('Công ty TNHH Điện tử ABC', 'Nguyễn Minh Đức', 'duc@abc.com', '0241234567', 'Hà Nội', '0123456789'),
('Công ty CP Thực phẩm XYZ', 'Trần Thu Hà', 'ha@xyz.com', '0281234567', 'TP.HCM', '9876543210'),
('Công ty TNHH Văn phòng phẩm DEF', 'Lê Anh Tuấn', 'tuan@def.com', '0236234567', 'Đà Nẵng', '1234567890');

-- Thêm khách hàng
INSERT INTO Customers (CustomerName, ContactPerson, Email, Phone, Address, TaxCode, CustomerType) VALUES
('Công ty TNHH Bán lẻ 123', 'Phạm Văn E', 'phamvane@retail123.com', '0945678901', 'Hà Nội', '1111111111', 'Company'),
('Siêu thị Mini Mart', 'Hoàng Thị F', 'hoangthif@minimart.com', '0956789012', 'TP.HCM', '2222222222', 'Company'),
('Nguyễn Thị G', NULL, 'nguyenthig@gmail.com', '0967890123', 'Đà Nẵng', NULL, 'Individual');

-- Thêm sản phẩm
INSERT INTO Products (ProductCode, ProductName, CategoryID, Unit, UnitPrice, Description) VALUES
('SP001', 'Áo thun Cotton Compact Trắng', 5, 'Cái', 199000, 'SKU: CM-AT-001, Size: S / M / L / XL, NCC: Coolmate Việt Nam'),
('SP002', 'Áo thun Cotton Compact Đen', 5, 'Cái', 199000, 'SKU: CM-AT-002, Size: S / M / L / XL, NCC: Coolmate Việt Nam'),
('SP003', 'Áo thun Cotton Compact Xám', 5, 'Cái', 199000, 'SKU: CM-AT-003, Size: S / M / L / XL, NCC: Coolmate Việt Nam'),
('SP004', 'Áo polo Pique Coolmate', 5, 'Cái', 299000, 'SKU: CM-PO-001, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP005', 'Áo polo phối bo cổ', 5, 'Cái', 329000, 'SKU: CM-PO-002, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP006', 'Áo sơ mi Oxford trắng', 5, 'Cái', 399000, 'SKU: CM-SM-001, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP007', 'Áo sơ mi denim xanh', 5, 'Cái', 429000, 'SKU: CM-SM-002, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP008', 'Quần jeans Slimfit xanh đậm', 5, 'Cái', 499000, 'SKU: CM-QJ-001, Size: 29 / 30 / 31 / 32, NCC: Coolmate Việt Nam'),
('SP009', 'Quần jeans Slimfit xanh nhạt', 5, 'Cái', 499000, 'SKU: CM-QJ-002, Size: 29 / 30 / 31 / 32, NCC: Coolmate Việt Nam'),
('SP010', 'Quần kaki co giãn be', 5, 'Cái', 459000, 'SKU: CM-QK-001, Size: 30 / 31 / 32 / 33, NCC: Coolmate Việt Nam'),
('SP011', 'Quần short thể thao 5 inch', 5, 'Cái', 249000, 'SKU: CM-QS-001, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP012', 'Quần short thể thao 7 inch', 5, 'Cái', 269000, 'SKU: CM-QS-002, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP013', 'Quần jogger nam', 5, 'Cái', 379000, 'SKU: CM-QJOG-001, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP014', 'Áo hoodie nỉ trơn', 5, 'Cái', 499000, 'SKU: CM-HD-001, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP015', 'Áo sweater basic', 5, 'Cái', 449000, 'SKU: CM-SW-001, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP016', 'Áo khoác gió thể thao', 5, 'Cái', 599000, 'SKU: CM-AK-001, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP017', 'Áo tanktop thể thao', 5, 'Cái', 179000, 'SKU: CM-TT-001, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP018', 'Quần lót nam Bamboo', 5, 'Cái', 99000, 'SKU: CM-QL-001, Size: M / L / XL, NCC: Coolmate Việt Nam'),
('SP019', 'Tất cổ ngắn Coolmate', 5, 'Cái', 49000, 'SKU: CM-TAT-001, Size: Free size, NCC: Coolmate Việt Nam'),
('SP020', 'Combo 3 áo thun Compact', 5, 'Cái', 549000, 'SKU: CM-CB-001, Size: M / L / XL, NCC: Coolmate Việt Nam');

-- Thêm tồn kho ban đầu
INSERT INTO Inventory (ProductID, WarehouseID, Quantity) VALUES
(1, 1, 15), (2, 1, 45), (3, 1, 20), (4, 1, 300), (5, 1, 150), (7, 1, 500), (8, 1, 200), (10, 1, 25), (12, 1, 120),
(1, 2, 20), (2, 2, 60), (4, 2, 450), (5, 2, 200), (6, 2, 100), (8, 2, 250), (11, 2, 40), (13, 2, 150),
(2, 3, 35), (3, 3, 15), (7, 3, 300), (8, 3, 150), (9, 3, 80);
