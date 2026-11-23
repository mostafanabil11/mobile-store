import Image from "next/image";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/format";
import { Placeholder } from "./placeholder";

interface Props {
  product: Pick<Product, "name" | "images">;
  index?: number;
  className?: string;
  sizes?: string;
  /** Above-the-fold image: load immediately with high priority. */
  eager?: boolean;
  iconSize?: number;
}

/** A product photo when one exists, otherwise a neutral placeholder. */
export function ProductMedia({ product, index = 0, className, sizes = "(max-width: 768px) 100vw, 33vw", eager, iconSize }: Props) {
  const src = product.images[index];
  if (src) {
    return (
      <Image
        src={src}
        alt={product.name}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        unoptimized
        className={cn("object-contain mix-blend-multiply", className)}
      />
    );
  }
  return <Placeholder className={cn("absolute inset-0 rounded-2xl", className)} iconSize={iconSize} />;
}
