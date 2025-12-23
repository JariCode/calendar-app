# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
# Kalenteri (React + Vite + Electron)

Pieni kalenterisovellus, rakennettu Reactilla ja Vite:llä, pakattuna Electronilla.

## Nopeasti

- Kehitykseen: `npm run dev` (käynnistää Vite + Electronin)
- Rakenna tuotantoon: `npm run build` ja `npm run dist`

## Rakennusohjeet (Windows-asennin)

1. Asenna riippuvuudet:

```bash
npm install
```

2. Kehitysympäristö:

```bash
npm run dev
```

3. Rakenna tuotantoversio ja tee asennin:

```bash
npm run build
npm run dist
```

### Vinkkejä ja vianetsintää
- Jos `electron-builder` antaa virheen symlinkien kanssa Windowsilla, kokeile ajaa build komentorivi ylläpitäjänä tai ota Developer Mode käyttöön.
- Poista välimuisti tarvittaessa:

```powershell
rd /s /q %LocalAppData%\electron-builder-cache
npm run dist
```

## Turvallisuus & tuotantovalmistus

Sovellus on päivitetty vähentämään tärkeitä riskejä (poistettu synkroninen IPC-altistus, lisätty sulkemishandshake, preload rajoitettu). Ennen jakelua suositeltavaa tehdä seuraavat:

1. Testaa tuotantorakennus UI:n kanssa:

```bash
npm install
npm run build
# Avaa dist/index.html selaimessa tai asenna tuotettu asennin
```

2. Varmista, että `index.html` sisältää tiukan CSP:n tuotantoon (repo sisältää tuotantocsp:n). Poista kehityksen `unsafe-inline` käyttö ja varmista, että kaikki tyylit tulevat erillisistä tiedostoista after Vite build.

3. Testaa sulkeminen ja uudelleenkäynnistys varmistaaksesi tapahtumien säilymisen.

4. Aja `npm audit` ja tee tarvittavat päivitykset; käytä myös SCA-työkalua (Snyk/Dependabot) jos mahdollista.

5. Signeeraa Windows-installer (code signing) ennen julkaisua — ilman signeerausta käyttäjät näkevät varoituksia.

6. Testaa asentaminen ja poistaminen puhtaassa VM:ssä tai erillisellä käyttäjätilillä.

Tarvittaessa autan automatisoimaan buildin ja signeerauksen CI:ssä.

### Code signing in CI (GitHub Actions)

The repo's Windows packaging workflow supports optional code signing using two GitHub Secrets:

- `CSC_LINK` — either a URL to download the certificate (p12/pfx) or the base64-encoded certificate content.
- `CSC_KEY_PASSWORD` — the certificate password.

To configure:

1. Go to your repository Settings → Secrets → Actions and add `CSC_LINK` and `CSC_KEY_PASSWORD`.
	- If you store the cert in a secure storage (Azure KeyVault / S3 signed URL), set `CSC_LINK` to that URL.
	- Or set `CSC_LINK` to the base64-encoded contents of the `.p12` file.

2. The `package-windows.yml` workflow will attempt to fetch or decode the certificate and pass the values to `electron-builder`.

3. Test a signed build by pushing to `main` and downloading the artifact from the workflow run.

If you prefer, I can help set up secure storage (Azure Key Vault/GitHub Encrypted secrets) and CI secrets.

