import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { MiniCartProvider } from '@/contexts/MiniCartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { SessionProvider } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import MiniCart from '@/components/MiniCart';
import { auth } from '@/lib/auth';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'NovaMart — Shop Everything',
    template: '%s | NovaMart',
  },
  description: 'NovaMart — Premium online shopping for electronics, fashion, home goods, books, sports, and beauty. Fast shipping, secure checkout, and amazing deals every day.',
  keywords: ['online shopping', 'ecommerce', 'electronics', 'fashion', 'deals'],
  authors: [{ name: 'NovaMart' }],
  openGraph: {
    type: 'website',
    siteName: 'NovaMart',
    title: 'NovaMart — Shop Everything',
    description: 'Premium online shopping with amazing deals.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1C1917',
};

export default async function RootLayout({ children }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <CartProvider>
            <MiniCartProvider>
              <WishlistProvider>
                <Toast>
                  <Navbar />
                  <main className="page-wrapper">
                    {children}
                  </main>
                  <Footer />
                  <MiniCart />
                </Toast>
              </WishlistProvider>
            </MiniCartProvider>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
