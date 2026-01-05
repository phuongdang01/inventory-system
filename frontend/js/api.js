// API Helper
const API = {
    async request(endpoint, options = {}) {
        const token = Auth.getToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
            
            // Handle empty responses or non-JSON responses
            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                console.error('Failed to parse JSON response:', text);
                throw new Error('Server returned invalid response');
            }

            if (!response.ok) {
                if (response.status === 401) {
                    Auth.logout();
                    throw new Error('Phiên đăng nhập đã hết hạn');
                }
                throw new Error(data.message || 'Có lỗi xảy ra');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// Helper Functions
const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatDateOnly(dateString) {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    timeAgo(dateString) {
        if (!dateString) return 'Chưa đăng nhập';
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        
        return Math.floor(seconds) + " giây trước";
    },

    showLoading() {
        // Simple loading indicator
        document.body.style.cursor = 'wait';
    },

    hideLoading() {
        document.body.style.cursor = 'default';
    },

    showNotification(message, type = 'info') {
        alert(message); // Simple notification, can be enhanced with a library
    },

    getStatusBadge(status) {
        const badges = {
            'Pending': '<span class="badge badge-warning">Chờ duyệt</span>',
            'Approved': '<span class="badge badge-info">Đã duyệt</span>',
            'Completed': '<span class="badge badge-success">Hoàn thành</span>',
            'Cancelled': '<span class="badge badge-danger">Đã hủy</span>'
        };
        return badges[status] || status;
    }
};
