TANDTID v11 – Cloudflare/MongoDB SCRAM fix

Denne version indeholder hele Tandtid-projektet fra v10 samt:

- Forældre kan slette en tandbørstning fra Historik.
- Offline-sletning synkroniseres senere.
- MongoDB optional/native dependencies er stadig stubbet til Cloudflare.
- NYT: MongoDB SCRAM-SHA-1 crypto-require patches automatisk før build.

Hvorfor crypto-patchen findes:
MongoDB-driveren kalder require("crypto") inde i en try/catch ved SCRAM-SHA-1.
Nitro/Rollup lader optional require-kald inde i try/catch stå dynamiske.
Cloudflare har node:crypto, men den dynamiske require kan derfor stadig fejle.
Build-scriptet flytter kun dette crypto-import til module scope som
require("node:crypto"), så bundleren kan se det statisk.

Du skal IKKE ændre den MongoDB URI, der allerede virker lokalt.
Kopiér din eksisterende .env ind i den nye projektmappe.

Lokalt:
  npm install
  npm run dev

Cloudflare Dashboard:
  NUXT_MONGODB_URI      = præcis samme URI som i din fungerende .env
  NUXT_MONGODB_DB_NAME  = præcis samme databasenavn som i .env
  NUXT_PARENT_PIN       = din PIN

NUXT_MONGODB_URI og NUXT_PARENT_PIN kan gemmes som Secrets.
DB-navnet kan gemmes som almindelig variabel.

Git:
  git add .
  git commit -m "Tandtid v11 Cloudflare MongoDB fix"
  git push

Cloudflare build command:
  npm run build

Cloudflare deploy command:
  npx wrangler deploy

Efter deploy test:
  https://tandborste.laurapoyner.workers.dev/api/health

Forventet resultat:
  {"ok":true,"database":true,...}
