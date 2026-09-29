# Deploy Tandtid til Cloudflare Workers

Projektet er sat op til Cloudflare Workers + Workers Assets.

## 1. Installer afhængigheder

```bash
npm install
```

## 2. Log ind på Cloudflare

```bash
npx wrangler login
```

## 3. Opret secrets/variabler

Kør disse én ad gangen og indsæt værdien, når Wrangler spørger:

```bash
npx wrangler secret put NUXT_MONGODB_URI
npx wrangler secret put NUXT_MONGODB_DB_NAME
npx wrangler secret put NUXT_PARENT_PIN
```

Brug samme værdier som i din lokale `.env`.

## 4. Deploy

```bash
npm run deploy
```

Det kører først et Nuxt-build med Cloudflare-preset og derefter `wrangler deploy`.

## 5. Kontroller databasen

Når appen er online, åbn:

```text
https://DIN-ADRESSE/api/health
```

Forventet svar når MongoDB virker:

```json
{"ok":true,"database":true}
```

## 6. Test appen

- Åbn forsiden.
- Log ind som Forældre.
- Kør `Test rigtig tid`.
- Test kamera.
- Gennemfør én rigtig test/børstning.
- Kontroller at `brushing_sessions` får data i MongoDB.

## 7. Installer på iPad

Åbn appen i Safari → Del → Føj til hjemmeskærm.

PWA-funktioner og kamera kræver HTTPS i produktion. `*.workers.dev`-adressen er allerede HTTPS.

## MongoDB Atlas

Cloudflare Worker skal kunne nå din Atlas-cluster. Hvis `/api/health` ikke kan forbinde, kontroller især Atlas Network Access og databasebrugerens rettigheder. Brug en separat databasebruger med kun de rettigheder appen behøver.
