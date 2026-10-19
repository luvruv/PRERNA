'use client';

import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Package,
  Store,
  CreditCard,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface DatabaseTablesExplorerProps {
  products: any[];
  stores: any[];
  orders: any[];
  users: any[];
}

export default function DatabaseTablesExplorer({
  products = [],
  stores = [],
  orders = [],
  users = [],
}: DatabaseTablesExplorerProps) {
  const [currentTable, setCurrentTable] = useState<'PRODUCTS' | 'STORES' | 'ORDERS' | 'USERS'>('PRODUCTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW_STOCK' | 'IN_STOCK'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
      else if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const cat = (p.categoryName || p.category?.name || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || sku.includes(query) || cat.includes(query);
      const matchesCategory =
        selectedCategory === 'ALL' || (p.categoryName || p.category?.name) === selectedCategory;

      const qty = p.availableQty ?? p.inventory?.availableQty ?? 0;
      const isLow = qty <= (p.lowStockThreshold || 10);
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'LOW_STOCK' && isLow) ||
        (stockFilter === 'IN_STOCK' && !isLow);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  // Pagination for products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Export functions
  const handleExportJSON = () => {
    let dataToExport: any = products;
    let filename = 'products_dataset.json';

    if (currentTable === 'STORES') {
      dataToExport = stores;
      filename = 'stores_dataset.json';
    } else if (currentTable === 'ORDERS') {
      dataToExport = orders;
      filename = 'orders_dataset.json';
    } else if (currentTable === 'USERS') {
      dataToExport = users;
      filename = 'users_dataset.json';
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'MRP', 'Stock Quantity', 'Store'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      `"${p.categoryName || p.category?.name || ''}"`,
      p.price,
      p.mrp,
      p.availableQty ?? p.inventory?.availableQty ?? 0,
      `"${p.storeName || p.store?.name || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_inventory_dataset.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Controls & Table Selection Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F7E3CF]/50 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#D9700F] uppercase tracking-wider">
              <Database className="w-4 h-4" />
              <span>Central Database & Dataset Explorer</span>
            </div>
            <h2 className="text-xl font-black text-[#6B3A0A] tracking-tight mt-0.5">
              Live Schema Tables & Stock Quantities
            </h2>
            <p className="text-xs text-[#8C6D53] mt-0.5">
              Visual table explorer for 208 products, inventory ledger, store locations, and orders dataset
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Download entire dataset as CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 bg-[#FAF3EB] hover:bg-orange-100 text-[#6B3A0A] border border-[#F0DEC8] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Download JSON Dataset file"
            >
              <Download className="w-3.5 h-3.5 text-[#D9700F]" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Table Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => {
              setCurrentTable('PRODUCTS');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
              currentTable === 'PRODUCTS'
                ? 'bg-[#D9700F] text-white shadow-md'
                : 'bg-[#FAF3EB] text-[#6B3A0A] hover:bg-orange-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products & Inventory ({products.length})</span>
          </button>

          <button
            onClick={() => {
              setCurrentTable('STORES');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
              currentTable === 'STORES'
                ? 'bg-[#D9700F] text-white shadow-md'
                : 'bg-[#FAF3EB] text-[#6B3A0A] hover:bg-orange-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Stores ({stores.length})</span>
          </button>

          <button
            onClick={() => {
              setCurrentTable('ORDERS');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
              currentTable === 'ORDERS'
                ? 'bg-[#D9700F] text-white shadow-md'
                : 'bg-[#FAF3EB] text-[#6B3A0A] hover:bg-orange-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Orders & Payments ({orders.length})</span>
          </button>

          <button
            onClick={() => {
              setCurrentTable('USERS');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
              currentTable === 'USERS'
                ? 'bg-[#D9700F] text-white shadow-md'
                : 'bg-[#FAF3EB] text-[#6B3A0A] hover:bg-orange-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Roles ({users.length})</span>
          </button>
        </div>

        {/* Filters Bar for Products */}
        {currentTable === 'PRODUCTS' && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D53]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search products by name, SKU, or brand..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF3EB]/50 border border-[#F0DEC8] text-xs font-semibold text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF3EB]/50 border border-[#F0DEC8] text-xs font-semibold text-[#6B3A0A] focus:outline-none focus:border-[#D9700F]"
              >
                <option value="ALL">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF3EB]/50 border border-[#F0DEC8] text-xs font-semibold text-[#6B3A0A] focus:outline-none focus:border-[#D9700F]"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="IN_STOCK">Normal Stock (&gt; 10)</option>
                <option value="LOW_STOCK">⚠️ Low Stock Alerts (≤ 10)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 1. PRODUCTS & INVENTORY TABLE */}
      {currentTable === 'PRODUCTS' && (
        <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card overflow-hidden">
          <div className="p-4 bg-[#FAF3EB]/40 border-b border-[#F7E3CF]/60 flex items-center justify-between text-xs font-bold text-[#6B3A0A]">
            <span>
              Showing {filteredProducts.length} matching products in table ledger
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF3EB] text-[#6B3A0A] uppercase text-[10px] font-black border-b border-[#F7E3CF]">
                <tr>
                  <th className="py-3 px-4">Item #</th>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">Product Name & Unit</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4 font-black text-[#D9700F]">Quantity (Stock)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Store Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E3CF]/40">
                {paginatedProducts.map((p, idx) => {
                  const qty = p.availableQty ?? p.inventory?.availableQty ?? 0;
                  const threshold = p.lowStockThreshold || 10;
                  const isLow = qty <= threshold;
                  const isOut = qty === 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF3EB]/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#8C6D53]">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <img
                          src={p.imageUrl || p.images?.[0]?.url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-[#F0DEC8]"
                        />
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-[#2D1B0D] line-clamp-1">{p.name}</div>
                        <div className="text-[11px] text-[#8C6D53] font-medium">{p.unit}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-[#6B3A0A]">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-[#FAF3EB] text-[#8C6D53] rounded-lg text-[10px] font-bold">
                          {p.categoryName || p.category?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#2D1B0D]">
                        ₹{p.price}
                        {p.mrp && p.mrp > p.price && (
                          <span className="text-[10px] text-[#8C6D53] line-through ml-1.5 font-normal">
                            ₹{p.mrp}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${
                              isOut
                                ? 'bg-red-100 text-red-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isLow && !isOut && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            {isOut && <span className="w-2 h-2 rounded-full bg-red-600" />}
                            {!isLow && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            <span>{qty} units</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isOut
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#8C6D53] text-[11px]">
                        {p.storeName || p.store?.name || 'Sunrise Fresh Market'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-[#FAF3EB]/40 border-t border-[#F7E3CF]/60 flex items-center justify-between text-xs font-bold">
            <span className="text-[#8C6D53]">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} items
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-[#F0DEC8] bg-white text-[#6B3A0A] hover:bg-[#FAF3EB] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="px-3 py-1.5 bg-[#D9700F] text-white rounded-xl">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-[#F0DEC8] bg-white text-[#6B3A0A] hover:bg-[#FAF3EB] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. STORES TABLE */}
      {currentTable === 'STORES' && (
        <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF3EB] text-[#6B3A0A] uppercase text-[10px] font-black border-b border-[#F7E3CF]">
                <tr>
                  <th className="py-3 px-4">Store Name</th>
                  <th className="py-3 px-4">Address & City</th>
                  <th className="py-3 px-4">Coordinates (Lat, Lng)</th>
                  <th className="py-3 px-4">Delivery Radius</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Products Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E3CF]/40">
                {stores.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF3EB]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#6B3A0A]">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-[#8C6D53]">/{s.slug}</div>
                    </td>
                    <td className="py-3 px-4 text-[#2D1B0D] max-w-xs">{s.address}, {s.city}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#D9700F]">
                      {s.latitude?.toFixed(4)}°N, {s.longitude?.toFixed(4)}°E
                    </td>
                    <td className="py-3 px-4 font-bold text-[#6B3A0A]">
                      {s.deliveryRadiusKm || 10} km
                    </td>
                    <td className="py-3 px-4 text-[#8C6D53]">{s.phone}</td>
                    <td className="py-3 px-4 font-bold text-amber-700">★ {s.rating}</td>
                    <td className="py-3 px-4 font-bold text-[#2D1B0D]">{s.totalProducts || s._count?.products || 70} products</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ORDERS & PAYMENTS TABLE */}
      {currentTable === 'ORDERS' && (
        <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF3EB] text-[#6B3A0A] uppercase text-[10px] font-black border-b border-[#F7E3CF]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment Transaction</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Rider Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E3CF]/40">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF3EB]/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#D9700F]">{o.orderNumber}</td>
                    <td className="py-3 px-4 text-[#8C6D53] text-[11px]">
                      {new Date(o.createdAt || o.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2D1B0D]">{o.customer?.name}</div>
                      <div className="text-[10px] text-[#8C6D53]">{o.customer?.phone}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-[11px] text-[#6B3A0A]">
                      {o.items?.map((it: any) => `${it.product?.name || it.name} (x${it.quantity})`).join(', ') || 'Groceries'}
                    </td>
                    <td className="py-3 px-4 font-black text-[#2D1B0D]">₹{o.total}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-[10px] font-bold text-[#6B3A0A]">
                        {o.payment?.transactionId || 'TXN_TEST_9981'}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        COMPLETED ({o.payment?.method || 'TEST_PAYMENT'})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-amber-50 text-[#D9700F] rounded-lg text-[10px] font-bold uppercase">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#8C6D53]">
                      {o.deliveryAssignment?.riderName || o.deliveryAssignment?.deliveryPartner?.user?.name || 'Rider Assigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. USERS & ROLES TABLE */}
      {currentTable === 'USERS' && (
        <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF3EB] text-[#6B3A0A] uppercase text-[10px] font-black border-b border-[#F7E3CF]">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Platform Role</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E3CF]/40">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF3EB]/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#8C6D53]">{u.id}</td>
                    <td className="py-3 px-4 font-bold text-[#2D1B0D]">{u.name}</td>
                    <td className="py-3 px-4 text-[#6B3A0A]">{u.email}</td>
                    <td className="py-3 px-4 text-[#8C6D53]">{u.phone}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-orange-100 text-[#D9700F] rounded-lg text-[10px] font-black uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
