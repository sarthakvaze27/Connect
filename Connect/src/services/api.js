import axios from'axios';

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // Add timeout
});

console.log("API instance created:", api); // Debug

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log("API interceptor - token from localStorage:", token); 
    if(token)
    {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("API interceptor - setting Authorization header:", config.headers.Authorization); 
    }
    else {
        console.log("API interceptor - no token found"); 
    }
    return config;
})

export default api;