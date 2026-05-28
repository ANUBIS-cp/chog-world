import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(url, anonKey);

export const getServiceClient = () => createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
