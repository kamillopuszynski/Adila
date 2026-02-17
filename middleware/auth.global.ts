export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabase();
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  const publicPages = ["/login"];
  if (!session && !publicPages.includes(to.path)) return navigateTo("/login");
  if (!session) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile && to.path !== "/onboarding") return navigateTo("/onboarding");
});
