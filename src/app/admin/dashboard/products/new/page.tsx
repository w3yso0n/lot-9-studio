import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6 space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/admin/dashboard">
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Volver a la administración
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo producto</h1>
      </div>
      <ProductEditorForm showLivePreview />
    </div>
  );
}
