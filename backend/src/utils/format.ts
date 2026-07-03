export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / k ** unitIndex;
  const decimals = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;

  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

export function formatMegabytes(mb: number): string {
  return formatBytes(mb * 1024 * 1024);
}
