import { NextResponse } from "next/server";
import { confirmStripeCheckoutSession } from "@/lib/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { sessionId, password } = (await request.json()) as {
      sessionId?: string;
      password?: string;
    };

    if (!sessionId || !password || password.length < 6) {
      return NextResponse.json({ error: "Informe uma senha com pelo menos 6 caracteres." }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email || session.customer_email;

    if (session.mode !== "payment" || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Pagamento ainda não confirmado pela Stripe." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "A Stripe não retornou um email para esta compra." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError || !createdUser.user) {
      return NextResponse.json(
        {
          error:
            createError?.message === "A user with this email address has already been registered"
              ? "Este email já tem conta. Entre com esse email para assumir a página."
              : createError?.message || "Não foi possível criar a conta.",
          needsLogin: createError?.message === "A user with this email address has already been registered"
        },
        { status: 400 }
      );
    }

    const result = await confirmStripeCheckoutSession(sessionId, createdUser.user.id, email);

    return NextResponse.json({
      email,
      lovePageId: result.lovePageId
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível criar a conta." },
      { status: 500 }
    );
  }
}
