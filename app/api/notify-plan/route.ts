import { getUser } from "@/lib/auth/get-user";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { plan } = await req.json();
  const venueName = user.user_metadata?.name ?? user.email ?? user.id;

  const planLabel = plan === "premium" ? "Premium (29€/mes)" : "Gratis";
  const subject = `Solicitud de cambio de plan — ${venueName}`;
  const html = `
    <h2>Solicitud de cambio de plan</h2>
    <p><strong>Local:</strong> ${venueName}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>ID:</strong> ${user.id}</p>
    <p><strong>Plan solicitado:</strong> ${planLabel}</p>
    <hr />
    <p style="color:#888;font-size:12px">Ozio · notificación automática</p>
  `;

  const { error } = await resend.emails.send({
    from: "Ozio <onboarding@resend.dev>",
    to: "javierrumo2@gmail.com",
    subject,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}