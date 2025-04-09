// 'use client';

import MapPage from '@/src/components/MapPage/MapPage';

// This function tells Next.js which locales to pre-render at build time
export function generateStaticParams() {
  // Add all locales your app supports
  return [
    { locale: 'en' },
    { locale: 'es' },
    { locale: 'de' },
    { locale: 'fr' }
    // Add any other locales you support
  ];
}

export default function Page() {
    return <MapPage />;
}