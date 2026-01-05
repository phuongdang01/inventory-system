// Exports Page
const Exports = {
    products: [],

    async load() {
        try {
            Utils.showLoading();
            const response = await API.get(API_ENDPOINTS.EXPORTS);
            
            if (response.success) {
                this.render(response.data);
            }
        } catch (error) {
            Utils.showNotification('Lỗi tải danh sách phiếu xuất: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    render(exports) {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-arrow-up"></i> Danh Sách Phiếu Xuất</h2>
                    <button class="btn btn-primary" onclick="Exports.showAddModal()">
                        <i class="fas fa-plus"></i> Tạo Phiếu Xuất
                    </button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Mã Phiếu</th>
                            <th>Kho</th>
                            <th>Khách Hàng</th>
                            <th>Loại</th>
                            <th>Ngày Xuất</th>
                            <th>Tổng Tiền</th>
                            <th>Trạng Thái</th>
                            <th>Người Tạo</th>
                            <th>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${exports.map(exp => `
                            <tr>
                                <td>${exp.ExportOrderCode}</td>
                                <td>${exp.WarehouseName}</td>
                                <td>${exp.CustomerName || '-'}</td>
                                <td>${exp.ExportType}</td>
                                <td>${Utils.formatDateOnly(exp.ExportDate)}</td>
                                <td>${Utils.formatCurrency(exp.TotalAmount)}</td>
                                <td>${Utils.getStatusBadge(exp.Status)}</td>
                                <td>${exp.CreatorName}</td>
                                <td>
                                    ${this.getActions(exp)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Export Modal -->
            <div id="exportModal" class="modal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>Tạo Phiếu Xuất Kho</h2>
                        <span class="close" onclick="Exports.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="exportForm" onsubmit="Exports.saveExport(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Kho Xuất</label>
                                    <select id="warehouseId" required>
                                        <option value="1">Kho Chính</option>
                                        <option value="2">Kho Phụ</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Khách Hàng</label>
                                    <select id="customerId" required>
                                        <option value="1">Khách Hàng A</option>
                                        <option value="2">Khách Hàng B</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Loại Xuất</label>
                                    <select id="exportType" required>
                                        <option value="Sale">Bán Hàng</option>
                                        <option value="Transfer">Chuyển Kho</option>
                                        <option value="Other">Khác</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Ngày Xuất</label>
                                    <input type="date" id="exportDate" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Chi Tiết Sản Phẩm</label>
                                <div id="productDetails">
                                    <!-- Dynamic rows -->
                                </div>
                                <button type="button" class="btn btn-secondary btn-sm mt-10" onclick="Exports.addProductRow()">
                                    <i class="fas fa-plus"></i> Thêm dòng
                                </button>
                            </div>

                            <div class="form-group" style="text-align: right; font-weight: bold; font-size: 1.2em;">
                                Tổng tiền: <span id="totalAmount">0</span> VND
                            </div>

                            <div class="form-group">
                                <label>Ghi Chú</label>
                                <textarea id="notes" rows="2"></textarea>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="Exports.closeModal()">Hủy</button>
                                <button type="submit" class="btn btn-primary">Lưu Phiếu</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    getActions(exp) {
        const user = Auth.getUser();
        if (!user) return '';

        let actions = '';
        
        // Manager/Admin actions for Pending orders
        if (exp.Status === 'Pending' && ['Admin', 'Manager'].includes(user.role)) {
            actions += `
                <button class="btn-icon" onclick="Exports.approveOrder(${exp.ExportOrderID})" title="Duyệt" style="color: green;">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-icon" onclick="Exports.cancelOrder(${exp.ExportOrderID})" title="Hủy" style="color: red;">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }

        // Staff/Manager/Admin actions for Approved orders
        if (exp.Status === 'Approved') {
            actions += `
                <button class="btn-icon" onclick="Exports.completeOrder(${exp.ExportOrderID})" title="Hoàn thành xuất kho" style="color: blue;">
                    <i class="fas fa-truck"></i>
                </button>
            `;
        }

        return actions;
    },

    async approveOrder(id) {
        if (confirm('Bạn có chắc chắn muốn duyệt phiếu xuất này?')) {
            try {
                const response = await API.put(API_ENDPOINTS.EXPORT_APPROVE(id));
                if (response.success) {
                    Utils.showNotification('Đã duyệt phiếu xuất', 'success');
                    this.load();
                } else {
                    Utils.showNotification(response.message, 'error');
                }
            } catch (error) {
                Utils.showNotification('Lỗi: ' + error.message, 'error');
            }
        }
    },

    async cancelOrder(id) {
        if (confirm('Bạn có chắc chắn muốn hủy phiếu xuất này?')) {
            try {
                const response = await API.put(API_ENDPOINTS.EXPORT_CANCEL(id));
                if (response.success) {
                    Utils.showNotification('Đã hủy phiếu xuất', 'success');
                    this.load();
                } else {
                    Utils.showNotification(response.message, 'error');
                }
            } catch (error) {
                Utils.showNotification('Lỗi: ' + error.message, 'error');
            }
        }
    },

    async completeOrder(id) {
        if (confirm('Xác nhận hàng đã xuất kho và hoàn thành phiếu?')) {
            try {
                const response = await API.put(`${API_ENDPOINTS.EXPORTS}/${id}/complete`);
                if (response.success) {
                    Utils.showNotification('Xuất kho thành công', 'success');
                    this.load();
                } else {
                    Utils.showNotification(response.message, 'error');
                }
            } catch (error) {
                Utils.showNotification('Lỗi: ' + error.message, 'error');
            }
        }
    },

    async showAddModal() {
        try {
            // Load products if not already loaded
            if (this.products.length === 0) {
                const response = await API.get(API_ENDPOINTS.PRODUCTS);
                if (response.success) {
                    this.products = response.data;
                }
            }

            document.getElementById('exportForm').reset();
            document.getElementById('exportDate').valueAsDate = new Date();
            document.getElementById('productDetails').innerHTML = '';
            this.addProductRow(); // Add first row
            document.getElementById('exportModal').style.display = 'block';
        } catch (error) {
            Utils.showNotification('Lỗi tải danh sách sản phẩm: ' + error.message, 'error');
        }
    },

    closeModal() {
        document.getElementById('exportModal').style.display = 'none';
    },

    addProductRow() {
        const container = document.getElementById('productDetails');
        const row = document.createElement('div');
        row.className = 'form-row product-row';
        
        const productOptions = this.products.map(p => 
            `<option value="${p.ProductID}">${p.ProductCode} - ${p.ProductName}</option>`
        ).join('');

        row.innerHTML = `
            <div class="form-group" style="flex: 2;">
                <select class="product-select" required onchange="Exports.updatePrice(this)">
                    <option value="">Chọn sản phẩm</option>
                    ${productOptions}
                </select>
            </div>
            <div class="form-group">
                <input type="number" class="quantity-input" placeholder="SL" required min="1" oninput="Exports.updateTotal()">
            </div>
            <div class="form-group">
                <input type="number" class="price-input" placeholder="Đơn giá" required min="0" oninput="Exports.updateTotal()">
            </div>
            <button type="button" class="btn-icon delete" onclick="this.parentElement.remove(); Exports.updateTotal();">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(row);
    },

    updatePrice(selectElement) {
        const productId = selectElement.value;
        const row = selectElement.closest('.product-row');
        const priceInput = row.querySelector('.price-input');
        
        const product = this.products.find(p => p.ProductID == productId);
        if (product) {
            priceInput.value = product.UnitPrice;
        } else {
            priceInput.value = '';
        }
        this.updateTotal();
    },

    updateTotal() {
        let total = 0;
        const rows = document.querySelectorAll('.product-row');
        
        rows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.quantity-input').value) || 0;
            const price = parseFloat(row.querySelector('.price-input').value) || 0;
            total += quantity * price;
        });

        document.getElementById('totalAmount').textContent = Utils.formatCurrency(total);
    },

    async saveExport(event) {
        event.preventDefault();
        
        const details = [];
        const rows = document.querySelectorAll('.product-row');
        
        rows.forEach(row => {
            const productId = row.querySelector('.product-select').value;
            const quantity = row.querySelector('.quantity-input').value;
            const price = row.querySelector('.price-input').value;
            
            if (productId && quantity && price) {
                details.push({
                    ProductID: parseInt(productId),
                    Quantity: parseInt(quantity),
                    UnitPrice: parseFloat(price)
                });
            }
        });

        if (details.length === 0) {
            Utils.showNotification('Vui lòng thêm ít nhất một sản phẩm', 'error');
            return;
        }

        const data = {
            WarehouseID: document.getElementById('warehouseId').value,
            CustomerID: document.getElementById('customerId').value,
            ExportType: document.getElementById('exportType').value,
            ExportDate: document.getElementById('exportDate').value,
            Notes: document.getElementById('notes').value,
            Details: details
        };

        try {
            const response = await API.post(API_ENDPOINTS.EXPORTS, data);
            if (response.success) {
                Utils.showNotification('Tạo phiếu xuất thành công', 'success');
                this.closeModal();
                this.load();
            } else {
                Utils.showNotification(response.message, 'error');
            }
        } catch (error) {
            Utils.showNotification('Lỗi tạo phiếu xuất: ' + error.message, 'error');
        }
    }
};
