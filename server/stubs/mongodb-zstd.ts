// Cloudflare Workers cannot bundle @mongodb-js/zstd because it uses a native .node addon.
// Tandtid does not request zstd compression in MongoClient, so these functions should never run.
export async function compress(_input: Uint8Array): Promise<Uint8Array> {
  throw new Error('Zstd compression is not enabled in Tandtid.')
}

export async function decompress(_input: Uint8Array): Promise<Uint8Array> {
  throw new Error('Zstd compression is not enabled in Tandtid.')
}
