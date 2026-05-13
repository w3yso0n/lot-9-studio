import { verifyAdminSession } from "@/lib/admin-session";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await verifyAdminSession())) {
    redirect("/admin/login");
  }
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="w-full max-w-[min(100%,1400px)] mx-auto px-4 sm:px-6 py-8">{children}</div>
    </div>
  );
}
