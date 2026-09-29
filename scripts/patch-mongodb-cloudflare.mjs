import fs from 'node:fs'
import path from 'node:path'

const target = path.resolve('node_modules/mongodb/lib/cmap/auth/scram.js')
const marker = 'TANDTID_CLOUDFLARE_CRYPTO_PATCH'

if (!fs.existsSync(target)) {
  console.error(`[Tandtid] MongoDB driver not found at ${target}. Run npm install first.`)
  process.exit(1)
}

let source = fs.readFileSync(target, 'utf8')

if (source.includes(marker)) {
  console.log('[Tandtid] MongoDB Cloudflare crypto patch already applied.')
  process.exit(0)
}

// MongoDB 7.x intentionally keeps SCRAM-SHA-1's crypto require inside a
// try/catch because crypto is optional in custom runtimes. Rollup's CommonJS
// plugin deliberately leaves requires inside try/catch untouched, which means
// the generated Worker later attempts a dynamic require("crypto") and fails.
//
// Cloudflare Workers supports node:crypto. Moving that one require to module
// scope makes it statically visible to Nitro/Rollup, while keeping MongoDB's
// own SCRAM implementation unchanged.
const useStrictDouble = '"use strict";'
const useStrictSingle = "'use strict';"
let anchor
if (source.includes(useStrictDouble)) anchor = useStrictDouble
else if (source.includes(useStrictSingle)) anchor = useStrictSingle
else {
  console.error('[Tandtid] Could not find the CommonJS strict-mode header in MongoDB scram.js.')
  process.exit(1)
}

source = source.replace(
  anchor,
  `${anchor}\n// ${marker}\nconst __tandtidNodeCrypto = require("node:crypto");`
)

const block = /\s*let nodeCrypto;\s*try\s*\{[\s\S]*?nodeCrypto\s*=\s*require\((['"])crypto\1\);[\s\S]*?\}\s*catch\s*\(e\)\s*\{[\s\S]*?Node\.js crypto module is required for SCRAM-SHA-1 authentication[\s\S]*?\}\s*\n\s*try\s*\{/m

if (!block.test(source)) {
  console.error('[Tandtid] MongoDB scram.js has changed and the expected SCRAM-SHA-1 crypto block was not found.')
  console.error('[Tandtid] Refusing to continue so the Worker is not built with a broken dynamic crypto require.')
  process.exit(1)
}

source = source.replace(block, '\n    const nodeCrypto = __tandtidNodeCrypto;\n    try {')

fs.writeFileSync(target, source, 'utf8')
console.log('[Tandtid] Patched MongoDB SCRAM crypto for Cloudflare Workers.')
