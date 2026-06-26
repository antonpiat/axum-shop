"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import {
  ApiError,
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
  uploadImage,
} from "@/lib/api";
import { resolveImageUrl } from "@/lib/images";
import type { Category, Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category_id: string;
  stock: string;
  image_url: string;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  stock: "0",
  image_url: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [productData, categoryData] = await Promise.all([
        getProducts({ pageSize: 100 }),
        getCategories(),
      ]);
      setProducts(productData.items);
      setCategories(categoryData);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          getProducts({ pageSize: 100 }),
          getCategories(),
        ]);
        if (!cancelled) {
          setProducts(productData.items);
          setCategories(categoryData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load products");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      category_id: product.category_id != null ? String(product.category_id) : "",
      stock: String(product.stock),
      image_url: product.image_url ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadImage(file);
      setForm((f) => ({ ...f, image_url: result.url }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      category_id: form.category_id ? Number(form.category_id) : null,
      stock: Number(form.stock) || 0,
      image_url: form.image_url || null,
    };
    try {
      if (editingId != null) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Products</h1>
          <p className="text-sm text-zinc-500">Manage catalog inventory</p>
        </div>
        <Button onClick={openCreate}>Add product</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : products.length === 0 ? (
            <p className="py-12 text-center text-zinc-500">No products yet</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const img = resolveImageUrl(product.image_url);
                  return (
                    <tr key={product.id} className="border-b border-zinc-800/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-800">
                            {img ? (
                              <Image
                                src={img}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : null}
                          </div>
                          <span className="font-medium text-zinc-100">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-emerald-400">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-5 py-3 text-zinc-300">{product.stock}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(product)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => product.id != null && handleDelete(product.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="text-lg font-semibold text-zinc-100">
                {editingId != null ? "Edit product" : "New product"}
              </h2>
            </div>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                  <Input
                    label="Stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">Category</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id ?? ""}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-300">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:text-zinc-200"
                  />
                  {uploading && <Spinner className="h-4 w-4" />}
                  {form.image_url && (
                    <p className="truncate text-xs text-zinc-500">{form.image_url}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={submitting || uploading}>
                    {submitting ? <Spinner /> : "Save"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeModal}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
