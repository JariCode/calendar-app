// Vite-konfiguraatio
// Tämä tiedosto määrittää miten Vite rakentaa ja palvelee sovellusta kehityksessä
// ja tuotannossa. `base: './'` varmistaa että tuotantoon rakennettu sovellus
// toimii suhteellisista poluista (esim. kun avaat dist/index.html paikallisesti).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Sovelluksen peruspolku tuotantorakennetta varten
  base: './',
  // Pluginit: React fast-refresh / SWC tms. tarpeen mukaan
  plugins: [react()],
})
