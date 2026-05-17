import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    output: 'export', // for firebase hosting
    images: {
        unoptimized: true,
    },

    // async rewrites() {   // comment for firebase hosting
    //     return [
    //         {
    //             source: '/api/:path*',
    //             destination: 'http://localhost:8000/api/:path*'
    //         }
    //     ]
    // }
};

export default nextConfig;
