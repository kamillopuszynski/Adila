export default defineNuxtConfig({
  ssr: true,
  nitro: { preset: "cloudflare-pages" },
  runtimeConfig: {
    public: {
      // These will be filled automatically from Cloudflare env vars:
      // NUXT_PUBLIC_SUPABASE_URL
      // NUXT_PUBLIC_SUPABASE_ANON_KEY
      supabaseUrl: "",
      supabaseAnonKey: "",
    },
  },
});
