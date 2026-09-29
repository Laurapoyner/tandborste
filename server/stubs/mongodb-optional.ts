/**
 * Stub for valgfrie MongoDB Node-driver integrationer, som Tandtid ikke bruger.
 *
 * Cloudflare Workers kan ikke bundle flere af de native/Node-specifikke
 * optional packages. MongoDB-driveren kalder dem kun, hvis de tilhørende
 * features er aktiveret (zstd/snappy compression, Kerberos, GCP auth,
 * client-side encryption eller SOCKS proxy).
 *
 * Tandtid bruger almindelig MongoDB Atlas forbindelse uden disse features.
 */
export const kModuleError = new Error(
  'Denne valgfrie MongoDB-funktion er ikke aktiveret i Tandtid.'
)

export async function compress(): Promise<never> {
  throw kModuleError
}

export async function decompress(): Promise<never> {
  throw kModuleError
}

export async function uncompress(): Promise<never> {
  throw kModuleError
}

export const SocksClient = {
  async createConnection(): Promise<never> {
    throw kModuleError
  }
}

export default {
  kModuleError,
  compress,
  decompress,
  uncompress,
  SocksClient
}
