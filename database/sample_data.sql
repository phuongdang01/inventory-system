-- =============================================
-- DỮ LIỆU MẪU - HỆ THỐNG QUẢN LÝ KHO
-- =============================================

-- =============================================
-- Thêm người dùng
-- =============================================
INSERT INTO Users (Username, Password, FullName, Email, Phone, Role) VALUES
('admin', 'admin123', 'Quản trị viên', 'admin@inventory.com', '0901234567', 'Admin'),
('manager1', 'manager123', 'Nguyễn Văn A', 'nguyenvana@inventory.com', '0912345678', 'Manager'),
('staff1', 'staff123', 'Trần Thị B', 'tranthib@inventory.com', '0923456789', 'Staff'),
('staff2', 'staff123', 'Lê Văn C', 'levanc@inventory.com', '0934567890', 'Staff');

-- =============================================
-- Thêm kho
-- =============================================
INSERT INTO Warehouses (WarehouseName, Location, Capacity, ManagerID) VALUES
('Kho Hà Nội', 'Số 10, Đường Láng, Đống Đa, Hà Nội', 10000, 2),
('Kho Hồ Chí Minh', 'Số 20, Nguyễn Huệ, Quận 1, TP.HCM', 15000, 2),
('Kho Đà Nẵng', 'Số 30, Hải Châu, Đà Nẵng', 8000, 2);

-- =============================================
-- Thêm danh mục
-- =============================================
INSERT INTO Categories (CategoryName, Description) VALUES
('Điện tử', 'Các thiết bị điện tử'),
('Thực phẩm', 'Thực phẩm và đồ uống'),
('Văn phòng phẩm', 'Đồ dùng văn phòng'),
('Gia dụng', 'Đồ dùng gia đình'),
('Thời trang', 'Quần áo và phụ kiện');

-- =============================================
-- Thêm nhà cung cấp
-- =============================================
INSERT INTO Suppliers (SupplierName, ContactPerson, Email, Phone, Address, TaxCode) VALUES
('Công ty TNHH Điện tử ABC', 'Nguyễn Minh Đức', 'duc@abc.com', '0241234567', 'Hà Nội', '0123456789'),
('Công ty CP Thực phẩm XYZ', 'Trần Thu Hà', 'ha@xyz.com', '0281234567', 'TP.HCM', '9876543210'),
('Công ty TNHH Văn phòng phẩm DEF', 'Lê Anh Tuấn', 'tuan@def.com', '0236234567', 'Đà Nẵng', '1234567890');

-- =============================================
-- Thêm khách hàng
-- =============================================
INSERT INTO Customers (CustomerName, ContactPerson, Email, Phone, Address, TaxCode, CustomerType) VALUES
('Công ty TNHH Bán lẻ 123', 'Phạm Văn E', 'phamvane@retail123.com', '0945678901', 'Hà Nội', '1111111111', 'Company'),
('Siêu thị Mini Mart', 'Hoàng Thị F', 'hoangthif@minimart.com', '0956789012', 'TP.HCM', '2222222222', 'Company'),
('Nguyễn Thị G', NULL, 'nguyenthig@gmail.com', '0967890123', 'Đà Nẵng', NULL, 'Individual');

-- =============================================
-- Thêm sản phẩm
-- =============================================
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

-- =============================================
-- Thêm tồn kho ban đầu
-- =============================================
INSERT INTO Inventory (ProductID, WarehouseID, Quantity) VALUES
-- Kho Hà Nội
(1, 1, 15),
(2, 1, 45),
(3, 1, 20),
(4, 1, 300),
(5, 1, 150),
(7, 1, 500),
(8, 1, 200),
(10, 1, 25),
(12, 1, 120),
-- Kho HCM
(1, 2, 20),
(2, 2, 60),
(4, 2, 450),
(5, 2, 200),
(6, 2, 100),
(8, 2, 250),
(11, 2, 40),
(13, 2, 150),
-- Kho Đà Nẵng
(2, 3, 35),
(3, 3, 15),
(7, 3, 300),
(8, 3, 150),
(9, 3, 80);
