// Imports Page
const Imports = {
    products: [],

    async load() {
        try {
            Utils.showLoading();
            const response = await API.get(API_ENDPOINTS.IMPORTS);
            
            if (response.success) {
                this.render(response.data);
            }
        } catch (error) {
            Utils.showNotification('Lỗi tải danh sách phiếu nhập: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    render(imports) {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-arrow-down"></i> Danh Sách Phiếu Nhập</h2>
                    <button class="btn btn-primary" onclick="Imports.showAddModal()">
                        <i class="fas fa-plus"></i> Tạo Phiếu Nhập
                    </button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Mã Phiếu</th>
                            <th>Kho</th>
                            <th>Nhà Cung Cấp</th>
                            <th>Ngày Nhập</th>
                            <th>Tổng Tiền</th>
                            <th>Trạng Thái</th>
                            <th>Người Tạo</th>
                            <th>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${imports.map(imp => `
                            <tr>
                                <td>${imp.ImportOrderCode}</td>
                                <td>${imp.WarehouseName}</td>
                                <td>${imp.SupplierName}</td>
                                <td>${Utils.formatDateOnly(imp.ImportDate)}</td>
                                <td>${Utils.formatCurrency(imp.TotalAmount)}</td>
                                <td>${Utils.getStatusBadge(imp.Status)}</td>
                                <td>${imp.CreatorName}</td>
                                <td>
                                    ${this.getActions(imp)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Import Modal -->
            <div id="importModal" class="modal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>Tạo Phiếu Nhập Kho</h2>
                        <span class="close" onclick="Imports.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="importForm" onsubmit="Imports.saveImport(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Kho Nhập</label>
                                    <select id="warehouseId" required>
                                        <option value="1">Kho Chính</option>
                                        <option value="2">Kho Phụ</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Nhà Cung Cấp</label>
                                    <select id="supplierId" required>
                                        <option value="1">NCC A</option>
                                        <option value="2">NCC B</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Ngày Nhập</label>
                                <input type="date" id="importDate" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Chi Tiết Sản Phẩm</label>
                                <div id="productDetails">
                                    <!-- Dynamic rows -->
                                </div>
                                <button type="button" class="btn btn-secondary btn-sm mt-10" onclick="Imports.addProductRow()">
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
                                <button type="button" class="btn btn-secondary" onclick="Imports.closeModal()">Hủy</button>
                                <button type="submit" class="btn btn-primary">Lưu Phiếu</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    getActions(imp) {
        const user = Auth.getUser();
        if (!user) return '';

        let actions = '';
        
        // Manager/Admin actions for Pending orders
        if (imp.Status === 'Pending' && ['Admin', 'Manager'].includes(user.role)) {
            actions += `
                <button class="btn-icon" onclick="Imports.approveOrder(${imp.ImportOrderID})" title="Duyệt" style="color: green;">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-icon" onclick="Imports.cancelOrder(${imp.ImportOrderID})" title="Hủy" style="color: red;">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }

        // Staff/Manager/Admin actions for Approved orders
        if (imp.Status === 'Approved') {
            actions += `
                <button class="btn-icon" onclick="Imports.completeOrder(${imp.ImportOrderID})" title="Hoàn thành nhập kho" style="color: blue;">
                    <i class="fas fa-box-open"></i>
                </button>
            `;
        }

        return actions;
    },

    async approveOrder(id) {
        if (confirm('Bạn có chắc chắn muốn duyệt phiếu nhập này?')) {
            try {
                const response = await API.put(API_ENDPOINTS.IMPORT_APPROVE(id));
                if (response.success) {
                    Utils.showNotification('Đã duyệt phiếu nhập', 'success');
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
        if (confirm('Bạn có chắc chắn muốn hủy phiếu nhập này?')) {
            try {
                const response = await API.put(API_ENDPOINTS.IMPORT_CANCEL(id));
                if (response.success) {
                    Utils.showNotification('Đã hủy phiếu nhập', 'success');
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
        if (confirm('Xác nhận hàng đã về kho và hoàn thành phiếu nhập?')) {
            try {
                const response = await API.put(`${API_ENDPOINTS.IMPORTS}/${id}/complete`);
                if (response.success) {
                    Utils.showNotification('Nhập kho thành công', 'success');
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

            document.getElementById('importForm').reset();
            document.getElementById('importDate').valueAsDate = new Date();
            document.getElementById('productDetails').innerHTML = '';
            this.addProductRow(); // Add first row
            document.getElementById('importModal').style.display = 'block';
        } catch (error) {
            Utils.showNotification('Lỗi tải danh sách sản phẩm: ' + error.message, 'error');
        }
    },

    closeModal() {
        document.getElementById('importModal').style.display = 'none';
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
                <select class="product-select" required onchange="Imports.updatePrice(this)">
                    <option value="">Chọn sản phẩm</option>
                    ${productOptions}
                </select>
            </div>
            <div class="form-group">
                <input type="number" class="quantity-input" placeholder="SL" required min="1" oninput="Imports.updateTotal()">
            </div>
            <div class="form-group">
                <input type="number" class="price-input" placeholder="Đơn giá" required min="0" oninput="Imports.updateTotal()">
            </div>
            <button type="button" class="btn-icon delete" onclick="this.parentElement.remove(); Imports.updateTotal();">
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

    async saveImport(event) {
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
            SupplierID: document.getElementById('supplierId').value,
            ImportDate: document.getElementById('importDate').value,
            Notes: document.getElementById('notes').value,
            Details: details
        };

        try {
            const response = await API.post(API_ENDPOINTS.IMPORTS, data);
            if (response.success) {
                Utils.showNotification('Tạo phiếu nhập thành công', 'success');
                this.closeModal();
                this.load();
            } else {
                Utils.showNotification(response.message, 'error');
            }
        } catch (error) {
            Utils.showNotification('Lỗi tạo phiếu nhập: ' + error.message, 'error');
        }
    }
};
