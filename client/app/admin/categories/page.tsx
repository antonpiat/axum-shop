"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/api";
import type { Category } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCategories();
        if (!cancelled) {
          setCategories(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load categories");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description ?? "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editingId != null) {
        await updateCategory(editingId, {
          name: name.trim(),
          description: description.trim() || null,
        });
      } else {
        await createCategory({
          name: name.trim(),
          description: description.trim() || null,
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Categories</h1>
        <p className="text-sm text-zinc-500">Manage product categories</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-100">
            {editingId != null ? "Edit category" : "New category"}
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? <Spinner /> : editingId != null ? "Update" : "Create"}
              </Button>
              {editingId != null && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : categories.length === 0 ? (
            <p className="py-12 text-center text-zinc-500">No categories yet</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-zinc-800/50">
                    <td className="px-5 py-3 font-medium text-zinc-100">{cat.name}</td>
                    <td className="px-5 py-3 text-zinc-400">{cat.description ?? "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(cat)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => cat.id != null && handleDelete(cat.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
