-- =============================================
-- STORED PROCEDURES - HỆ THỐNG QUẢN LÝ KHO
-- =============================================

USE InventoryManagementDB;
GO

-- =============================================
-- SP: Tạo mã phiếu nhập tự động
-- =============================================
CREATE OR ALTER PROCEDURE sp_GenerateImportOrderCode
    @NewCode NVARCHAR(50) OUTPUT
AS
BEGIN
    DECLARE @LastNumber INT;
    DECLARE @Year INT = YEAR(GETDATE());
    DECLARE @Month INT = MONTH(GETDATE());
    
    SELECT @LastNumber = ISNULL(MAX(CAST(RIGHT(ImportOrderCode, 4) AS INT)), 0)
    FROM ImportOrders
    WHERE ImportOrderCode LIKE 'PN' + CAST(@Year AS VARCHAR) + RIGHT('0' + CAST(@Month AS VARCHAR), 2) + '%';
    
    SET @NewCode = 'PN' + CAST(@Year AS VARCHAR) + RIGHT('0' + CAST(@Month AS VARCHAR), 2) + RIGHT('000' + CAST(@LastNumber + 1 AS VARCHAR), 4);
END;
GO

-- =============================================
-- SP: Tạo mã phiếu xuất tự động
-- =============================================
CREATE OR ALTER PROCEDURE sp_GenerateExportOrderCode
    @NewCode NVARCHAR(50) OUTPUT
AS
BEGIN
    DECLARE @LastNumber INT;
    DECLARE @Year INT = YEAR(GETDATE());
    DECLARE @Month INT = MONTH(GETDATE());
    
    SELECT @LastNumber = ISNULL(MAX(CAST(RIGHT(ExportOrderCode, 4) AS INT)), 0)
    FROM ExportOrders
    WHERE ExportOrderCode LIKE 'PX' + CAST(@Year AS VARCHAR) + RIGHT('0' + CAST(@Month AS VARCHAR), 2) + '%';
    
    SET @NewCode = 'PX' + CAST(@Year AS VARCHAR) + RIGHT('0' + CAST(@Month AS VARCHAR), 2) + RIGHT('000' + CAST(@LastNumber + 1 AS VARCHAR), 4);
END;
GO

-- =============================================
-- SP: Tạo phiếu nhập kho
-- =============================================
CREATE OR ALTER PROCEDURE sp_CreateImportOrder
    @WarehouseID INT,
    @SupplierID INT,
    @CreatedBy INT,
    @Notes NVARCHAR(500) = NULL,
    @ImportOrderID INT OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @ImportOrderCode NVARCHAR(50);
        EXEC sp_GenerateImportOrderCode @ImportOrderCode OUTPUT;
        
        INSERT INTO ImportOrders (ImportOrderCode, WarehouseID, SupplierID, CreatedBy, Notes, Status)
        VALUES (@ImportOrderCode, @WarehouseID, @SupplierID, @CreatedBy, @Notes, 'Pending');
        
        SET @ImportOrderID = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- SP: Thêm chi tiết phiếu nhập
-- =============================================
CREATE OR ALTER PROCEDURE sp_AddImportOrderDetail
    @ImportOrderID INT,
    @ProductID INT,
    @Quantity INT,
    @UnitPrice DECIMAL(18,2),
    @ExpiryDate DATE = NULL,
    @BatchNumber NVARCHAR(50) = NULL,
    @Notes NVARCHAR(200) = NULL
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Thêm chi tiết phiếu nhập
        INSERT INTO ImportOrderDetails (ImportOrderID, ProductID, Quantity, UnitPrice, ExpiryDate, BatchNumber, Notes)
        VALUES (@ImportOrderID, @ProductID, @Quantity, @UnitPrice, @ExpiryDate, @BatchNumber, @Notes);
        
        -- Cập nhật tổng tiền
        UPDATE ImportOrders
        SET TotalAmount = (
            SELECT SUM(Quantity * UnitPrice)
            FROM ImportOrderDetails
            WHERE ImportOrderID = @ImportOrderID
        )
        WHERE ImportOrderID = @ImportOrderID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- SP: Duyệt phiếu nhập và cập nhật kho
