// Products Page
const Products = {
    async load() {
        try {
            Utils.showLoading();
            const response = await API.get(API_ENDPOINTS.PRODUCTS);
            
            if (response.success) {
                this.render(response.data);
            }
        } catch (error) {
            Utils.showNotification('Lỗi tải danh sách sản phẩm: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    render(products) {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-box"></i> Danh Sách Sản Phẩm</h2>
                    <button class="btn btn-primary" onclick="Products.showAddModal()">
                        <i class="fas fa-plus"></i> Thêm Sản Phẩm
                    </button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Mã SP</th>
                            <th>Tên Sản Phẩm</th>
                            <th>Danh Mục</th>
                            <th>Đơn Vị</th>
                            <th>Tồn Kho</th>
                            <th>Đơn Giá</th>
                            <th>Trạng Thái</th>
                            <th>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => `
                            <tr>
                                <td>${product.ProductCode}</td>
                                <td>${product.ProductName}</td>
                                <td>${product.CategoryName || '-'}</td>
                                <td>${product.Unit}</td>
                                <td>${product.TotalStock}</td>
                                <td>${Utils.formatCurrency(product.UnitPrice)}</td>
                                <td>
                                    ${this.getStockStatusBadge(product.TotalStock, product.IsActive)}
                                </td>
                                <td>
                                    <button class="btn-icon" onclick="Products.showEditModal(${product.ProductID})" title="Sửa">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon delete" onclick="Products.deleteProduct(${product.ProductID})" title="Xóa">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Product Modal -->
            <div id="productModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modalTitle">Thêm Sản Phẩm</h2>
                        <span class="close" onclick="Products.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="productForm" onsubmit="Products.saveProduct(event)">
                            <input type="hidden" id="productId">
                            <div class="form-group">
                                <label>Tên Sản Phẩm</label>
                                <input type="text" id="productName" required>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Danh Mục</label>
                                    <select id="categoryId">
                                        <option value="5">Thời trang</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Đơn Vị</label>
                                    <input type="text" id="unit" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Đơn Giá</label>
                                    <input type="number" id="price" required min="0">
                                </div>
                                <div class="form-group">
                                    <label>Tồn Tối Thiểu</label>
                                    <input type="number" id="minStock" value="10" min="0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Mô Tả</label>
                                <textarea id="description" rows="3"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="Products.closeModal()">Hủy</button>
                                <button type="submit" class="btn btn-primary">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    showAddModal() {
        document.getElementById('modalTitle').innerText = 'Thêm Sản Phẩm';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('productModal').style.display = 'block';
    },

    getStockStatusBadge(stock, isActive) {
        if (!isActive) return '<span class="badge badge-danger">Ngừng kinh doanh</span>';
        if (stock === 0) return '<span class="badge badge-danger">Hết hàng</span>';
        if (stock <= 10) return '<span class="badge badge-warning">Sắp hết hàng</span>';
        return '<span class="badge badge-success">Còn hàng</span>';
    },

    async showEditModal(id) {
        try {
            const response = await API.get(API_ENDPOINTS.PRODUCT_BY_ID(id));
            if (response.success) {
                const product = response.data;
                document.getElementById('modalTitle').innerText = 'Sửa Sản Phẩm';
                document.getElementById('productId').value = product.ProductID;
                document.getElementById('productName').value = product.ProductName;
                document.getElementById('categoryId').value = product.CategoryID || 1;
                document.getElementById('unit').value = product.Unit;
                document.getElementById('price').value = product.UnitPrice;
                document.getElementById('minStock').value = product.MinStockLevel;
                document.getElementById('description').value = product.Description || '';
                document.getElementById('productModal').style.display = 'block';
            }
        } catch (error) {
            Utils.showNotification('Lỗi tải thông tin sản phẩm', 'error');
        }
    },

    closeModal() {
        document.getElementById('productModal').style.display = 'none';
    },

    async saveProduct(event) {
        event.preventDefault();
        const id = document.getElementById('productId').value;
        const data = {
            ProductName: document.getElementById('productName').value,
            CategoryID: document.getElementById('categoryId').value,
            Unit: document.getElementById('unit').value,
            UnitPrice: document.getElementById('price').value,
            MinStockLevel: document.getElementById('minStock').value,
            Description: document.getElementById('description').value,
            IsActive: 1
        };

        try {
            let response;
            if (id) {
                response = await API.put(API_ENDPOINTS.PRODUCT_BY_ID(id), data);
            } else {
                response = await API.post(API_ENDPOINTS.PRODUCTS, data);
            }

            if (response.success) {
                Utils.showNotification('Lưu sản phẩm thành công', 'success');
                this.closeModal();
                this.load();
            } else {
                Utils.showNotification(response.message, 'error');
            }
        } catch (error) {
            Utils.showNotification('Lỗi lưu sản phẩm: ' + error.message, 'error');
        }
    },

    async deleteProduct(id) {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                const response = await API.delete(API_ENDPOINTS.PRODUCT_BY_ID(id));
                if (response.success) {
                    Utils.showNotification('Xóa sản phẩm thành công', 'success');
                    this.load();
                } else {
                    Utils.showNotification(response.message, 'error');
                }
            } catch (error) {
                Utils.showNotification('Lỗi xóa sản phẩm: ' + error.message, 'error');
            }
        }
    }
};
