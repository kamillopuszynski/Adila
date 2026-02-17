<template>
  <div style="max-width:1000px;margin:40px auto;padding:16px;">
    <div style="display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap;">
      <h2>Student</h2>
      <button @click="logout">Logout</button>
    </div>

    <div v-if="student" style="margin-top:14px;padding:12px;border:1px solid #333;border-radius:12px;">
      <div><b>{{ student.display_name }}</b></div>
      <div style="opacity:.8;">Managed by teacher: {{ student.owner_teacher_id ? "YES" : "NO (solo)" }}</div>
      <div style="font-size:28px;margin-top:8px;">
        Lessons left: <b>{{ balance }}</b>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
      <div style="border:1px solid #333;border-radius:12px;padding:12px;">
        <h3>Add lesson</h3>
        <input v-model="startsAt" placeholder="Start (YYYY-MM-DD HH:mm) optional" />
        <input v-model.number="duration" type="number" placeholder="Duration minutes" />
        <input v-model="note" placeholder="Note" />
        <button @click="addLesson">Add planned</button>
      </div>

      <div style="border:1px solid #333;border-radius:12px;padding:12px;">
        <h3>Claim teacher join code</h3>
        <input v-model="joinCode" placeholder="8-char code" />
        <button @click="claim">Claim</button>
        <p style="opacity:.8;font-size:13px;">
          If your teacher created you, they give you a join code. This links your account.
        </p>
      </div>
    </div>

    <div style="margin-top:14px;border:1px solid #333;border-radius:12px;padding:12px;">
      <h3>Lessons</h3>
      <div v-if="lessons.length===0" style="opacity:.7;">No lessons yet.</div>
      <div v-for="l in lessons" :key="l.id" style="padding:10px;border-top:1px solid #222;display:flex;gap:10px;justify-content:space-between;">
        <div>
          <div><b>{{ l.status }}</b> — {{ l.starts_at ? new Date(l.starts_at).toLocaleString() : "no date" }}</div>
          <div style="opacity:.7;">{{ l.duration_minutes }} min · {{ l.note || "" }}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button v-if="l.status!=='completed'" @click="markCompleted(l.id)">Mark completed</button>
        </div>
      </div>
    </div>

    <p v-if="msg" style="color:#ffb;margin-top:12px;">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabase();
const msg = ref("");

const student = ref<any>(null);
const balance = ref<number>(0);
const lessons = ref<any[]>([]);

const startsAt = ref("");
const duration = ref<number>(60);
const note = ref("");

const joinCode = ref("");

async function load() {
  msg.value = "";
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return navigateTo("/login");

  // student row linked to this user
  const { data: st } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  student.value = st;

  if (!st) { msg.value = "No student record found. Go to onboarding again."; return; }

  const { data: bal } = await supabase
    .from("student_balance")
    .select("lesson_balance")
    .eq("student_id", st.id)
    .maybeSingle();

  balance.value = bal?.lesson_balance ?? 0;

  const { data: ls } = await supabase
    .from("lessons")
    .select("*")
    .eq("student_id", st.id)
    .order("created_at", { ascending: false });

  lessons.value = ls || [];
}

function parseDateTime(s: string) {
  // expects "YYYY-MM-DD HH:mm"
  if (!s.trim()) return null;
  const iso = s.trim().replace(" ", "T") + ":00";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function addLesson() {
  msg.value = "";
  if (!student.value) return;

  const { error } = await supabase.from("lessons").insert({
    student_id: student.value.id,
    owner_teacher_id: student.value.owner_teacher_id,
    status: "planned",
    starts_at: parseDateTime(startsAt.value),
    duration_minutes: duration.value || 60,
    note: note.value || null,
  });

  if (error) msg.value = error.message;
  else {
    startsAt.value = ""; note.value = ""; duration.value = 60;
    await load();
  }
}

async function markCompleted(id: string) {
  msg.value = "";
  const { error } = await supabase.from("lessons").update({ status: "completed" }).eq("id", id);
  if (error) msg.value = error.message;
  else await load();
}

async function claim() {
  msg.value = "";
  const code = joinCode.value.trim().toUpperCase();
  if (!code) return;

  const { data, error } = await supabase.rpc("claim_join_code", { p_join_code: code });
  if (error) msg.value = error.message;
  else {
    msg.value = "Claimed! Your teacher now manages your lessons too.";
    joinCode.value = "";
    await load();
  }
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