-- =============================================
CREATE OR ALTER PROCEDURE sp_ApproveImportOrder
    @ImportOrderID INT,
    @ApprovedBy INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @WarehouseID INT;
        DECLARE @ProductID INT;
        DECLARE @Quantity INT;
        DECLARE @QuantityBefore INT;
        
        -- Lấy thông tin kho
        SELECT @WarehouseID = WarehouseID
        FROM ImportOrders
        WHERE ImportOrderID = @ImportOrderID;
        
        -- Kiểm tra trạng thái
        IF NOT EXISTS (SELECT 1 FROM ImportOrders WHERE ImportOrderID = @ImportOrderID AND Status = 'Pending')
        BEGIN
            THROW 50001, 'Phiếu nhập không ở trạng thái chờ duyệt', 1;
        END
        
        -- Cursor để duyệt qua từng sản phẩm
        DECLARE detail_cursor CURSOR FOR
        SELECT ProductID, Quantity
        FROM ImportOrderDetails
        WHERE ImportOrderID = @ImportOrderID;
        
        OPEN detail_cursor;
        FETCH NEXT FROM detail_cursor INTO @ProductID, @Quantity;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Lấy số lượng hiện tại
            SELECT @QuantityBefore = ISNULL(Quantity, 0)
            FROM Inventory
            WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;
            
            -- Cập nhật hoặc thêm mới tồn kho
            IF EXISTS (SELECT 1 FROM Inventory WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID)
            BEGIN
                UPDATE Inventory
                SET Quantity = Quantity + @Quantity,
                    LastUpdated = GETDATE()
                WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;
            END
            ELSE
            BEGIN
                INSERT INTO Inventory (ProductID, WarehouseID, Quantity)
                VALUES (@ProductID, @WarehouseID, @Quantity);
                SET @QuantityBefore = 0;
            END
            
            -- Ghi lịch sử giao dịch
            INSERT INTO TransactionHistory (ProductID, WarehouseID, TransactionType, Quantity, QuantityBefore, QuantityAfter, ReferenceID, ReferenceType, PerformedBy)
            VALUES (@ProductID, @WarehouseID, 'Import', @Quantity, @QuantityBefore, @QuantityBefore + @Quantity, @ImportOrderID, 'Import', @ApprovedBy);
            
            FETCH NEXT FROM detail_cursor INTO @ProductID, @Quantity;
        END
        
        CLOSE detail_cursor;
        DEALLOCATE detail_cursor;
        
        -- Cập nhật trạng thái phiếu nhập
        UPDATE ImportOrders
        SET Status = 'Completed',
            ApprovedBy = @ApprovedBy,
            UpdatedAt = GETDATE()
        WHERE ImportOrderID = @ImportOrderID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('global', 'detail_cursor') >= 0
        BEGIN
            CLOSE detail_cursor;
            DEALLOCATE detail_cursor;
        END
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- SP: Tạo phiếu xuất kho
-- =============================================
CREATE OR ALTER PROCEDURE sp_CreateExportOrder
    @WarehouseID INT,
    @CustomerID INT = NULL,
    @ExportType NVARCHAR(20),
    @CreatedBy INT,
    @Notes NVARCHAR(500) = NULL,
    @ExportOrderID INT OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @ExportOrderCode NVARCHAR(50);
        EXEC sp_GenerateExportOrderCode @ExportOrderCode OUTPUT;
        
        INSERT INTO ExportOrders (ExportOrderCode, WarehouseID, CustomerID, ExportType, CreatedBy, Notes, Status)
        VALUES (@ExportOrderCode, @WarehouseID, @CustomerID, @ExportType, @CreatedBy, @Notes, 'Pending');
        
        SET @ExportOrderID = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- SP: Thêm chi tiết phiếu xuất
-- =============================================
CREATE OR ALTER PROCEDURE sp_AddExportOrderDetail
    @ExportOrderID INT,
    @ProductID INT,
    @Quantity INT,
    @UnitPrice DECIMAL(18,2),
    @Notes NVARCHAR(200) = NULL
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @WarehouseID INT;
        DECLARE @CurrentStock INT;
        
        -- Lấy thông tin kho
        SELECT @WarehouseID = WarehouseID
        FROM ExportOrders
        WHERE ExportOrderID = @ExportOrderID;
        
        -- Kiểm tra tồn kho
        SELECT @CurrentStock = ISNULL(Quantity, 0)
        FROM Inventory
        WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;
        
        IF @CurrentStock < @Quantity
        BEGIN
            THROW 50002, 'Số lượng tồn kho không đủ', 1;
        END
        
        -- Thêm chi tiết phiếu xuất
        INSERT INTO ExportOrderDetails (ExportOrderID, ProductID, Quantity, UnitPrice, Notes)
        VALUES (@ExportOrderID, @ProductID, @Quantity, @UnitPrice, @Notes);
        
        -- Cập nhật tổng tiền
        UPDATE ExportOrders
        SET TotalAmount = (
            SELECT SUM(Quantity * UnitPrice)
            FROM ExportOrderDetails
            WHERE ExportOrderID = @ExportOrderID
        )
        WHERE ExportOrderID = @ExportOrderID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- SP: Duyệt phiếu xuất và cập nhật kho
