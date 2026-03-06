export const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function telegramAuth(initDataRaw: string): Promise<{ userId: string }> {
  const response = await fetch(`${apiBase}/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initDataRaw }),
  });
  if (!response.ok) throw new Error('auth_failed');
  return response.json() as Promise<{ userId: string }>;
}
