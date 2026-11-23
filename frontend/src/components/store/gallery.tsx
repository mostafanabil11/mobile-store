"use client";

import { useState } from "react";
import { cn } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductMedia } from "./product-media";

export function Gallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const count = Math.max(1, product.images.length);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-[32px] bg-bg-soft">
        <div key={index} className="fade absolute inset-10 bg-bg-soft sm:inset-14">
          <ProductMedia product={product} index={index} sizes="(max-width: 1024px) 100vw, 55vw" eager={index === 0} iconSize={44} />
        </div>
      </div>
      {count > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto">
          {product.images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-bg-soft ring-2 transition",
                i === index ? "ring-ink" : "ring-transparent hover:ring-line",
              )}
            >
              <div className="absolute inset-2">
                <ProductMedia product={product} index={i} sizes="80px" iconSize={18} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
