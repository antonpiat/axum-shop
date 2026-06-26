"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError, getCategory, getProduct } from "@/lib/api";
import { resolveImageUrl } from "@/lib/images";
import type { Category, Product } from "@/lib/types";
import { formatPrice, stockLabel, stockVariant } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;

    let cancelled = false;
    (async () => {
      try {
        const p = await getProduct(id);
        if (cancelled) return;
        if (!p) {
          setError("Product not found");
          return;
        }
        setProduct(p);
        if (p.category_id) {
          const cat = await getCategory(p.category_id);
          if (!cancelled) setCategory(cat);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load product");
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id || Number.isNaN(id)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Alert variant="error" className="mb-6">
          Invalid product ID
        </Alert>
        <Link href="/">
          <Button variant="secondary">Back to shop</Button>
        </Link>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Alert variant="error" className="mb-6">
          {error ?? "Product not found"}
        </Alert>
        <Link href="/">
          <Button variant="secondary">Back to shop</Button>
        </Link>
      </div>
    );
  }

  const imageUrl = resolveImageUrl(product.image_url);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/" className="mb-6 inline-block text-sm text-zinc-500 hover:text-emerald-400">
        ← Back to shop
      </Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="relative aspect-square bg-zinc-800">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-600">
                No image available
              </div>
            )}
          </div>
        </Card>
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant={stockVariant(product.stock)}>{stockLabel(product.stock)}</Badge>
              {category && <Badge>{category.name}</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-zinc-100">{product.name}</h1>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {formatPrice(product.price)}
            </p>
          </div>
          {product.description && (
            <Card>
              <CardContent>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Description
                </h2>
                <p className="leading-relaxed text-zinc-300">{product.description}</p>
              </CardContent>
            </Card>
          )}
          <div className="text-sm text-zinc-500">
            <p>Stock: {product.stock} units</p>
            {product.createdAt && (
              <p>Added: {new Date(product.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
