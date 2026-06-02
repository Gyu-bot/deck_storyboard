export function appUrl(path: string, request: Request) {
  const base = process.env.NEXTAUTH_URL ?? request.url;
  return new URL(path, base);
}
