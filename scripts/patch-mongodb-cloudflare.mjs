import fs from 'node:fs'
import path from 'node:path'

// MongoDB's Node driver contains several optional integrations. Tandtid does not
// use them, but Nitro/Rollup still needs every static require() to resolve when
// bundling for Cloudflare Workers. Create tiny CommonJS placeholder packages for
// optional dependencies that are not installed.
const optionalPackages = [
  '@aws-sdk/credential-providers',
  '@mongodb-js/zstd',
  'gcp-metadata',
  'kerberos',
  'mongodb-client-encryption',
  'snappy',
  'socks',
  'aws4'
]

function ensureOptionalStub(packageName) {
  const packageDir = path.resolve('node_modules', ...packageName.split('/'))
  const packageJson = path.join(packageDir, 'package.json')
  const indexFile = path.join(packageDir, 'index.js')

  // Never replace a real installed package.
  if (fs.existsSync(packageJson) || fs.existsSync(indexFile)) return false

  fs.mkdirSync(packageDir, { recursive: true })
  fs.writeFileSync(
    packageJson,
    JSON.stringify({
      name: packageName,
      version: '0.0.0-tandtid-stub',
      private: true,
      main: 'index.js',
      type: 'commonjs'
    }, null, 2) + '\n',
    'utf8'
  )
  fs.writeFileSync(
    indexFile,
    `// Tandtid Cloudflare build stub for optional MongoDB dependency: ${packageName}\nmodule.exports = {};\n`,
    'utf8'
  )
  return true
}

let created = 0
for (const packageName of optionalPackages) {
  if (ensureOptionalStub(packageName)) created++
}
console.log(`[Tandtid] MongoDB optional dependency stubs ready (${created} created).`)

// MongoDB 7.x keeps SCRAM-SHA-1's crypto require inside a try/catch. Rollup's
// CommonJS transform can leave that as a dynamic require("crypto"), while
// Cloudflare Workers supports node:crypto through nodejs_compat. Move that
// require to module scope so Nitro can bundle it statically.
const target = path.resolve('node_modules/mongodb/lib/cmap/auth/scram.js')
const marker = 'TANDTID_CLOUDFLARE_CRYPTO_PATCH'

if (!fs.existsSync(target)) {
  console.error(`[Tandtid] MongoDB driver not found at ${target}. Run npm install first.`)
  process.exit(1)
}

let source = fs.readFileSync(target, 'utf8')

if (!source.includes(marker)) {
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
} else {
  console.log('[Tandtid] MongoDB Cloudflare crypto patch already applied.')
}
