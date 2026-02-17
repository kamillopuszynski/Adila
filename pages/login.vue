<template>
  <div style="max-width:420px;margin:40px auto;padding:16px;">
    <h2>Lesson Manager</h2>

    <div style="display:grid;gap:10px;margin-top:14px;">
      <input v-model="email" placeholder="Email" />
      <input v-model="password" placeholder="Password" type="password" />

      <button @click="signUp">Sign up</button>
      <button @click="signIn">Sign in</button>

      <p style="opacity:.7;font-size:13px;">
        Free accounts via Supabase Auth. After login you’ll choose Teacher or Student.
      </p>

      <p v-if="msg" style="color:#ffb;">
        {{ msg }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabase();
const email = ref("");
const password = ref("");
const msg = ref("");

async function signUp() {
  msg.value = "";
  const { error } = await supabase.auth.signUp({ email: email.value, password: password.value });
  msg.value = error ? error.message : "Check your email (if confirmation is enabled) or sign in.";
}

async function signIn() {
  msg.value = "";
  const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value });
  if (error) msg.value = error.message;
  else navigateTo("/");
}
</script>

<style scoped>
input,button{padding:10px;border-radius:10px;border:1px solid #333;background:#111;color:#fff}
button{cursor:pointer}
</style>
