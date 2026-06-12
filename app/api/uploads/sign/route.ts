import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { pageId, paths } = (await request.json()) as {
      pageId?: string;
      paths?: string[];
    };

    if (!pageId || !Array.isArray(paths)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    }

    const { data: page } = await supabase
      .from("love_pages")
      .select("id")
      .eq("id", pageId)
      .single();

    if (!page) {
      return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });
    }

    const safePaths = paths.filter((path) => typeof path === "string" && path.length > 0).slice(0, 40);
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from("gift-images").createSignedUrls(safePaths, 60 * 60);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ urls: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível assinar as imagens." },
      { status: 500 }
    );
  }
}
