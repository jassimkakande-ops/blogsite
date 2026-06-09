"use client";

import { usePathname } from 'next/navigation';
import Header from '../app/components/Header';
import Footer from '@/components/Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Hide header and footer on player page
  const isPlayerPage = pathname === '/player';
  
  if (isPlayerPage) {
    return <>{children}</>;
  }
  
  return (
    <>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </>
  );
}
