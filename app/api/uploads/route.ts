import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const draftToken = String(formData.get("draftToken") || "");
    const target = String(formData.get("target") || "moment");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Imagem não enviada." }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]{20,80}$/.test(draftToken)) {
      return NextResponse.json({ error: "Token de rascunho inválido." }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Use JPG, PNG ou WebP." }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ error: "Use uma imagem com até 8 MB." }, { status: 400 });
    }

    const extension = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
    const safeTarget = target === "main" || target === "best" ? target : "moment";
    const path = `drafts/${draftToken}/${safeTarget}/${crypto.randomUUID()}.${extension}`;
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.storage.from("gift-images").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = await supabase.storage.from("gift-images").createSignedUrl(path, 60 * 60);

    return NextResponse.json({ path, signedUrl: data?.signedUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível enviar a imagem." },
      { status: 500 }
    );
  }
}
