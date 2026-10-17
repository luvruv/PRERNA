import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'Prerna Store - Fresh Groceries Delivered in 10 Minutes',
  description: 'Blinkit-style quick-commerce grocery platform with fresh fruits, vegetables, dairy, and daily essentials delivered directly to your doorstep.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FDF1E6] text-[#2D1B0D] flex flex-col min-h-screen">
        <QueryProvider>
          <Navbar />
          <main className="flex-1 pb-20 md:pb-10">
            {children}
          </main>
          <BottomNav />
          <footer className="hidden md:block bg-[#2D1B0D] text-[#FDF1E6] py-10 mt-auto border-t border-[#F0DEC8]">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D9700F] flex items-center justify-center text-white font-black">
                    P
                  </div>
                  <span className="text-xl font-black text-white">
                    Prerna<span className="text-[#D9700F]">Store</span>
                  </span>
                </div>
                <p className="text-xs text-[#C79A70] leading-relaxed">
                  Everyday essentials, fresh fruits, veggies, dairy and staples delivered in 10 minutes from verified neighborhood stores.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-xs">Categories</h4>
                <ul className="space-y-1.5 text-xs text-[#C79A70]">
                  <li>Fresh Fruits & Vegetables</li>
                  <li>Dairy, Bread & Eggs</li>
                  <li>Atta, Rice & Dal</li>
                  <li>Snacks & Beverages</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-xs">Portals</h4>
                <ul className="space-y-1.5 text-xs text-[#C79A70]">
                  <li><a href="/shopkeeper" className="hover:text-[#D9700F]">Merchant / Shopkeeper Dashboard</a></li>
                  <li><a href="/delivery" className="hover:text-[#D9700F]">Delivery Partner Rider App</a></li>
                  <li><a href="/admin" className="hover:text-[#D9700F]">Platform Admin Control</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-xs">Guarantees</h4>
                <div className="space-y-2 text-xs text-[#C79A70]">
                  <p>⚡ 10-Minute Superfast Delivery</p>
                  <p>🌱 100% Farm Fresh & Sealed</p>
                  <p>💳 Cash on Delivery & Test Payments</p>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 mt-8 pt-4 border-t border-white/10 text-center text-xs text-[#8C6D53]">
              © 2026 Prerna Store V1. Built for quick-commerce efficiency.
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
