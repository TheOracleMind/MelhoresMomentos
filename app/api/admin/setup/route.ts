import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit(`admin-setup:${ip}`, 3, 3600);
    if (!allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde um momento e tente novamente." }, { status: 429 });
    }

    const { email, password } = (await request.json()) as { email?: string; password?: string };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password || password.length < 8) {
      return NextResponse.json({ error: "Informe um email válido e uma senha com pelo menos 8 caracteres." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { count } = await admin.from("admin_users").select("user_id", { count: "exact", head: true });
    if (count && count > 0) {
      return NextResponse.json({ error: "A conta de administrador já foi criada." }, { status: 403 });
    }

    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true
    });

    if (createError || !createdUser.user) {
      return NextResponse.json({ error: createError?.message || "Não foi possível criar a conta." }, { status: 400 });
    }

    const { error: insertError } = await admin.from("admin_users").insert({
      singleton_key: true,
      user_id: createdUser.user.id,
      email: normalizedEmail
    });

    if (insertError) {
      await admin.auth.admin.deleteUser(createdUser.user.id);
      return NextResponse.json({ error: "A conta de administrador já foi criada." }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível criar o administrador." },
      { status: 500 }
    );
  }
}
