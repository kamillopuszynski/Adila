<template>
  <div style="max-width:900px;margin:40px auto;padding:16px;">
    <h2>Loading…</h2>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabase();

const { data } = await supabase.auth.getSession();
const user = data.session?.user;
if (!user) navigateTo("/login");

const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user!.id)
  .maybeSingle();

if (profile?.role === "teacher") navigateTo("/teacher");
else navigateTo("/student");
</script>
