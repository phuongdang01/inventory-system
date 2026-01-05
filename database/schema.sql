-- =============================================
-- HỆ THỐNG QUẢN LÝ XUẤT NHẬP KHO
-- Database Schema - SQL Server
-- =============================================

USE master;
GO

-- Tạo database
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'InventoryManagementDB')
BEGIN
    DROP DATABASE InventoryManagementDB;
END
GO

CREATE DATABASE InventoryManagementDB;
GO

USE InventoryManagementDB;
GO

-- =============================================
-- BẢNG NGƯỜI DÙNG
-- =============================================
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100),
    Phone NVARCHAR(20),
    Role NVARCHAR(20) CHECK (Role IN ('Admin', 'Manager', 'Staff')) DEFAULT 'Staff',
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- =============================================
-- BẢNG KHO
-- =============================================
CREATE TABLE Warehouses (
    WarehouseID INT PRIMARY KEY IDENTITY(1,1),
    WarehouseName NVARCHAR(100) NOT NULL,
    Location NVARCHAR(200),
    Capacity DECIMAL(18,2),
    ManagerID INT,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ManagerID) REFERENCES Users(UserID)
);

-- =============================================
-- BẢNG DANH MỤC SẢN PHẨM
-- =============================================
CREATE TABLE Categories (
    CategoryID INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    ParentCategoryID INT,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ParentCategoryID) REFERENCES Categories(CategoryID)
);

