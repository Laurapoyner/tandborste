import { c as defineEventHandler, i as getQuery } from '../../_/nitro.mjs';
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

const sessions_get = defineEventHandler(async (event) => {
  const db = await getDb();
  if (!db) return [];
  const childId = getQuery(event).childId;
  const q = childId ? { childId } : {};
  return db.collection("brushing_sessions").find(q).sort({ completedAt: -1 }).limit(500).toArray();
});

export { sessions_get as default };
//# sourceMappingURL=sessions.get.mjs.map
