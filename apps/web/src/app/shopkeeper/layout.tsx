'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, ClipboardList, Package, Store, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';

const sections = [
  {
    label: 'Overview',
    description: 'Sales and orders',
    href: '/shopkeeper',
    icon: LayoutDashboard,
  },
  {
    label: 'Products',
    description: 'Catalog and prices',
    href: '/shopkeeper/products',
    icon: Package,
  },
  {
    label: 'Orders',
    description: 'Incoming and past orders',
    href: '/shopkeeper/orders',
    icon: ClipboardList,
  },
  {
    label: 'Inventory',
    description: 'Stock quantities',
    href: '/shopkeeper/inventory',
    icon: Boxes,
  },
  {
    label: 'Store settings',
    description: 'Location and details',
    href: '/shopkeeper/store',
    icon: Store,
  },
];

export default function ShopkeeperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  if (user?.role !== 'SHOPKEEPER') {
    return children;
  }

  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 px-4 pb-6 pt-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
      <nav
        aria-label="Merchant portal"
        className="flex gap-2 overflow-x-auto lg:block lg:space-y-2"
      >
        <div className="hidden rounded-3xl border border-[#F0DEC8] bg-white p-4 shadow-card lg:mb-4 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D9700F] text-white">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A66C3E]">Merchant portal</p>
              <p className="truncate text-sm font-black text-[#6B3A0A]">My Store</p>
            </div>
          </div>
        </div>
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = pathname === section.href
            || (section.href !== '/shopkeeper' && pathname.startsWith(`${section.href}/`));

          return (
            <Link
              key={section.href}
              href={section.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-2.5 transition-colors lg:w-full ${
                isActive
                  ? 'border-[#D9700F] bg-[#D9700F] text-white shadow-sm'
                  : 'border-[#F0DEC8] bg-white text-[#6B3A0A] hover:border-[#D9700F] hover:bg-[#FFF8F0]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-bold">{section.label}</span>
              <span className={`hidden text-[10px] lg:inline ${isActive ? 'text-white/80' : 'text-[#8C6D53]'}`}>
                {section.description}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}