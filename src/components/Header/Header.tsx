'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
    mapUrl?: string;
    baseUrl?: string;
    onlyLogo?: boolean;
}

export default function Header({
    mapUrl = '/en/map',
    baseUrl = '/en/home',
    onlyLogo,
}: HeaderProps) {
    const [prevScrollPos, setPrevScrollPos] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';

        const handleScroll = () => {
            const currentScrollPos = window.pageYOffset;

            if (currentScrollPos <= 10) {
                console.log('currentScrollPos', currentScrollPos);
                setVisible(true);
                return;
            }

            const isScrollingDown = prevScrollPos < currentScrollPos;
            setVisible(!isScrollingDown);
            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.documentElement.style.scrollBehavior = '';
        };
    }, [prevScrollPos]);

    const headerClasses = `sticky top-0 align-center z-50 bg-gradient-to-r from-blue-900 to-blue-800 shadow-sm py-4 px-8 transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
    }`;

    return (
        <header className={headerClasses}>
            <div className="container mx-auto">
                <div className="md:flex">
                    <div className="flex items-center justify-center px-4 py-2 md:justify-start">
                        <Image
                            src="/favicon.ico"
                            alt="WiseExplorer Logo"
                            width={32}
                            height={32}
                            className="mr-3"
                        />
                        <Link
                            href={baseUrl}
                            className="text-2xl font-bold text-white"
                        >
                            WiseExplorer
                        </Link>
                    </div>

                    <div className="ml-auto flex items-center justify-center space-x-6 text-lg">
                        <a
                            href={baseUrl}
                            hidden={onlyLogo}
                            className="text-white hover:text-orange-500 transition-colors"
                        >
                            Home
                        </a>
                        <a
                            hidden={onlyLogo}
                            href="#features"
                            className="text-white hover:text-orange-500 transition-colors"
                        >
                            Features
                        </a>
                        <a
                            hidden={onlyLogo}
                            href="#technology"
                            className="text-white hover:text-orange-500 transition-colors"
                        >
                            Technology
                        </a>
                        <a
                            hidden={onlyLogo}
                            href={mapUrl}
                            className="text-white hover:text-orange-500 transition-colors"
                        >
                            Map
                        </a>
                        <a
                            hidden={!onlyLogo}
                            href={baseUrl}
                            className="px-4 py-2 text-center bg-orange-500 hover:bg-orange-600 transition-colors text-white font-medium rounded-lg"
                        >
                            Back to home
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
}
