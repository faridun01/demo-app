export function formatProductName(value: unknown) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return '';
  }

  return normalized
    .replace(/[«"“”„‟'][^«"“”„‟']+[»"“”„‟']/gu, ' ')
    .replace(/\bskif\b/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
