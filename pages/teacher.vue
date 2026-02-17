<template>
  <div style="max-width:1000px;margin:40px auto;padding:16px;">
    <div style="display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap;">
      <h2>Teacher</h2>
      <button @click="logout">Logout</button>
    </div>

    <div style="margin-top:14px;border:1px solid #333;border-radius:12px;padding:12px;">
      <h3>Create student</h3>
      <input v-model="newName" placeholder="Student name" />
      <button @click="createStudent">Create</button>
      <p style="opacity:.7;font-size:13px;">
        Create a student placeholder. Give them the JOIN CODE so they can claim it after they create a student account.
      </p>
    </div>

    <div style="margin-top:14px;border:1px solid #333;border-radius:12px;padding:12px;">
      <h3>Students</h3>
      <div v-if="students.length===0" style="opacity:.7;">No students yet.</div>

      <div v-for="s in students" :key="s.id" style="padding:10px;border-top:1px solid #222;display:flex;gap:10px;justify-content:space-between;align-items:center;">
        <div>
          <div><b>{{ s.display_name }}</b></div>
          <div style="opacity:.75;font-size:13px;">
            Linked account: {{ s.user_id ? "YES" : "NO" }}
            <span v-if="s.join_code"> · JOIN CODE: <b>{{ s.join_code }}</b></span>
          </div>
        </div>
        <button @click="goStudent(s.id)">Manage</button>
      </div>
    </div>

    <p v-if="msg" style="color:#ffb;margin-top:12px;">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabase();
const msg = ref("");
const newName = ref("");
const students = ref<any[]>([]);

async function load() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return navigateTo("/login");

  const { data: rows, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) msg.value = error.message;
  students.value = rows || [];
}

async function createStudent() {
  msg.value = "";
  const name = newName.value.trim();
  if (!name) return;

  const { error } = await supabase.rpc("teacher_create_student", { p_display_name: name });
  if (error) msg.value = error.message;
  else {
    newName.value = "";
    await load();
  }
}

function goStudent(id: string) {
  navigateTo(`/teacher/${id}`);
}

async function logout() {
  await supabase.auth.signOut();
  navigateTo("/login");
}

await load();
</script>

<style scoped>
input,button{padding:10px;border-radius:10px;border:1px solid #333;background:#111;color:#fff}
button{cursor:pointer}
h3{margin:0 0 10px 0}
</style>
