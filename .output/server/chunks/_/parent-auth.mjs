import { u as useRuntimeConfig, e as createError, g as getCookie, f as setCookie, h as getRequestURL } from './nitro.mjs';
import { timingSafeEqual, createHash } from 'node:crypto';

const COOKIE_NAME = "tandtid_parent";
function tokenFor(pin) {
  return createHash("sha256").update(`tandtid-parent-session:${pin}`).digest("hex");
}
function setParentSession(event, pin) {
  setCookie(event, COOKIE_NAME, tokenFor(pin), {
    httpOnly: true,
    secure: getRequestURL(event).protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}
function requireParent(event) {
  const config = useRuntimeConfig(event);
  if (!config.parentPin) throw createError({ statusCode: 503, statusMessage: "For\xE6ldre-PIN er ikke konfigureret" });
  const actual = getCookie(event, COOKIE_NAME) || "";
  const expected = tokenFor(String(config.parentPin));
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw createError({ statusCode: 401, statusMessage: "For\xE6ldrelogin kr\xE6ves" });
  }
}

export { requireParent as r, setParentSession as s };
//# sourceMappingURL=parent-auth.mjs.map
