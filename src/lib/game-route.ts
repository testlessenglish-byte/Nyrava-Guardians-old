const IMMERSIVE_GAME_PREFIXES = ["/isla", "/classroom", "/missions", "/city", "/home-hq"] as const;

export function isImmersiveGameRoute(pathname: string) {
  return IMMERSIVE_GAME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function immersiveGameRoutes() {
  return [...IMMERSIVE_GAME_PREFIXES];
}