-- =============================================
CREATE OR ALTER PROCEDURE sp_ApproveExportOrder
    @ExportOrderID INT,
    @ApprovedBy INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @WarehouseID INT;
        DECLARE @ProductID INT;
        DECLARE @Quantity INT;
        DECLARE @QuantityBefore INT;
        DECLARE @CurrentStock INT;
        
        -- Lấy thông tin kho
        SELECT @WarehouseID = WarehouseID
        FROM ExportOrders
        WHERE ExportOrderID = @ExportOrderID;
        
        -- Kiểm tra trạng thái
        IF NOT EXISTS (SELECT 1 FROM ExportOrders WHERE ExportOrderID = @ExportOrderID AND Status = 'Pending')
        BEGIN
            THROW 50003, 'Phiếu xuất không ở trạng thái chờ duyệt', 1;
        END
        
        -- Cursor để duyệt qua từng sản phẩm
        DECLARE detail_cursor CURSOR FOR
        SELECT ProductID, Quantity
        FROM ExportOrderDetails
        WHERE ExportOrderID = @ExportOrderID;
        
        OPEN detail_cursor;
        FETCH NEXT FROM detail_cursor INTO @ProductID, @Quantity;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Kiểm tra tồn kho
            SELECT @CurrentStock = ISNULL(Quantity, 0),
                   @QuantityBefore = ISNULL(Quantity, 0)
            FROM Inventory
            WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;
            
            IF @CurrentStock < @Quantity
            BEGIN
                CLOSE detail_cursor;
                DEALLOCATE detail_cursor;
                THROW 50004, 'Số lượng tồn kho không đủ để xuất', 1;
            END
            
            -- Cập nhật tồn kho
            UPDATE Inventory
            SET Quantity = Quantity - @Quantity,
                LastUpdated = GETDATE()
            WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;
            
            -- Ghi lịch sử giao dịch
            INSERT INTO TransactionHistory (ProductID, WarehouseID, TransactionType, Quantity, QuantityBefore, QuantityAfter, ReferenceID, ReferenceType, PerformedBy)
            VALUES (@ProductID, @WarehouseID, 'Export', @Quantity, @QuantityBefore, @QuantityBefore - @Quantity, @ExportOrderID, 'Export', @ApprovedBy);
            
            FETCH NEXT FROM detail_cursor INTO @ProductID, @Quantity;
        END
        
        CLOSE detail_cursor;
        DEALLOCATE detail_cursor;
        
        -- Cập nhật trạng thái phiếu xuất
        UPDATE ExportOrders
        SET Status = 'Completed',
            ApprovedBy = @ApprovedBy,
            UpdatedAt = GETDATE()
        WHERE ExportOrderID = @ExportOrderID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('global', 'detail_cursor') >= 0
        BEGIN
            CLOSE detail_cursor;
            DEALLOCATE detail_cursor;
        END
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- SP: Kiểm tra và tạo cảnh báo tồn kho
-- =============================================
CREATE OR ALTER PROCEDURE sp_CheckStockAlerts
AS
BEGIN
    -- Cảnh báo tồn kho thấp
    INSERT INTO StockAlerts (ProductID, WarehouseID, AlertType, AlertMessage)
    SELECT 
        i.ProductID,
        i.WarehouseID,
        'LowStock',
        N'Sản phẩm ' + p.ProductName + N' tồn kho thấp: ' + CAST(i.Quantity AS NVARCHAR) + N' ' + p.Unit
    FROM Inventory i
    INNER JOIN Products p ON i.ProductID = p.ProductID
    WHERE i.Quantity <= p.MinStockLevel
    AND NOT EXISTS (
        SELECT 1 FROM StockAlerts sa
        WHERE sa.ProductID = i.ProductID 
        AND sa.WarehouseID = i.WarehouseID
        AND sa.AlertType = 'LowStock'
        AND sa.IsResolved = 0
    );
    
    -- Cảnh báo tồn kho cao
    INSERT INTO StockAlerts (ProductID, WarehouseID, AlertType, AlertMessage)
    SELECT 
        i.ProductID,
        i.WarehouseID,
        'OverStock',
        N'Sản phẩm ' + p.ProductName + N' tồn kho cao: ' + CAST(i.Quantity AS NVARCHAR) + N' ' + p.Unit
    FROM Inventory i
    INNER JOIN Products p ON i.ProductID = p.ProductID
    WHERE i.Quantity >= p.MaxStockLevel AND p.MaxStockLevel > 0
    AND NOT EXISTS (
        SELECT 1 FROM StockAlerts sa
        WHERE sa.ProductID = i.ProductID 
        AND sa.WarehouseID = i.WarehouseID
        AND sa.AlertType = 'OverStock'
        AND sa.IsResolved = 0
    );