-- =============================================
-- BẢNG NHÀ CUNG CẤP
-- =============================================
CREATE TABLE Suppliers (
    SupplierID INT PRIMARY KEY IDENTITY(1,1),
    SupplierName NVARCHAR(100) NOT NULL,
    ContactPerson NVARCHAR(100),
    Email NVARCHAR(100),
    Phone NVARCHAR(20),
    Address NVARCHAR(200),
    TaxCode NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- =============================================
-- BẢNG KHÁCH HÀNG
-- =============================================
CREATE TABLE Customers (
    CustomerID INT PRIMARY KEY IDENTITY(1,1),
    CustomerName NVARCHAR(100) NOT NULL,
    ContactPerson NVARCHAR(100),
    Email NVARCHAR(100),
    Phone NVARCHAR(20),
    Address NVARCHAR(200),
    TaxCode NVARCHAR(20),
    CustomerType NVARCHAR(20) CHECK (CustomerType IN ('Individual', 'Company')) DEFAULT 'Individual',
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- =============================================
-- BẢNG SẢN PHẨM
-- =============================================
CREATE TABLE Products (
    ProductID INT PRIMARY KEY IDENTITY(1,1),
    ProductCode NVARCHAR(50) UNIQUE NOT NULL,
    ProductName NVARCHAR(200) NOT NULL,
    CategoryID INT,
    Unit NVARCHAR(20) NOT NULL, -- Đơn vị tính: Cái, Thùng, Kg, etc.
    Description NVARCHAR(500),
    MinStockLevel INT DEFAULT 0, -- Mức tồn kho tối thiểu
    MaxStockLevel INT DEFAULT 0, -- Mức tồn kho tối đa
    ReorderPoint INT DEFAULT 0, -- Điểm đặt hàng lại
    UnitPrice DECIMAL(18,2) DEFAULT 0,
    Image NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- =============================================
-- BẢNG TỒN KHO
-- =============================================
CREATE TABLE Inventory (
    InventoryID INT PRIMARY KEY IDENTITY(1,1),
    ProductID INT NOT NULL,
    WarehouseID INT NOT NULL,
    Quantity INT DEFAULT 0,
    LastUpdated DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    UNIQUE(ProductID, WarehouseID)
);

-- =============================================
-- BẢNG PHIẾU NHẬP KHO
-- =============================================
CREATE TABLE ImportOrders (
    ImportOrderID INT PRIMARY KEY IDENTITY(1,1),
    ImportOrderCode NVARCHAR(50) UNIQUE NOT NULL,
    WarehouseID INT NOT NULL,
    SupplierID INT NOT NULL,
    ImportDate DATETIME DEFAULT GETDATE(),
    TotalAmount DECIMAL(18,2) DEFAULT 0,
    Status NVARCHAR(20) CHECK (Status IN ('Pending', 'Approved', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    Notes NVARCHAR(500),
    CreatedBy INT NOT NULL,
    ApprovedBy INT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID)
);

-- =============================================
-- BẢNG CHI TIẾT PHIẾU NHẬP
-- =============================================
CREATE TABLE ImportOrderDetails (
    ImportOrderDetailID INT PRIMARY KEY IDENTITY(1,1),
    ImportOrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    TotalPrice AS (Quantity * UnitPrice) PERSISTED,
    ExpiryDate DATE,
    BatchNumber NVARCHAR(50),
    Notes NVARCHAR(200),
    FOREIGN KEY (ImportOrderID) REFERENCES ImportOrders(ImportOrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- =============================================
-- BẢNG PHIẾU XUẤT KHO
-- =============================================
CREATE TABLE ExportOrders (
    ExportOrderID INT PRIMARY KEY IDENTITY(1,1),
    ExportOrderCode NVARCHAR(50) UNIQUE NOT NULL,
    WarehouseID INT NOT NULL,
    CustomerID INT,
    ExportDate DATETIME DEFAULT GETDATE(),
    TotalAmount DECIMAL(18,2) DEFAULT 0,
    ExportType NVARCHAR(20) CHECK (ExportType IN ('Sale', 'Transfer', 'Return', 'Loss')) DEFAULT 'Sale',
    Status NVARCHAR(20) CHECK (Status IN ('Pending', 'Approved', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    Notes NVARCHAR(500),
    CreatedBy INT NOT NULL,
    ApprovedBy INT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID)
);

-- =============================================
-- BẢNG CHI TIẾT PHIẾU XUẤT
-- =============================================
CREATE TABLE ExportOrderDetails (
    ExportOrderDetailID INT PRIMARY KEY IDENTITY(1,1),
    ExportOrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    TotalPrice AS (Quantity * UnitPrice) PERSISTED,
    Notes NVARCHAR(200),
    FOREIGN KEY (ExportOrderID) REFERENCES ExportOrders(ExportOrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- =============================================
-- BẢNG LỊCH SỬ GIAO DỊCH
-- =============================================
CREATE TABLE TransactionHistory (
    TransactionID INT PRIMARY KEY IDENTITY(1,1),
    ProductID INT NOT NULL,
    WarehouseID INT NOT NULL,
    TransactionType NVARCHAR(20) CHECK (TransactionType IN ('Import', 'Export', 'Adjust')) NOT NULL,
    Quantity INT NOT NULL,
    QuantityBefore INT NOT NULL,
    QuantityAfter INT NOT NULL,
    ReferenceID INT, -- ID của phiếu nhập/xuất
    ReferenceType NVARCHAR(20), -- 'Import' hoặc 'Export'
    TransactionDate DATETIME DEFAULT GETDATE(),
    PerformedBy INT NOT NULL,
    Notes NVARCHAR(500),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (PerformedBy) REFERENCES Users(UserID)
);

-- =============================================
-- BẢNG CẢNH BÁO TỒN KHO
-- =============================================
CREATE TABLE StockAlerts (
    AlertID INT PRIMARY KEY IDENTITY(1,1),
    ProductID INT NOT NULL,
    WarehouseID INT NOT NULL,
    AlertType NVARCHAR(20) CHECK (AlertType IN ('LowStock', 'OverStock', 'Expired')) NOT NULL,
    AlertMessage NVARCHAR(200),
    IsResolved BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    ResolvedAt DATETIME,
    ResolvedBy INT,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (ResolvedBy) REFERENCES Users(UserID)
);

-- =============================================
-- INDEXES
-- =============================================

-- Users
CREATE INDEX IX_Users_Username ON Users(Username);
CREATE INDEX IX_Users_Role ON Users(Role);

-- Products
CREATE INDEX IX_Products_ProductCode ON Products(ProductCode);
CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);
CREATE INDEX IX_Products_ProductName ON Products(ProductName);

-- Inventory
CREATE INDEX IX_Inventory_ProductID ON Inventory(ProductID);
CREATE INDEX IX_Inventory_WarehouseID ON Inventory(WarehouseID);

-- Import Orders
CREATE INDEX IX_ImportOrders_ImportDate ON ImportOrders(ImportDate);
CREATE INDEX IX_ImportOrders_Status ON ImportOrders(Status);
CREATE INDEX IX_ImportOrders_SupplierID ON ImportOrders(SupplierID);

-- Export Orders
CREATE INDEX IX_ExportOrders_ExportDate ON ExportOrders(ExportDate);
CREATE INDEX IX_ExportOrders_Status ON ExportOrders(Status);
CREATE INDEX IX_ExportOrders_CustomerID ON ExportOrders(CustomerID);

-- Transaction History
CREATE INDEX IX_TransactionHistory_ProductID ON TransactionHistory(ProductID);
CREATE INDEX IX_TransactionHistory_TransactionDate ON TransactionHistory(TransactionDate);

GO
