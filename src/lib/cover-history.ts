export function coverHistoryPaths(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((path): path is string => typeof path === "string" && path.length > 0))] : [];
}

export function rememberCover(value: unknown, current: string | null, next?: string): string[] {
  return [...new Set([next, current, ...coverHistoryPaths(value)].filter((path): path is string => Boolean(path)))];
}
