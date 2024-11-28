import axios from 'axios';

const createAxiosInstance = (baseURL: string, apiKey?: string | undefined) => {
    const instance = axios.create({
        baseURL,
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    instance.interceptors.request.use(
        (config) => {
            if (apiKey !== undefined) {
                if (!apiKey) {
                    return Promise.reject({
                        message: 'OpenRouteService API key error!',
                    });
                }

                config.params = {
                    ...config.params,
                    api_key: apiKey,
                };

                config.headers['Content-Type'] = 'application/json';
            }
            return config;
        },
        (error) => Promise.reject(error),
    );

    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            return Promise.reject(error);
        },
    );

    return instance;
};

const ORS_KEY = process.env.ORS_KEY;
const axiosORS = createAxiosInstance(
    'https://api.openrouteservice.org/v2',
    ORS_KEY,
);
const axiosEW = createAxiosInstance('/api/pois', undefined);

export { axiosORS, axiosEW };
