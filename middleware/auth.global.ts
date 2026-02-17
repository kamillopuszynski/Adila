export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const publicPages = ["/login"];
  if (!user.value && !publicPages.includes(to.path)) return navigateTo("/login");
  if (!user.value) return;

  // Allow onboarding without profile
  if (to.path === "/onboarding") return;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.value.id)
    .maybeSingle();

  // If table is missing / RLS blocks / any error, don’t hard-crash SSR
  if (error) return;

  if (!profile) return navigateTo("/onboarding");
});
