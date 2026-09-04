import { createClient, type User } from "@supabase/supabase-js";

export type VerifiedAdmin = { id: string; email: string };

function serverSupabaseConfig() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Account verification is not configured.");
  return { url, key };
}

function allowedAdminEmails() {
  const configured = process.env["ADMIN_EMAILS"] ?? "h.g4972@gmail.com,isurilab@gmail.com";
  return new Set(
    configured
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function verifiedEmail(user: User) {
  const email = user.email?.trim().toLowerCase();
  if (!email || !user.email_confirmed_at)
    throw new Error("A verified administrator email is required.");
  return email;
}

export async function requireAdmin(accessToken: string): Promise<VerifiedAdmin> {
  if (!accessToken || accessToken.length > 4096) throw new Error("Administrator sign-in required.");
  const { url, key } = serverSupabaseConfig();
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Administrator session is no longer valid.");

  const email = verifiedEmail(data.user);
  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);
  if (roleError) throw new Error("Administrator role could not be verified.");
  const isAdmin = roles?.some((item) => item.role === "admin") || allowedAdminEmails().has(email);
  if (!isAdmin) throw new Error("Administrator access required.");
  return { id: data.user.id, email };
}
