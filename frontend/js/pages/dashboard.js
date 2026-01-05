// Dashboard Page
const Dashboard = {
    async load() {
        try {
            Utils.showLoading();
            const response = await API.get(API_ENDPOINTS.DASHBOARD);
            
            if (response.success) {
                this.render(response.data);
            }
        } catch (error) {
            Utils.showNotification('Lỗi tải dữ liệu dashboard: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    render(data) {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-info">
                        <h3>Tổng Sản Phẩm</h3>
                        <div class="stat-value">${data.stats.TotalProducts}</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-box"></i>
                    </div>
                </div>
                
                <div class="stat-card success">
                    <div class="stat-info">
                        <h3>Tổng Kho</h3>
                        <div class="stat-value">${data.stats.TotalWarehouses}</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-warehouse"></i>
                    </div>
                </div>
                
                <div class="stat-card warning">
                    <div class="stat-info">
                        <h3>Phiếu Nhập Chờ</h3>
                        <div class="stat-value">${data.stats.PendingImports}</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                </div>
                
                <div class="stat-card danger">
                    <div class="stat-info">
                        <h3>Phiếu Xuất Chờ</h3>
                        <div class="stat-value">${data.stats.PendingExports}</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                </div>
            </div>

            <!-- Inventory Value -->
            <div class="stats-grid">
                <div class="stat-card primary" style="grid-column: 1 / -1;">
                    <div class="stat-info">
                        <h3>Tổng Giá Trị Tồn Kho</h3>
                        <div class="stat-value">${Utils.formatCurrency(data.inventoryValue.TotalInventoryValue || 0)}</div>
                    </div>
                    <div class="stat-icon">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
                </div>
            </div>

            <!-- Low Stock Products -->
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-exclamation-triangle"></i> Sản Phẩm Tồn Kho Thấp</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Mã SP</th>
                            <th>Tên Sản Phẩm</th>
                            <th>Kho</th>
                            <th>Tồn Hiện Tại</th>
                            <th>Tồn Tối Thiểu</th>
                            <th>Đơn Vị</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.lowStock.length > 0 ? data.lowStock.map(item => `
                            <tr>
                                <td>${item.ProductCode}</td>
                                <td>${item.ProductName}</td>
                                <td>${item.WarehouseName}</td>
                                <td><span class="badge badge-danger">${item.Quantity}</span></td>
                                <td>${item.MinStockLevel}</td>
                                <td>${item.Unit}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="6" class="text-center">Không có sản phẩm nào</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- Recent Activities -->
            <div class="table-container mt-20">
                <div class="table-header">
                    <h2><i class="fas fa-history"></i> Hoạt Động Gần Đây</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Loại GD</th>
                            <th>Thời Gian</th>
                            <th>Sản Phẩm</th>
                            <th>Kho</th>
                            <th>Số Lượng</th>
                            <th>Người Thực Hiện</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.recentActivities && data.recentActivities.length > 0 ? data.recentActivities.map(activity => `
                            <tr>
                                <td>
                                    ${activity.TransactionType === 'Import' ? 
                                        '<span class="badge badge-success">Nhập</span>' : 
                                        '<span class="badge badge-danger">Xuất</span>'}
                                </td>
                                <td>${Utils.formatDate(activity.TransactionDate)}</td>
                                <td>${activity.ProductName}</td>
                                <td>${activity.WarehouseName}</td>
                                <td>${activity.Quantity}</td>
                                <td>${activity.PerformedBy}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="6" class="text-center">Chưa có hoạt động nào</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }
};
