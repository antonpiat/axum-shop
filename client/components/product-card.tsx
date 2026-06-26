import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolveImageUrl } from "@/lib/images";
import type { Product } from "@/lib/types";
import { formatPrice, stockLabel, stockVariant } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = resolveImageUrl(product.image_url);
  const stock = stockLabel(product.stock);

  return (
    <Link href={`/products/${product.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-all duration-200 group-hover:border-emerald-500/40 group-hover:shadow-emerald-500/5">
        <div className="relative aspect-square overflow-hidden bg-zinc-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-600">
              No image
            </div>
          )}
          <div className="absolute right-2 top-2">
            <Badge variant={stockVariant(product.stock)}>{stock}</Badge>
          </div>
        </div>
        <CardContent className="space-y-2">
          <h3 className="line-clamp-1 font-semibold text-zinc-100 group-hover:text-emerald-400">
            {product.name}
          </h3>
          {product.description && (
            <p className="line-clamp-2 text-sm text-zinc-500">{product.description}</p>
          )}
          <p className="text-lg font-bold text-emerald-400">{formatPrice(product.price)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
