import { clearAdminSession } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await clearAdminSession();
  const url = new URL("/admin/login", req.url);
  return NextResponse.redirect(url);
}
