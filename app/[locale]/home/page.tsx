'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import BoltIcon from '@mui/icons-material/Bolt';
import TuneIcon from '@mui/icons-material/Tune';
import UpdateIcon from '@mui/icons-material/Update';
import Header from '@/src/components/Header/Header';

export default function Page() {
    const mapUrl = '/en/map';

    // const [prevScrollPos, setPrevScrollPos] = useState(0);
    // const [visible, setVisible] = useState(true);

    // useEffect(() => {
    //     document.documentElement.style.scrollBehavior = 'smooth';

    //     const handleScroll = () => {
    //         const currentScrollPos = window.pageYOffset;

    //         if (currentScrollPos <= 10) {
    //             console.log('currentScrollPos', currentScrollPos);
    //             setVisible(true);
    //             return;
    //         }

    //         const isScrollingDown = prevScrollPos < currentScrollPos;
    //         setVisible(!isScrollingDown);
    //         setPrevScrollPos(currentScrollPos);
    //     };

    //     window.addEventListener('scroll', handleScroll);

    //     return () => {
    //         window.removeEventListener('scroll', handleScroll);
    //         document.documentElement.style.scrollBehavior = '';
    //     };
    // }, [prevScrollPos]);

    // const headerClasses = `sticky top-0 align-center z-50 bg-gradient-to-r from-blue-900 to-blue-800 shadow-sm py-4 px-8 transition-transform duration-300 ${
    //     visible ? 'translate-y-0' : '-translate-y-full'
    // }`;

    return (
        <div className="landing-page bg-white text-gray-900">
            <Header/>

            {/* <header className={headerClasses}>
                <div className="container mx-auto">
                    <div className="flex items-center">
                        <Image
                            src="/favicon.ico"
                            alt="WiseExplorer Logo"
                            width={32}
                            height={32}
                            className="mr-3"
                        />
                        <Link
                            href="/en/home"
                            className="text-2xl font-bold text-blue-900"
                        >
                            WiseExplorer
                        </Link>
                        <div className="ml-auto hidden md:flex items-center space-x-6">
                            <Link
                                href={mapUrl}
                                className="text-blue-900 hover:text-orange-500 transition-colors"
                            >
                                Map
                            </Link>
                            <a
                                href="#features"
                                className="text-blue-900 hover:text-orange-500 transition-colors"
                            >
                                Features
                            </a>
                            <a
                                href="#technology"
                                className="text-blue-900 hover:text-orange-500 transition-colors"
                            >
                                Technology
                            </a>
                            <Link
                                href={mapUrl}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-medium rounded-lg"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </header> */}

            <section className="hero-section bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20 px-8">
                <div className="container mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center ">
                        <div className="hero-content">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                Plan Your Perfect City Route Effortlessly
                            </h1>
                            <p className="text-xl mb-8 text-blue-100">
                                Discover the smartest way to visit all your
                                favorite spots in the city with our advanced
                                route optimization technology.
                            </p>
                            <div className="cta-buttons flex flex-wrap gap-4">
                                <Link
                                    href={mapUrl}
                                    className="px-8 py-3 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-medium rounded-lg text-lg"
                                >
                                    Try Now
                                </Link>
                                <a
                                    href="#features"
                                    className="px-8 py-3 bg-transparent border-2 border-white hover:bg-white hover:text-blue-900 transition-colors font-medium rounded-lg text-lg"
                                >
                                    Learn More
                                </a>
                            </div>
                        </div>
                        <div className="hero-image relative h-[300px] rounded-lg overflow-hidden shadow-2xl">
                            <Image
                                src="/map-preview.png"
                                alt="Route optimization preview"
                                fill
                                style={{
                                    objectFit: 'cover',
                                    borderRadius: '50px',
                                }}
                                priority
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="features-section py-20 px-8">
                <div className="container mx-auto max-w-6xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-blue-900">
                        Key Features
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="feature-card p-6 rounded-lg shadow-lg border border-gray-100 hover:border-blue-200 transition-all">
                            <div className="feature-icon mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                <BoltIcon
                                    sx={{ fontSize: 32, color: '#1e3a8a' }}
                                />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-blue-900">
                                Lightning-Fast Route Calculations
                            </h3>
                            <p className="text-gray-700">
                                Our advanced algorithms find optimal routes in
                                seconds, saving you hours of planning time.
                            </p>
                        </div>

                        <div className="feature-card p-6 rounded-lg shadow-lg border border-gray-100 hover:border-blue-200 transition-all">
                            <div className="feature-icon mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                <TuneIcon
                                    sx={{ fontSize: 32, color: '#1e3a8a' }}
                                />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-blue-900">
                                Customizable Constraints
                            </h3>
                            <p className="text-gray-700">
                                Set time limits, prioritize important locations,
                                and choose your preferred transportation method.
                            </p>
                        </div>

                        <div className="feature-card p-6 rounded-lg shadow-lg border border-gray-100 hover:border-blue-200 transition-all">
                            <div className="feature-icon mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                <UpdateIcon
                                    sx={{ fontSize: 32, color: '#1e3a8a' }}
                                />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-blue-900">
                                Real-Time Updates
                            </h3>
                            <p className="text-gray-700">
                                Get live traffic data and instant recalculations
                                if your plans change during your journey.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="technology"
                className="algorithms-section py-20 px-8 bg-gray-50"
            >
                <div className="container mx-auto max-w-6xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-blue-900">
                        Smart Optimization Technology
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
                            <thead className="bg-blue-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        Algorithm
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        Best For
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        Speed
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        Accuracy
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4 font-medium">
                                        Bitonic TSP
                                    </td>
                                    <td className="px-6 py-4">
                                        Shorter routes, Quick results
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-green-600 font-medium">
                                            Very Fast
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">Good</td>
                                </tr>
                                <tr className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4 font-medium">
                                        Ant Colony Optimization
                                    </td>
                                    <td className="px-6 py-4">
                                        Complex routes, Multiple constraints
                                    </td>
                                    <td className="px-6 py-4">Medium</td>
                                    <td className="px-6 py-4">
                                        <span className="text-green-600 font-medium">
                                            Excellent
                                        </span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4 font-medium">
                                        Nearest Neighbor
                                    </td>
                                    <td className="px-6 py-4">
                                        Simple optimization, Beginner friendly
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-green-600 font-medium">
                                            Ultra Fast
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">Moderate</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <section className="cta-section py-20 px-8 bg-gradient-to-r from-blue-800 to-blue-900 text-white text-center">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Ready to Experience Smarter City Exploration?
                    </h2>
                    <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
                        Stop wasting time planning your routes. Let our advanced
                        algorithms do the work for you.
                    </p>
                    <Link
                        href={mapUrl}
                        className="inline-block px-8 py-4 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-medium rounded-lg text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        Generate Your Perfect Route
                    </Link>
                </div>
            </section>

            <footer className="footer-section py-8 px-8 bg-gray-100 text-center text-gray-600">
                <div className="container mx-auto max-w-6xl">
                    <p>
                        © {new Date().getFullYear()} WiseExplorer • All Rights
                        Reserved
                    </p>
                </div>
            </footer>
        </div>
    );
}
