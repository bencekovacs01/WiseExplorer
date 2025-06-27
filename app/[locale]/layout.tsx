import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

import { Open_Sans } from 'next/font/google';

import CommonIntlProvider from '@/src/utils/CommonIntlProvider';

const openSans = Open_Sans({
    subsets: ['latin'],
});

type Props = {
    children: ReactNode;
    params: Promise<{ locale: string }>;
};

async function getMessages(locale: string) {
    try {
        return (await import(`../../src/locales/${locale}.json`)).default;
    } catch (error) {
        notFound();
    }

    return {};
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;
    const messages = await getMessages(locale);

    return (
        <html className={`h-full ${openSans.className}`} lang={locale}>
            <head>
                <title>WiseExplorer</title>
                <meta name="description" content={'CONTENT'} />
            </head>
            <body className={'flex min-h-full flex-col'}>
                <CommonIntlProvider locale={locale} defaultMessages={messages}>
                    {children}
                </CommonIntlProvider>
            </body>
        </html>
    );
}
