import Link from "next/link";
import { HomeSettingsForm } from "@/components/admin/HomeSettingsForm";
import { Button } from "@/components/ui/button";
import { getHomeSettingsForAdmin } from "@/lib/home-settings-repo";

export default async function AdminHomeSettingsPage() {
  const settings = await getHomeSettingsForAdmin();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Configuración Home
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Edita portada, textos y video destacado sin tocar el código.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">Volver al catálogo</Link>
        </Button>
      </div>

      <HomeSettingsForm initial={settings} />
    </div>
  );
}
