import { c as defineEventHandler, u as useRuntimeConfig } from '../../_/nitro.mjs';
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

const health_get = defineEventHandler(async () => {
  const config = useRuntimeConfig();
  try {
    const db = await getDb();
    if (!db) {
      return {
        ok: false,
        database: false,
        config: {
          mongodbUriPresent: Boolean(config.mongodbUri),
          mongodbDbNamePresent: Boolean(config.mongodbDbName)
        },
        reason: "MongoDB ikke konfigureret"
      };
    }
    await db.command({ ping: 1 });
    return {
      ok: true,
      database: true,
      config: {
        mongodbUriPresent: Boolean(config.mongodbUri),
        mongodbDbNamePresent: Boolean(config.mongodbDbName)
      }
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      ok: false,
      database: false,
      config: {
        mongodbUriPresent: Boolean(config.mongodbUri),
        mongodbDbNamePresent: Boolean(config.mongodbDbName)
      },
      error: {
        name: err.name,
        message: err.message
      }
    };
  }
});

export { health_get as default };
//# sourceMappingURL=health.get.mjs.map
