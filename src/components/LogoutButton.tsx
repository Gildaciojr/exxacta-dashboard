"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut(); // encerra sessão
    router.push("/login");         // envia para login
  }

  return (
    <button
      onClick={handleLogout}
      className="
        flex items-center gap-2 px-4 py-2 rounded-xl 
        bg-red-600 text-white font-semibold text-sm
        hover:bg-red-700 hover:scale-[1.02] transition
        shadow-sm hover:shadow-lg
      "
    >
      <LogOut size={18} /> Sair
    </button>
  );
}