END;
GO

-- =============================================
-- SP: Báo cáo tồn kho
-- =============================================
CREATE OR ALTER PROCEDURE sp_GetInventoryReport
    @WarehouseID INT = NULL
AS
BEGIN
    SELECT 
        p.ProductCode,
        p.ProductName,
        c.CategoryName,
        w.WarehouseName,
        i.Quantity,
        p.Unit,
        p.MinStockLevel,
        p.MaxStockLevel,
        p.UnitPrice,
        (i.Quantity * p.UnitPrice) AS TotalValue,
        CASE 
            WHEN i.Quantity <= p.MinStockLevel THEN N'Thấp'
            WHEN i.Quantity >= p.MaxStockLevel AND p.MaxStockLevel > 0 THEN N'Cao'
            ELSE N'Bình thường'
        END AS StockStatus,
        i.LastUpdated
    FROM Inventory i
    INNER JOIN Products p ON i.ProductID = p.ProductID
    INNER JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
    LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
    WHERE (@WarehouseID IS NULL OR i.WarehouseID = @WarehouseID)
    AND p.IsActive = 1
    ORDER BY w.WarehouseName, c.CategoryName, p.ProductName;
END;
GO

-- =============================================
-- SP: Báo cáo xuất nhập tồn theo thời gian
-- =============================================
CREATE OR ALTER PROCEDURE sp_GetInventoryMovementReport
    @StartDate DATE,
    @EndDate DATE,
    @ProductID INT = NULL,
    @WarehouseID INT = NULL
AS
BEGIN
    SELECT 
        p.ProductCode,
        p.ProductName,
        w.WarehouseName,
        SUM(CASE WHEN th.TransactionType = 'Import' THEN th.Quantity ELSE 0 END) AS TotalImport,
        SUM(CASE WHEN th.TransactionType = 'Export' THEN th.Quantity ELSE 0 END) AS TotalExport,
        SUM(CASE WHEN th.TransactionType = 'Adjust' THEN th.Quantity ELSE 0 END) AS TotalAdjust,
        (
            SELECT TOP 1 QuantityBefore 
            FROM TransactionHistory 
            WHERE ProductID = th.ProductID 
            AND WarehouseID = th.WarehouseID
            AND TransactionDate >= @StartDate
            ORDER BY TransactionDate ASC
        ) AS BeginningStock,
        (
            SELECT TOP 1 QuantityAfter 
            FROM TransactionHistory 
            WHERE ProductID = th.ProductID 
            AND WarehouseID = th.WarehouseID
            AND TransactionDate <= @EndDate
            ORDER BY TransactionDate DESC
        ) AS EndingStock
    FROM TransactionHistory th
    INNER JOIN Products p ON th.ProductID = p.ProductID
    INNER JOIN Warehouses w ON th.WarehouseID = w.WarehouseID
    WHERE th.TransactionDate BETWEEN @StartDate AND @EndDate
    AND (@ProductID IS NULL OR th.ProductID = @ProductID)
    AND (@WarehouseID IS NULL OR th.WarehouseID = @WarehouseID)
    GROUP BY p.ProductCode, p.ProductName, w.WarehouseName, th.ProductID, th.WarehouseID
    ORDER BY p.ProductName, w.WarehouseName;
END;
GO

PRINT 'Stored Procedures created successfully!';
