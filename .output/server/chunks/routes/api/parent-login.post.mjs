import { c as defineEventHandler, r as readBody, u as useRuntimeConfig, e as createError } from '../../_/nitro.mjs';
import { s as setParentSession } from '../../_/parent-auth.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const parentLogin_post = defineEventHandler(async (event) => {
  const { pin } = await readBody(event);
  const config = useRuntimeConfig(event);
  if (!config.parentPin) throw createError({ statusCode: 503, statusMessage: "For\xE6ldre-PIN er ikke konfigureret" });
  if (String(pin) !== String(config.parentPin)) throw createError({ statusCode: 401, statusMessage: "Forkert PIN" });
  setParentSession(event, String(pin));
  return { ok: true };
});

export { parentLogin_post as default };
//# sourceMappingURL=parent-login.post.mjs.map
