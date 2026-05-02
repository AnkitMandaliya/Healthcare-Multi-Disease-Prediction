import axios from 'axios';

const API_BASE = ''; 

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(config => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/auth'; // Redirect to login
        }
        return Promise.reject(error);
    }
);

export const predictRisk = async (disease, data, config = {}) => {
    const endpoint = `/predict_${disease}`;
    const response = await api.post(endpoint, data, config);
    return response.data;
};

export const fetchStats = async (disease) => {
    const response = await api.get(`/api/stats/${disease}`);
    return response.data;
};

export const fetchAIAdvice = async (data) => {
    const response = await api.post('/api/gemini/advice', data);
    return response.data;
};

export const checkHealth = async () => {
    const response = await api.get('/api/health');
    return response.data;
};

export default api;
