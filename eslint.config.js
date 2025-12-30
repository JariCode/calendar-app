// ESLint-konfiguraatio (flat config)
// Tässä määritellään säännöt ja laajennukset JavaScript/JSX-tiedostoille.
// Kommentit suomeksi selittävät osiot:
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ohitetaan `dist`-hakemisto, jotta buildin tiedostot eivät vaikuta linteriin
  globalIgnores(['dist']),
  {
    // Kohdistus: kaikki .js ja .jsx -tiedostot
    files: ['**/*.{js,jsx}'],
    extends: [
      // Perussuositukset @eslint/js -paketista
      js.configs.recommended,
      // React hooks -pluginin suositukset (varmistaa hookien oikean käytön)
      reactHooks.configs.flat.recommended,
      // Plugin, joka auttaa Vite + React -kehityksessä (nopea päivitys)
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // ECMAScript -versio ja globaaliympäristö
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Sääntö: virhe käytöstä olemattomista muuttujista, mutta salli
      // tietyt isolla alkavat tunnisteet (esim. komponentit/konstanssit).
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
