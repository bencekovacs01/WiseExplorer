'use client';

import { ReactNode } from 'react';

import './globals.css';

type Props = {
    children: ReactNode;
};

// Even though this component is just passing its children through, the presence
// of this file fixes an issue in Next.js 13.4 where link clicks that switch
// the locale would otherwise cause a full reload.
export default function RootLayout({ children }: Props) {
    return children;
}
