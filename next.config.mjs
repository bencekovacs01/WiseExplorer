/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    env: {
        ORS_KEY: process.env.ORS_KEY,
        CAR_NAV_PORT: process.env.CAR_NAV_PORT,
        FOOT_NAV_PORT: process.env.FOOT_NAV_PORT,
    },
    // output: "export"
};

export default nextConfig;
