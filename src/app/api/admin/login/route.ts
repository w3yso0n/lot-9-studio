import { setAdminSession } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { password?: string };
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD no está configurada en el servidor." },
        { status: 500 }
      );
    }
    if (body.password !== expected) {
      return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
    }
    await setAdminSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
