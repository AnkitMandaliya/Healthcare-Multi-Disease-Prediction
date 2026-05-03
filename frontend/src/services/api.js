import axios from 'axios';

// Use environment variable for API Base URL
export const API_BASE = import.meta.env.VITE_API_URL || 'https://healthcare-multi-disease-prediction.onrender.com';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15s timeout for ML predictions
});

// Request Interceptor for Auth
api.interceptors.request.use(config => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
});

// Response Interceptor for Error Handling
api.interceptors.response.use(
    response => response,
    error => {
        const customError = {
            message: 'An unexpected error occurred',
            status: error.response?.status,
            data: error.response?.data
        };

        if (!error.response) {
            // Network error or server down
            customError.message = 'Server is unreachable. Please check your internet connection or try again later.';
        } else if (error.response.status === 401) {
            // Unauthorized - Clear session and redirect
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            if (window.location.pathname !== '/auth') {
                window.location.href = '/auth';
            }
            customError.message = 'Session expired. Please log in again.';
        } else if (error.response.status >= 500) {
            customError.message = 'Server error. Our team has been notified.';
        } else if (error.response.data?.message) {
            customError.message = error.response.data.message;
        }

        console.error(`[API Error ${customError.status || 'Network'}]:`, customError.message);
        return Promise.reject(customError);
    }
);

/**
 * Prediction Services
 */
export const predictRisk = async (disease, data, config = {}) => {
    try {
        const endpoint = `/predict_${disease}`;
        const response = await api.post(endpoint, data, config);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const fetchStats = async (disease) => {
    try {
        const response = await api.get(`/api/stats/${disease}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const fetchAIAdvice = async (data) => {
    try {
        const response = await api.post('/api/gemini/advice', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const checkHealth = async () => {
    try {
        const response = await api.get('/api/health');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default api;

