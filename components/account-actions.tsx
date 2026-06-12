"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AccountActions() {
  const supabase = createSupabaseBrowserClient();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <Button variant="secondary" onClick={signOut}>
      <LogOut className="h-5 w-5" />
      Sair
    </Button>
  );
}
