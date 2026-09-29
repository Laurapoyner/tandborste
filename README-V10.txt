Tandtid v10 – komplet projekt

Denne version indeholder hele appen plus:
- Forældre kan slette en tandbørstning fra Historik.
- Sletning opdaterer stjerner/streak og synkroniserer til MongoDB.
- Offline-sletninger køes og synkroniseres senere.
- MongoDB runtime config læses request-aware på Cloudflare.
- Fallback til process.env for Cloudflare Variables/Secrets.
- MongoDB optional/native dependencies stubbes til Cloudflare-build.
- wrangler.jsonc matcher Worker-navnet "tandborste".
- keep_vars=true beskytter dashboard-variabler mod at blive fjernet ved deploy.
- Database-navn er IKKE hardcoded til "tandtid".
- /api/health giver sikker diagnostik uden at vise URI/password.

VIGTIGT:
Din .env er ikke med i zippen. Behold/kopiér din eksisterende .env ind i projektroden.
