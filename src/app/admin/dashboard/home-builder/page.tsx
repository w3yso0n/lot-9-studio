import Link from "next/link";
import { HomeBuilderForm } from "@/components/admin/HomeBuilderForm";
import { Button } from "@/components/ui/button";
import { getHomeSectionsForAdmin } from "@/lib/home-sections-repo";
import { getHomeSettingsForAdmin } from "@/lib/home-settings-repo";

export default async function AdminHomeBuilderPage() {
  const [sections, homeSettings] = await Promise.all([
    getHomeSectionsForAdmin(),
    getHomeSettingsForAdmin(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Constructor Home
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Agrega, ordena y activa bloques del home. Guarda los cambios para aplicar el orden en la
            tienda.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-none">
            <Link href="/">Ver home</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-none">
            <Link href="/admin/dashboard">Volver al catálogo</Link>
          </Button>
        </div>
      </div>

      <HomeBuilderForm initialSections={sections} homeSettings={homeSettings} />
    </div>
  );
}
