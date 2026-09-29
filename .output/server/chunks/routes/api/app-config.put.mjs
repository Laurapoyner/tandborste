import { c as defineEventHandler, r as readBody, e as createError } from '../../_/nitro.mjs';
import { g as getDb } from '../../_/mongo.mjs';
import { r as requireParent } from '../../_/parent-auth.mjs';
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

const appConfig_put = defineEventHandler(async (event) => {
  requireParent(event);
  const body = await readBody(event);
  const db = await getDb();
  if (!db) throw createError({ statusCode: 503, statusMessage: "MongoDB er ikke konfigureret endnu" });
  await db.collection("app_config").updateOne(
    { key: "family" },
    { $set: { key: "family", settings: body.settings, rewards: body.rewards, updatedAt: body.updatedAt || (/* @__PURE__ */ new Date()).toISOString() } },
    { upsert: true }
  );
  return { ok: true };
});

export { appConfig_put as default };
//# sourceMappingURL=app-config.put.mjs.map
