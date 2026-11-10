export function formatValue(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".", ",") + "k";
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace(".", ",");
}
