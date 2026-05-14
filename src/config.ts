export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  /**
   * Optional login form defaults (e.g. after `npm run seed` in backend).
   * Set NEXT_PUBLIC_LOGIN_PREFILL_EMAIL / NEXT_PUBLIC_LOGIN_PREFILL_PASSWORD to '' to disable in production builds.
   */
  loginPrefillEmail: process.env.NEXT_PUBLIC_LOGIN_PREFILL_EMAIL ?? 'fan@pulseplay.local',
  loginPrefillPassword: process.env.NEXT_PUBLIC_LOGIN_PREFILL_PASSWORD ?? 'Fan12345!',
};
