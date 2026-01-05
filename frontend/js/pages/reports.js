// Reports Page
const Reports = {
    async load() {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-file-alt"></i> Báo Cáo & Thống Kê</h2>
                </div>
                <div class="modal-body">
                    <div class="stats-grid">
                        <div class="stat-card primary" style="cursor: pointer;" onclick="Reports.showInventoryReport()">
                            <div class="stat-info">
                                <h3>Báo Cáo Tồn Kho</h3>
                                <p>Xem chi tiết tồn kho theo sản phẩm và kho</p>
                            </div>
                            <div class="stat-icon">
                                <i class="fas fa-boxes"></i>
                            </div>
                        </div>
                        
                        <div class="stat-card success" style="cursor: pointer;" onclick="Reports.showMovementReport()">
                            <div class="stat-info">
                                <h3>Báo Cáo Xuất Nhập Tồn</h3>
                                <p>Xem lịch sử xuất nhập theo thời gian</p>
                            </div>
                            <div class="stat-icon">
                                <i class="fas fa-exchange-alt"></i>
                            </div>
                        </div>
                        
                        <div class="stat-card warning" style="cursor: pointer;" onclick="Reports.showStatistics()">
                            <div class="stat-info">
                                <h3>Thống Kê</h3>
                                <p>Biểu đồ và thống kê chi tiết</p>
                            </div>
                            <div class="stat-icon">
                                <i class="fas fa-chart-bar"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    showInventoryReport() {
        Utils.showNotification('Đang chuyển đến trang tồn kho...', 'info');
        App.navigate('inventory');
    },

    async showMovementReport() {
        try {
            Utils.showLoading();
            const response = await API.get(API_ENDPOINTS.MOVEMENT_REPORT);
            
            if (response.success) {
                this.renderMovementReport(response.data);
            }
        } catch (error) {
            Utils.showNotification('Lỗi tải báo cáo: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    async showStatistics() {
        try {
            Utils.showLoading();
            const response = await API.get(API_ENDPOINTS.STATISTICS);
            
            if (response.success) {
                this.renderStatistics(response.data);
            }
        } catch (error) {
            Utils.showNotification('Lỗi tải thống kê: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    renderMovementReport(data) {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-exchange-alt"></i> Lịch Sử Xuất Nhập Kho</h2>
                    <button class="btn btn-secondary" onclick="Reports.load()"><i class="fas fa-arrow-left"></i> Quay lại</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Thời Gian</th>
                            <th>Loại GD</th>
                            <th>Mã SP</th>
                            <th>Tên Sản Phẩm</th>
                            <th>Kho</th>
                            <th>Số Lượng</th>
                            <th>Người Thực Hiện</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.length > 0 ? data.map(item => `
                            <tr>
                                <td>${Utils.formatDate(item.TransactionDate)}</td>
                                <td><span class="badge badge-${item.TransactionType === 'IN' ? 'success' : 'danger'}">${item.TransactionType === 'IN' ? 'Nhập kho' : 'Xuất kho'}</span></td>
                                <td>${item.ProductCode}</td>
                                <td>${item.ProductName}</td>
                                <td>${item.WarehouseName}</td>
                                <td>${item.Quantity}</td>
                                <td>${item.CreatorName}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="7" class="text-center">Chưa có dữ liệu</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderStatistics(data) {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-chart-bar"></i> Thống Kê Top Sản Phẩm</h2>
                    <button class="btn btn-secondary" onclick="Reports.load()"><i class="fas fa-arrow-left"></i> Quay lại</button>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Top 5 Nhập Nhiều Nhất</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Sản Phẩm</th>
                                    <th>Số Lượng</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.topImport.map(item => `
                                    <tr>
                                        <td>${item.ProductName}</td>
                                        <td>${item.TotalQuantity}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="stat-card">
                        <h3>Top 5 Xuất Nhiều Nhất</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Sản Phẩm</th>
                                    <th>Số Lượng</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.topExport.map(item => `
                                    <tr>
                                        <td>${item.ProductName}</td>
                                        <td>${item.TotalQuantity}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};
