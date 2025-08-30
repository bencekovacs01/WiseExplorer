import Header from '@/src/components/Header/Header';
import MapPage from '@/src/components/MapPage/MapPage';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'hu' }, { locale: 'ro' }];
}

export default function Page() {
  return (
    <>
      <Header onlyLogo />
      <MapPage />
    </>
  );
}
