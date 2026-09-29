# Tandtid

Tandtid er en børnevenlig Nuxt/PWA-app til Aya og Ellie med tandbørstning, live-kamera, visuel tandguide, voksenhjælp, stjerner, streaks, badges, belønninger og forældreoverblik.

## Standarder

- Morgen: 05:00–15:00
- Aften: 17:00–23:59
- Standard børstetid: 1:30
- YDER: ca. 35 sek.
- INDER: ca. 35 sek.
- MIDTEN/tyggeflader: ca. 20 sek.
- Mandag morgen: voksenhjælp
- Torsdag aften: voksenhjælp
- Voksenbekræftelse sker før børstningen kan starte

Alt ovenstående kan ændres i forældreområdet.

## Offline-first

Appen gemmer tandbørstninger lokalt med det samme og lægger dem i en synkroniseringskø. Hvis nettet er væk, kan barnet fortsætte med tandbørstning, timer, tandkort og kamera. Når nettet kommer tilbage, forsøger appen automatisk at sende ventende data til MongoDB.

Følgende håndteres af sync-køen:

- tandbørstninger
- indløste belønninger
- forældreindstillinger og belønningsopsætning

MongoDB-skrivninger bruger klient-genererede id'er og upsert, så et retry ikke bør oprette dubletter.

Forældre-PIN kan godkendes offline på en enhed efter PIN-koden mindst én gang tidligere er blevet godkendt online på netop den enhed.

## Lokal udvikling

1. Kopiér `.env.example` til `.env` og udfyld dine egne værdier.
2. Installer:

```bash
npm install
```

3. Start:

```bash
npm run dev
```

4. Åbn `http://localhost:3000`.

Kamera virker på localhost. På iPad i produktion skal appen ligge på HTTPS.

## Miljøvariabler

```env
NUXT_MONGODB_URI=mongodb+srv://...
NUXT_MONGODB_DB_NAME=tandtid
NUXT_PARENT_PIN=1234
```

`.env` er ignoreret af Git og skal ikke uploades til repository.

## Cloudflare

Se `CLOUDFLARE-DEPLOY.md`.

## Collections i MongoDB

Appen opretter/bruger:

- `brushing_sessions`
- `reward_redemptions`
- `app_config`

Unikke indexes på klient-id'er bliver oprettet automatisk.

## PWA / iPad

Produktionsbuildet har service worker, manifest, Apple touch icon og PNG/maskable ikoner. Efter deployment:

1. Åbn appens HTTPS-adresse i Safari på iPad.
2. Tryk Del.
3. Vælg Føj til hjemmeskærm.
4. Åbn Tandtid fra ikonet.
5. Giv kamera-adgang første gang en børstning startes.

Appen gemmer ikke foto eller video; kameraet bruges kun som live-spejl.

## Offline-test

Efter appen er deployet og åbnet mindst én gang online:

1. Start appen online.
2. Slå Wi-Fi/data fra.
3. Gennemfør en tandbørstning.
4. Appen viser `Offline · gemmer på enheden`.
5. Slå nettet til igen.
6. Køen synkroniseres automatisk.

Bemærk: data, der kun findes lokalt og endnu ikke er synkroniseret, kan gå tabt hvis selve appen/site-data slettes fra enheden inden forbindelsen vender tilbage.

## V12 – Cloudflare MongoDB request-scope fix

Denne version retter en vigtig Cloudflare Workers-fejl:

Tidligere blev `MongoClient` gemt i modul-global state. Cloudflare genbruger Worker-isolates
mellem requests, men en TCP/databaseforbindelse må ikke genbruges på tværs af request-contexts.
Det kan give `Error 1101 – Worker threw exception` efter at forbindelsen først har virket.

V12:
- opretter en ny MongoDB-klient pr. API-request
- lukker klienten igen efter operationen
- genbruger ikke sockets mellem requests
- `/api/health` viser nu også det faktiske databasenavn, uden at vise URI/password
- beholder sletning af tandbørstninger, offline-sync og alle tidligere funktioner

Cloudflare variables/secrets:
- NUXT_MONGODB_URI
- NUXT_MONGODB_DB_NAME (valgfri hvis databasenavnet står i URI'en)
- NUXT_PARENT_PIN
