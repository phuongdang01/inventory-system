// API Configuration
const API_CONFIG = {
    BASE_URL: '/api',
    TIMEOUT: 30000
};

// API Endpoints
const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    ME: '/auth/me',
    
    // Products
    PRODUCTS: '/products',
    PRODUCT_BY_ID: (id) => `/products/${id}`,
    
    // Imports
    IMPORTS: '/imports',
    IMPORT_BY_ID: (id) => `/imports/${id}`,
    IMPORT_APPROVE: (id) => `/imports/${id}/approve`,
    IMPORT_CANCEL: (id) => `/imports/${id}/cancel`,
    
    // Exports
    EXPORTS: '/exports',
    EXPORT_BY_ID: (id) => `/exports/${id}`,
    EXPORT_APPROVE: (id) => `/exports/${id}/approve`,
    EXPORT_CANCEL: (id) => `/exports/${id}/cancel`,
    
    // Reports
    DASHBOARD: '/reports/dashboard',
    INVENTORY_REPORT: '/reports/inventory',
    MOVEMENT_REPORT: '/reports/movement',
    STATISTICS: '/reports/statistics',

    // Users
    USERS: '/users',
    USER_BY_ID: (id) => `/users/${id}`,

    // Alerts
    ALERTS: '/alerts',
    ALERT_RESOLVE: (id) => `/alerts/${id}/resolve`
};
