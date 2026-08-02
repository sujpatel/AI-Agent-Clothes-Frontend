import { supabase } from '@/config/supabase';

/** Wraps fetch, attaching the current user's Supabase token so authenticated
 * backend routes accept the request. Same signature as fetch — drop-in
 * replacement for every call to the FastAPI backend. */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    // Every backend route requires auth — sending the request anyway would
    // just produce a confusing 422/401 from the server. Fail here instead,
    // with a message that actually explains what's wrong.
    throw new Error('Not signed in — please log in again.');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}
