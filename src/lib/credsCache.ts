export type CachedCreds = {
  email: string;
  password: string;
  ssid?: string;
} | null;

let globalCredsCache: CachedCreds = null;

export function getCredsCache(): CachedCreds {
  return globalCredsCache;
}

export function setCredsCache(creds: CachedCreds): void {
  globalCredsCache = creds;
}

export function clearCredsCache(): void {
  globalCredsCache = null;
}
