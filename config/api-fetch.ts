import { supabase } from '@/config/supabase';

/** Wraps fetch, attaching the current user's Supabase token so authenticated
 * backend routes accept the request. Same signature as fetch — drop-in
 * replacement for every call to the FastAPI backend. */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}
