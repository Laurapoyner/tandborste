import { c as defineEventHandler, r as readBody, e as createError } from '../../_/nitro.mjs';
import { g as getDb } from '../../_/mongo.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'bson';
import 'timers/promises';
import 'timers';
import 'fs';
import 'http';
import 'process';
import 'zlib';
import 'stream';
import 'events';
import 'util';
import 'dns';
import 'mongodb-connection-string-url';
import 'url';
import 'net';
import 'fs/promises';
import 'tls';
import 'child_process';
import '@mongodb-js/saslprep';

const sessions_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.id)) throw createError({ statusCode: 400, statusMessage: "Mangler id" });
  const db = await getDb();
  if (!db) throw createError({ statusCode: 503, statusMessage: "MongoDB er ikke konfigureret endnu" });
  await db.collection("brushing_sessions").updateOne(
    { id: body.id },
    { $setOnInsert: { ...body, createdAtDb: /* @__PURE__ */ new Date() } },
    { upsert: true }
  );
  return { ok: true, id: body.id };
});

export { sessions_post as default };
//# sourceMappingURL=sessions.post.mjs.map
