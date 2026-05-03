export function formatNumber(n: number, decimals = 2): string {
  if (!isFinite(n)) return '0';
  const fixed = n.toFixed(decimals);
  // Drop trailing zeros but keep at least 0 decimals
  return fixed.replace(/\.?0+$/, '').replace('.', ',');
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} à ${time}`;
}

export function parseFrenchNumber(s: string): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(',', '.').replace(/\s/g, ''));
  return isNaN(n) ? 0 : n;
}
