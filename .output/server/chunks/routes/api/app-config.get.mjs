import { c as defineEventHandler } from '../../_/nitro.mjs';
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

const appConfig_get = defineEventHandler(async () => {
  const db = await getDb();
  if (!db) return null;
  return db.collection("app_config").findOne({ key: "family" });
});

export { appConfig_get as default };
//# sourceMappingURL=app-config.get.mjs.map
