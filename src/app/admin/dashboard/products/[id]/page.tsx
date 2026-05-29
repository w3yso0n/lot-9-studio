import { AdminProductEditorShell } from "@/components/admin/AdminProductEditorShell";
import { deleteProductAction } from "@/app/admin/dashboard/actions";
import { getAdminProductById, getProductBadges } from "@/lib/products-repo";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const [product, badges] = await Promise.all([
    getAdminProductById(id),
    getProductBadges(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Editar producto #{id}</h1>
        <form action={deleteProductAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="destructive" formNoValidate>
            Eliminar
          </Button>
        </form>
      </div>
      <AdminProductEditorShell
        initial={product}
        badges={badges}
        key={`${product.id}-${(product.colorVariants ?? []).length}-${product.images.join("~")}`}
      />
    </div>
  );
}
