'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Edit2, Trash2, X, Store } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  mrp: z.coerce.number().positive('MRP must be greater than 0'),
  unit: z.string().min(1, 'Unit is required (e.g. 1 kg, 500g, 1L)'),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  initialStock: z.coerce.number().min(0, 'Initial stock cannot be negative').default(20),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ShopkeeperProductsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, loadProfile } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const { data: products = [], refetch, isLoading } = useQuery({
    queryKey: ['shopkeeper-products'],
    queryFn: () => api.get('/shopkeeper/products'),
    enabled: isAuthenticated && user?.role === 'SHOPKEEPER',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      initialStock: 20,
    },
  });

  if (isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-10 w-48 bg-[#FAF3EB] rounded-2xl" />
        <div className="h-40 bg-[#FAF3EB] rounded-3xl" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'SHOPKEEPER') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center">
        <h2 className="text-xl font-bold text-[#6B3A0A] mb-2">Access Denied</h2>
        <Link href="/login" className="px-5 py-2.5 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await api.put(`/shopkeeper/products/${editingProduct.id}`, data);
      } else {
        await api.post('/shopkeeper/products', data);
      }
      setShowModal(false);
      setEditingProduct(null);
      reset();
      refetch();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await api.delete(`/shopkeeper/products/${id}`);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate product');
    }
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      mrp: product.mrp,
      unit: product.unit,
      description: product.description || '',
      imageUrl: product.images?.[0]?.url || '',
      initialStock: product.inventory?.availableQty || 0,
    });
    setShowModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Link
        href="/shopkeeper"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F]"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#6B3A0A]">Store Product Catalog</h1>
          <p className="text-xs text-[#8C6D53]">Manage items sold by your store with live stock</p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            reset({ initialStock: 20 });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-[#D9700F] text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary-hover transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl h-52 border border-[#F0DEC8]" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF3EB] text-[#6B3A0A] border-b border-[#F0DEC8] font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E3CF]/40 text-[#2D1B0D]">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#FAF3EB]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FDF1E6] overflow-hidden shrink-0 border border-[#F0DEC8]">
                          <img
                            src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-[#6B3A0A]">{p.name}</div>
                          <div className="text-[10px] text-[#8C6D53]">{p.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#8C6D53]">
                      {p.category?.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#6B3A0A]">₹{p.price}</span>
                      {p.mrp > p.price && (
                        <span className="text-[10px] text-[#A66C3E] line-through ml-1.5">
                          ₹{p.mrp}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded-full ${
                          (p.inventory?.availableQty || 0) <= 10
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {p.inventory?.availableQty ?? 0} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-[#D9700F] hover:bg-[#FFF2E5] p-1.5 rounded-lg font-bold"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                        title="Deactivate product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* React Hook Form + Zod Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[#F0DEC8] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F7E3CF]/50 pb-3">
              <h3 className="font-black text-lg text-[#6B3A0A]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">Product Name</label>
                <input
                  {...register('name')}
                  placeholder="e.g. Royal Fresh Gala Apples"
                  className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl focus:outline-none focus:border-[#D9700F]"
                />
                {errors.name && <p className="text-red-600 text-[10px] mt-0.5">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">Category</label>
                <select
                  {...register('categoryId')}
                  className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl focus:outline-none focus:border-[#D9700F]"
                >
                  <option value="">Select Category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-600 text-[10px] mt-0.5">{errors.categoryId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price')}
                    className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl focus:outline-none focus:border-[#D9700F]"
                  />
                  {errors.price && <p className="text-red-600 text-[10px] mt-0.5">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('mrp')}
                    className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl focus:outline-none focus:border-[#D9700F]"
                  />
                  {errors.mrp && <p className="text-red-600 text-[10px] mt-0.5">{errors.mrp.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">Pack Size / Unit</label>
                  <input
                    {...register('unit')}
                    placeholder="e.g. 1 kg, 500 g, 1 Litre"
                    className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl focus:outline-none focus:border-[#D9700F]"
                  />
                  {errors.unit && <p className="text-red-600 text-[10px] mt-0.5">{errors.unit.message}</p>}
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block font-bold text-[#6B3A0A] mb-1">Opening Stock</label>
                    <input
                      type="number"
                      {...register('initialStock')}
                      className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl focus:outline-none focus:border-[#D9700F]"
                    />
                    {errors.initialStock && <p className="text-red-600 text-[10px] mt-0.5">{errors.initialStock.message}</p>}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">Image URL</label>
                <input
                  {...register('imageUrl')}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl focus:outline-none focus:border-[#D9700F]"
                />
                {errors.imageUrl && <p className="text-red-600 text-[10px] mt-0.5">{errors.imageUrl.message}</p>}
              </div>

              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">Description</label>
                <textarea
                  rows={2}
                  {...register('description')}
                  className="w-full p-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl focus:outline-none focus:border-[#D9700F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F7E3CF]/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#F0DEC8] text-[#8C6D53] rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#D9700F] text-white rounded-xl font-bold shadow-sm hover:bg-primary-hover transition-all"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
