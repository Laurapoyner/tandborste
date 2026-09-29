/**
 * Stub for optional MongoDB Node-driver integrations that Tandtid does not use.
 * This keeps Nitro/Cloudflare from bundling native or platform-specific addons.
 */
export const kModuleError = new Error(
  'Denne valgfrie MongoDB-funktion er ikke aktiveret i Tandtid.'
)

export async function compress(): Promise<never> { throw kModuleError }
export async function decompress(): Promise<never> { throw kModuleError }
export async function uncompress(): Promise<never> { throw kModuleError }

export const SocksClient = {
  async createConnection(): Promise<never> { throw kModuleError }
}

export default {
  kModuleError,
  compress,
  decompress,
  uncompress,
  SocksClient
}
