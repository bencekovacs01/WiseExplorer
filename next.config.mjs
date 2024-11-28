/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    env: {
        ORS_KEY: process.env.ORS_KEY
    }
};

export default nextConfig;
