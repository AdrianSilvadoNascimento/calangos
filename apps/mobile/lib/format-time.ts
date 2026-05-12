/** Compact relative time in pt-BR, optimized for activity rows. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 45) return 'agora';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'ontem';
  if (day < 7) return `${day}d`;
  if (day < 30) return `${Math.floor(day / 7)}sem`;
  if (day < 365) return `${Math.floor(day / 30)}mês`;
  return `${Math.floor(day / 365)}a`;
}
