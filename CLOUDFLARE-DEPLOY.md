# Tandtid på Cloudflare Workers

## Variabler i Cloudflare Dashboard
Gå til Worker **tandborste** → Settings → Variables and Secrets.

Tilføj:

- `NUXT_MONGODB_URI` → **Secret** → samme fungerende connection string som i din lokale `.env`.
- `NUXT_MONGODB_DB_NAME` → almindelig Variable → samme databasenavn som lokalt. Den kan udelades, hvis databasenavnet ligger direkte i URI'en.
- `NUXT_PARENT_PIN` → **Secret**.

`wrangler.jsonc` har `keep_vars: true`, så værdier som er sat i Dashboardet ikke bliver slettet ved et GitHub/Wrangler deploy. Secrets bliver heller ikke lagt i Git.

## MongoDB Atlas
MongoDB Atlas skal tillade forbindelser fra Cloudflare. Hvis du bruger en IP Access List og Cloudflare ikke har en fast egress-IP, skal listen være sat, så Workers kan nå clusteret.

Brug den connection string, der allerede virker lokalt. Du behøver normalt ikke selv tilføje ekstra auth-parametre.

## Test
Når deployment er færdigt:

`https://tandborste.laurapoyner.workers.dev/api/health`

Succes:

```json
{"ok":true,"database":true,...}
```

Hvis `mongodbUriPresent` er `false`, mangler Cloudflare-secretet.
Hvis den er `true`, men databasen fejler, viser `error.name` og `error.message` den faktiske MongoDB-fejl uden at vise connection string eller password.

## Lokal udvikling
Behold din eksisterende `.env` og kør:

```powershell
npm install
npm run dev
```

### V12 note
MongoDB-klienten er request-scoped. Dette er med vilje til Cloudflare Workers.
Undgå at ændre `server/utils/mongo.ts` tilbage til en global singleton/pool.
