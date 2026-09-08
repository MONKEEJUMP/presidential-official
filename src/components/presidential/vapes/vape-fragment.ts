export function decodeVapeFragment(hash: string): string {
  const rawFragment = hash.startsWith('#') ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(rawFragment);
  } catch {
    return rawFragment;
  }
}
