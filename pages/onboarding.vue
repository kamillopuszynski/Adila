<template>
  <div style="max-width:620px;margin:40px auto;padding:16px;">
    <h2>Setup your account</h2>

    <div style="display:grid;gap:10px;margin-top:14px;">
      <input v-model="fullName" placeholder="Your name (optional)" />

      <label style="opacity:.8;">Choose role</label>
      <select v-model="role">
        <option value="student">Student (solo or claim teacher code)</option>
        <option value="teacher">Teacher (manage students)</option>
      </select>

      <button @click="save">Continue</button>

      <p v-if="msg" style="color:#ffb;">{{ msg }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabase();
const fullName = ref("");
const role = ref<"student"|"teacher">("student");
const msg = ref("");

async function save() {
  msg.value = "";
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return navigateTo("/login");

  // create profile
  const { error: profErr } = await supabase.from("profiles").insert({
    id: user.id,
    role: role.value,
    full_name: fullName.value || null,
  });

  if (profErr) { msg.value = profErr.message; return; }

  // if student => create solo student row linked to them (owner_teacher_id = null)
  if (role.value === "student") {
    const { error: stErr } = await supabase.from("students").insert({
      user_id: user.id,
      owner_teacher_id: null,
      display_name: fullName.value || "Me",
      join_code: null,
    });
    if (stErr) { msg.value = stErr.message; return; }
  }

  navigateTo("/");
}
</script>

<style scoped>
input,select,button{padding:10px;border-radius:10px;border:1px solid #333;background:#111;color:#fff}
button{cursor:pointer}
</style>
