// Inventory Page
const Inventory = {
    async load() {
        try {
            Utils.showLoading();
            const response = await API.get(API_ENDPOINTS.INVENTORY_REPORT);
            
            if (response.success) {
                this.render(response.data);
            }
        } catch (error) {
            Utils.showNotification('Lỗi tải báo cáo tồn kho: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    render(inventory) {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-boxes"></i> Báo Cáo Tồn Kho</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Mã SP</th>
                            <th>Tên Sản Phẩm</th>
                            <th>Kho</th>
                            <th>Số Lượng</th>
                            <th>Đơn Vị</th>
                            <th>Đơn Giá</th>
                            <th>Giá Trị</th>
                            <th>Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inventory && inventory.length > 0 ? inventory.map(item => `
                            <tr>
                                <td>${item.ProductCode}</td>
                                <td>${item.ProductName}</td>
                                <td>${item.WarehouseName}</td>
                                <td>${item.Quantity}</td>
                                <td>${item.Unit}</td>
                                <td>${Utils.formatCurrency(item.UnitPrice)}</td>
                                <td>${Utils.formatCurrency(item.TotalValue)}</td>
                                <td>
                                    ${item.StockStatus === 'Thấp' ? '<span class="badge badge-danger">Thấp</span>' :
                                      item.StockStatus === 'Cao' ? '<span class="badge badge-warning">Cao</span>' :
                                      '<span class="badge badge-success">Bình thường</span>'}
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="8" class="text-center">Không có dữ liệu</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }
};
