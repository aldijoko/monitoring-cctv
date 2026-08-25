/**
 * Cookie names shared between server-side auth (login's +page.server.ts
 * action, hooks.server.ts) and the client auth store (stores/auth.ts, which
 * mirrors/reads them so existing client-side code — client.ts's bearer
 * header, isAuthenticated, etc. — keeps working unchanged). Must match on
 * both sides. None of these are httpOnly: client.ts needs to read the
 * access token itself to build the Authorization header, since the Go
 * backend's AuthMiddleware only checks that header, not cookies.
 */
export const ACCESS_TOKEN_COOKIE = 'cctv_access_token';
export const REFRESH_TOKEN_COOKIE = 'cctv_refresh_token';
/** JSON-encoded `User` (see types/api.ts) — small enough to fit a cookie. */
export const USER_COOKIE = 'cctv_user';
