function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('karrents_session_token');
  const headers = new Headers(init?.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Inject user's custom Gemini API key if present
  const customGeminiKey = localStorage.getItem('karrents_custom_gemini_key');
  if (customGeminiKey) {
    headers.set('X-Gemini-API-Key', customGeminiKey);
  }

  // Double-submit CSRF protection: append XSRF token from cookie if available
  const xsrfToken = getCookie('xsrf-token');
  if (xsrfToken) {
    headers.set('X-XSRF-TOKEN', xsrfToken);
  }

  // Ensure JSON requests have Content-Type set appropriately if they have body
  if (init?.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers
  });
}

export async function parseApiError(res: Response, defaultMessage: string): Promise<string> {
  try {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const d = await res.json();
      return d.error || d.message || defaultMessage;
    }
    const text = await res.text();
    if (text && text.trim() && text.length < 200 && !text.includes('<!DOCTYPE')) {
      return text.trim();
    }
  } catch (_) {}
  return `${defaultMessage} (Status: ${res.status} ${res.statusText})`;
}
