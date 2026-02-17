export default defineNuxtRouteMiddleware(async (to) => {
  // Cloudflare SSR safety
  if (process.server) return;

  // Don't run auth guard on public routes (prevents pointless calls + avoids crashes on /login)
  const publicPages = ["/login"];
  if (publicPages.includes(to.path)) return;

  const supabase = useSupabaseClient();

  // Extra safety (if module not initialized for some reason)
  if (!supabase?.auth) return navigateTo("/login");

  const { data, error } = await supabase.auth.getSession();
  const session = data?.session;

  if (!session) return navigateTo("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile && to.path !== "/onboarding") return navigateTo("/onboarding");
});
