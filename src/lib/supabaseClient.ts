import { createClient } from "@supabase/supabase-js";

// leitura segura das variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// criação do cliente para o frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
