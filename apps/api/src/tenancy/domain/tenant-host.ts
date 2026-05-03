const LOCALHOST_SUFFIXES = [".localhost", ".localtest.me"];

export type TenantHostConfig = {
  rootDomain: string;
  reservedSubdomains: readonly string[];
};

export function normalizeHost(hostHeader: string | undefined): string | undefined {
  const firstHost = hostHeader?.split(",")[0]?.trim().toLowerCase();

  if (!firstHost) {
    return undefined;
  }

  return firstHost.replace(/:\d+$/, "");
}

export function resolveTenantSlugFromHost(
  hostHeader: string | undefined,
  config: TenantHostConfig,
): string | undefined {
  const host = normalizeHost(hostHeader);

  if (!host) {
    return undefined;
  }

  const rootDomain = config.rootDomain.toLowerCase();
  const reserved = new Set(config.reservedSubdomains.map((subdomain) => subdomain.toLowerCase()));

  if (host === rootDomain) {
    return undefined;
  }

  const localSlug = resolveLocalSlug(host, reserved);

  if (localSlug) {
    return localSlug;
  }

  const suffix = `.${rootDomain}`;

  if (!host.endsWith(suffix)) {
    return undefined;
  }

  const subdomain = host.slice(0, -suffix.length);

  if (!subdomain || subdomain.includes(".") || reserved.has(subdomain)) {
    return undefined;
  }

  return subdomain;
}

function resolveLocalSlug(host: string, reserved: ReadonlySet<string>): string | undefined {
  for (const suffix of LOCALHOST_SUFFIXES) {
    if (!host.endsWith(suffix)) {
      continue;
    }

    const subdomain = host.slice(0, -suffix.length);

    if (!subdomain || subdomain.includes(".") || reserved.has(subdomain)) {
      return undefined;
    }

    return subdomain;
  }

  return undefined;
}
