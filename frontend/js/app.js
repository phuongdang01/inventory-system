// Main Application
const App = {
    currentPage: 'dashboard',

    init() {
        if (!Auth.isAuthenticated()) {
            return;
        }

        this.setupNavigation();
        this.setupMobileMenu();
        this.navigate('dashboard');
        this.loadNotifications();
        
        // Poll notifications every 30 seconds
        setInterval(() => this.loadNotifications(), 30000);
    },

    async loadNotifications() {
        try {
            const response = await API.get(API_ENDPOINTS.ALERTS);
            if (response.success) {
                this.renderNotifications(response.data);
            }
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    },

    renderNotifications(alerts) {
        const countElement = document.getElementById('notificationCount');
        const listElement = document.getElementById('notificationItems');
        
        if (alerts.length > 0) {
            countElement.textContent = alerts.length;
            countElement.style.display = 'block';
            
            listElement.innerHTML = alerts.map(alert => `
                <div class="notification-item ${alert.AlertType === 'LowStock' ? 'warning' : ''}">
                    <div class="notification-content">
                        <div class="notification-title">
                            <i class="fas fa-exclamation-triangle"></i> ${alert.ProductName}
                        </div>
                        <div class="notification-message">${alert.AlertMessage}</div>
                        <div class="notification-time">${Utils.timeAgo(alert.CreatedAt)}</div>
                    </div>
                    <button class="btn-icon small" onclick="App.resolveAlert(${alert.AlertID})" title="Đã xem">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            `).join('');
        } else {
            countElement.style.display = 'none';
            listElement.innerHTML = '<div class="no-notifications">Không có thông báo mới</div>';
        }
    },

    async resolveAlert(id) {
        try {
            await API.put(API_ENDPOINTS.ALERT_RESOLVE(id));
            this.loadNotifications();
        } catch (error) {
            console.error('Failed to resolve alert', error);
        }
    },

    toggleNotifications() {
        const dropdown = document.getElementById('notificationList');
        dropdown.classList.toggle('show');
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigate(page);
            });
        });
    },

    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        menuToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    },

    navigate(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });

        // Update page title
        const pageTitles = {
            dashboard: 'Dashboard',
            products: 'Sản Phẩm',
            imports: 'Phiếu Nhập',
            exports: 'Phiếu Xuất',
            inventory: 'Tồn Kho',
            reports: 'Báo Cáo',
            users: 'Quản Lý Người Dùng'
        };

        document.querySelector('.page-title').textContent = pageTitles[page] || 'Dashboard';

        // Load page content
        this.currentPage = page;
        this.loadPage(page);

        // Close mobile menu
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('active');
        }
    },

    loadPage(page) {
        const pages = {
            dashboard: Dashboard,
            products: Products,
            imports: Imports,
            exports: Exports,
            inventory: Inventory,
            reports: Reports,
            users: Users
        };

        const pageModule = pages[page];
        if (pageModule && pageModule.load) {
            pageModule.load();
        }
    }
};

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure auth check is complete
    setTimeout(() => {
        if (Auth.isAuthenticated()) {
            App.init();
        }
    }, 100);
});
