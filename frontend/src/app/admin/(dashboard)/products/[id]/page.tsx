import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";

export default function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <Editor params={props.params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductForm key={id} id={id} />;
}
