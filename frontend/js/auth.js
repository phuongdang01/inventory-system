// Authentication Management
const Auth = {
    TOKEN_KEY: 'inventory_token',
    USER_KEY: 'inventory_user',

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    getUser() {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        window.location.reload();
    }
};

// Login Handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await API.post(API_ENDPOINTS.LOGIN, {
            username,
            password
        });

        if (response.success) {
            Auth.setToken(response.data.token);
            Auth.setUser(response.data.user);
            document.getElementById('loginModal').classList.remove('show');
            window.location.reload();
        }
    } catch (error) {
        alert(error.message || 'Đăng nhập thất bại');
    }
});

// Logout Handler
document.getElementById('btnLogout')?.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        Auth.logout();
    }
});

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    
    if (!Auth.isAuthenticated()) {
        loginModal.classList.add('show');
    } else {
        const user = Auth.getUser();
        document.getElementById('userName').textContent = user.fullName || user.username;
    }
});
