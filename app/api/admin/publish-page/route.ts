import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { createPageFromDraft } from "@/lib/page-drafts";
import type { LovePageDraft } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 });
    }

    const { draft } = (await request.json()) as { draft?: LovePageDraft };
    if (!draft) {
      return NextResponse.json({ error: "Rascunho não enviado." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const page = await createPageFromDraft({
      draft,
      userId: adminUser.id,
      ownerEmail: adminUser.email || null,
      status: "active",
      paidAt: now,
      expiresAt: null
    });

    return NextResponse.json({ pageId: page.id, slug: page.slug, url: `/p/${page.slug}` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível publicar a página." },
      { status: 500 }
    );
  }
}
