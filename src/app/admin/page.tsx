import { verifyAdminSession } from "@/lib/admin-session";
import { redirect } from "next/navigation";

export default async function AdminIndexPage() {
  if (await verifyAdminSession()) {
    redirect("/admin/dashboard");
  }
  redirect("/admin/login");
}
