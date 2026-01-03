import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 🚫 Garante que nunca será importado no client/browser
if (typeof window !== "undefined") {
  throw new Error("❌ supabaseAdmin só pode ser usado no servidor");
}


if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não está definida no .env.local");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY não está definida no .env.local");
}

// Cliente ADMIN: usar APENAS em código server-side (API routes, server actions, n8n, etc.)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});
