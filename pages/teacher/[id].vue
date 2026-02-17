<template>
  <div style="max-width:1000px;margin:40px auto;padding:16px;">
    <div style="display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap;">
      <h2>Manage student</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button @click="back">Back</button>
        <button @click="logout">Logout</button>
      </div>
    </div>

    <div v-if="student" style="margin-top:14px;padding:12px;border:1px solid #333;border-radius:12px;">
      <div><b>{{ student.display_name }}</b></div>
      <div style="font-size:28px;margin-top:8px;">Lessons left: <b>{{ balance }}</b></div>
      <div style="opacity:.75;font-size:13px;margin-top:6px;">
        Linked account: {{ student.user_id ? "YES" : "NO" }}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
      <div style="border:1px solid #333;border-radius:12px;padding:12px;">
        <h3>Add lessons package</h3>
        <input v-model.number="lessonsAdd" type="number" placeholder="Lessons to add (e.g. 4)" />
        <input v-model.number="amount" type="number" placeholder="Money (optional)" />
        <input v-model="noteT" placeholder="Note" />
        <button @click="addPackage">Add</button>
      </div>

      <div style="border:1px solid #333;border-radius:12px;padding:12px;">
        <h3>Add lesson</h3>
        <input v-model="startsAt" placeholder="Start (YYYY-MM-DD HH:mm) optional" />
        <input v-model.number="duration" type="number" placeholder="Duration minutes" />
        <input v-model="noteL" placeholder="Note" />
        <button @click="addLesson">Add planned</button>
      </div>
    </div>

    <div style="margin-top:14px;border:1px solid #333;border-radius:12px;padding:12px;">
      <h3>Lessons</h3>
      <div v-if="lessons.length===0" style="opacity:.7;">No lessons.</div>
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
const route = useRoute();
const msg = ref("");

const student = ref<any>(null);
const balance = ref(0);
const lessons = ref<any[]>([]);

const lessonsAdd = ref<number>(4);
const amount = ref<number | null>(null);
const noteT = ref("");

const startsAt = ref("");
const duration = ref<number>(60);
const noteL = ref("");

function parseDateTime(s: string) {
  if (!s.trim()) return null;
  const iso = s.trim().replace(" ", "T") + ":00";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function load() {
  msg.value = "";
  const id = route.params.id as string;

  const { data: st, error: stErr } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
  if (stErr) { msg.value = stErr.message; return; }
  student.value = st;

  const { data: bal } = await supabase.from("student_balance").select("lesson_balance").eq("student_id", id).maybeSingle();
  balance.value = bal?.lesson_balance ?? 0;

  const { data: ls } = await supabase.from("lessons").select("*").eq("student_id", id).order("created_at", { ascending: false });
  lessons.value = ls || [];
}

async function addPackage() {
  msg.value = "";
  if (!student.value) return;

  const add = Number(lessonsAdd.value || 0);
  if (!add) return;

  const { data } = await supabase.auth.getSession();
  const teacherId = data.session?.user.id;

  const { error } = await supabase.from("transactions").insert({
    student_id: student.value.id,
    owner_teacher_id: teacherId,
    type: "package",
    lessons_added: add,
    amount_money: amount.value ?? null,
    currency: "PLN",
    note: noteT.value || null,
  });

  if (error) msg.value = error.message;
  else { noteT.value = ""; amount.value = null; await load(); }
}

async function addLesson() {
  msg.value = "";
  if (!student.value) return;

  const { data } = await supabase.auth.getSession();
  const teacherId = data.session?.user.id;

  const { error } = await supabase.from("lessons").insert({
    student_id: student.value.id,
    owner_teacher_id: teacherId,
    status: "planned",
    starts_at: parseDateTime(startsAt.value),
    duration_minutes: duration.value || 60,
    note: noteL.value || null,
  });

  if (error) msg.value = error.message;
  else { startsAt.value=""; noteL.value=""; duration.value=60; await load(); }
}

async function markCompleted(id: string) {
  msg.value = "";
  const { error } = await supabase.from("lessons").update({ status: "completed" }).eq("id", id);
  if (error) msg.value = error.message;
  else await load();
}

function back() { navigateTo("/teacher"); }
async function logout() { await supabase.auth.signOut(); navigateTo("/login"); }

await load();
</script>

<style scoped>
input,button{padding:10px;border-radius:10px;border:1px solid #333;background:#111;color:#fff}
button{cursor:pointer}
h3{margin:0 0 10px 0}
</style>
