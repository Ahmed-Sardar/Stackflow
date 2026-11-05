const apiUrl = import.meta.env.VITE_API_URL || '/api';

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error('Unable to connect to StockFlow. Check that the API is running.');
  }
  let payload;
  try { payload = await response.json(); } catch { throw new Error('The server returned an unexpected response.'); }
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/me' && !path.startsWith('/auth/login')) window.dispatchEvent(new Event('stockflow:unauthorized'));
    throw new Error(payload.error || 'Request failed. Please try again.');
  }
  return payload.data;
}
