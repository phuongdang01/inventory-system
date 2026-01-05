// Users Page
const Users = {
    async load() {
        try {
            Utils.showLoading();
            const response = await API.get(API_ENDPOINTS.USERS);
            
            if (response.success) {
                this.render(response.data);
            }
        } catch (error) {
            Utils.showNotification('Lỗi tải danh sách người dùng: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    render(users) {
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-users"></i> Quản Lý Người Dùng</h2>
                    <button class="btn btn-primary" onclick="Users.showAddModal()">
                        <i class="fas fa-plus"></i> Thêm Người Dùng
                    </button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Họ Tên</th>
                            <th>Liên Hệ</th>
                            <th>Vai Trò</th>
                            <th>Trạng Thái</th>
                            <th>Hoạt Động Gần Nhất</th>
                            <th>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>
                                    <div style="font-weight: bold;">${user.FullName}</div>
                                    <div style="font-size: 0.85em; color: #666;">@${user.Username}</div>
                                </td>
                                <td>
                                    <div><i class="fas fa-envelope"></i> ${user.Email || '-'}</div>
                                    <div><i class="fas fa-phone"></i> ${user.Phone || '-'}</div>
                                </td>
                                <td>${this.getRoleBadge(user.Role)}</td>
                                <td>
                                    ${user.IsActive ? 
                                        '<span class="badge badge-success">Hoạt động</span>' : 
                                        '<span class="badge badge-danger">Đã khóa</span>'}
                                </td>
                                <td>${Utils.timeAgo(user.LastLogin)}</td>
                                <td>
                                    <button class="btn-icon" onclick="Users.showEditModal(${user.UserID})" title="Sửa">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon delete" onclick="Users.deleteUser(${user.UserID})" title="Xóa">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- User Modal -->
            <div id="userModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modalTitle">Thêm Người Dùng</h2>
                        <span class="close" onclick="Users.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="userForm" onsubmit="Users.saveUser(event)">
                            <input type="hidden" id="userId">
                            <div class="form-group">
                                <label>Tên Đăng Nhập</label>
                                <input type="text" id="username" required>
                            </div>
                            <div class="form-group" id="passwordGroup">
                                <label>Mật Khẩu</label>
                                <input type="password" id="password">
                                <small class="text-muted" id="passwordHint" style="display:none">Để trống nếu không muốn đổi mật khẩu</small>
                            </div>
                            <div class="form-group">
                                <label>Họ Tên</label>
                                <input type="text" id="fullName" required>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" id="email">
                                </div>
                                <div class="form-group">
                                    <label>Số Điện Thoại</label>
                                    <input type="tel" id="phone">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Vai Trò</label>
                                    <select id="role" required>
                                        <option value="Staff">Nhân viên</option>
                                        <option value="Manager">Quản lý</option>
                                        <option value="Admin">Quản trị viên</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Trạng Thái</label>
                                    <select id="isActive">
                                        <option value="1">Hoạt động</option>
                                        <option value="0">Khóa</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="Users.closeModal()">Hủy</button>
                                <button type="submit" class="btn btn-primary">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    getRoleBadge(role) {
        const badges = {
            'Admin': '<span class="badge badge-danger">Quản trị viên</span>',
            'Manager': '<span class="badge badge-info">Quản lý</span>',
            'Staff': '<span class="badge badge-secondary">Nhân viên</span>'
        };
        return badges[role] || role;
    },

    showAddModal() {
        document.getElementById('modalTitle').innerText = 'Thêm Người Dùng';
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('username').disabled = false;
        document.getElementById('password').required = true;
        document.getElementById('passwordHint').style.display = 'none';
        document.getElementById('userModal').style.display = 'block';
    },

    async showEditModal(id) {
        try {
            // Since we don't have a specific get-by-id endpoint in the list endpoint, 
            // we can fetch all and find, or implement get-by-id. 
            // For now, let's fetch all and find to save time implementing another endpoint if not needed,
            // but better to use the endpoint if available.
            // Actually I didn't implement GET /:id in backend/routes/users.js.
            // I'll just fetch the list again or use the data from the table if I stored it.
            // But to be safe, let's just fetch the list again and find the user.
            
            const response = await API.get(API_ENDPOINTS.USERS);
            if (response.success) {
                const user = response.data.find(u => u.UserID == id);
                if (user) {
                    document.getElementById('modalTitle').innerText = 'Sửa Người Dùng';
                    document.getElementById('userId').value = user.UserID;
                    document.getElementById('username').value = user.Username;
                    document.getElementById('username').disabled = true; // Cannot change username
                    document.getElementById('fullName').value = user.FullName;
                    document.getElementById('email').value = user.Email || '';
                    document.getElementById('phone').value = user.Phone || '';
                    document.getElementById('role').value = user.Role;
                    document.getElementById('isActive').value = user.IsActive ? '1' : '0';
                    
                    document.getElementById('password').required = false;
                    document.getElementById('password').value = '';
                    document.getElementById('passwordHint').style.display = 'block';
                    
                    document.getElementById('userModal').style.display = 'block';
                }
            }
        } catch (error) {
            Utils.showNotification('Lỗi tải thông tin người dùng', 'error');
        }
    },

    closeModal() {
        document.getElementById('userModal').style.display = 'none';
    },

    async saveUser(event) {
        event.preventDefault();
        const id = document.getElementById('userId').value;
        const data = {
            Username: document.getElementById('username').value,
            FullName: document.getElementById('fullName').value,
            Email: document.getElementById('email').value,
            Phone: document.getElementById('phone').value,
            Role: document.getElementById('role').value,
            IsActive: document.getElementById('isActive').value
        };

        const password = document.getElementById('password').value;
        if (password) {
            data.Password = password;
        }

        try {
            let response;
            if (id) {
                response = await API.put(`${API_ENDPOINTS.USERS}/${id}`, data);
            } else {
                response = await API.post(API_ENDPOINTS.USERS, data);
            }

            if (response.success) {
                Utils.showNotification('Lưu người dùng thành công', 'success');
                this.closeModal();
                this.load();
            } else {
                Utils.showNotification(response.message, 'error');
            }
        } catch (error) {
            Utils.showNotification('Lỗi lưu người dùng: ' + error.message, 'error');
        }
    },

    async deleteUser(id) {
        if (confirm('Bạn có chắc chắn muốn xóa (vô hiệu hóa) người dùng này?')) {
            try {
                const response = await API.delete(`${API_ENDPOINTS.USERS}/${id}`);
                if (response.success) {
                    Utils.showNotification('Xóa người dùng thành công', 'success');
                    this.load();
                } else {
                    Utils.showNotification(response.message, 'error');
                }
            } catch (error) {
                Utils.showNotification('Lỗi xóa người dùng: ' + error.message, 'error');
            }
        }
    }
};
