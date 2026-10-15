VIGTIGT VED OPDATERING FRA EN TIDLIGERE VERSION

1. Stop npm run dev.
2. Slet denne gamle fil, hvis den findes:
   composables/useAppConfig.ts
3. Slet denne gamle fil, hvis den findes:
   pages/child/[id].vue
   (V4 bruger i stedet pages/child/[id]/index.vue)
4. Kopier V4-filerne ind i projektet.
5. Kør npm run dev igen.

Hvis du vil være helt sikker på ikke at beholde gamle filer, så er den nemmeste løsning at pakke V4 ud i en HELT NY mappe og køre npm install der.
