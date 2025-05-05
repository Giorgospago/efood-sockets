const axios = require("axios");

const axiosInstance = axios.create({
    baseURL: process.env.API_URL
});

axiosInstance.interceptors.request.use((config) => {
    const token = process.env.API_TOKEN;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

module.exports = axiosInstance;