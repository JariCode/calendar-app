# Kalenteri (suomeksi)

Pieni kalenterisovellus, rakennettu Reactilla ja Vite:llä, pakattuna Electronilla.

Tämä README sisältää suomenkielisen yhteenvedon projektin käytöstä ja rakennusohjeet.

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

Sovellus on päivitetty vähentämään riskejä (esim. synkroniset IPC-kutsut poistettu, lisätty sulkemishandshake ja rajoitettu preload). Ennen jakelua suositeltavaa tehdä seuraavat tarkistukset:

1. Testaa tuotantorakennus UI:n kanssa:

```bash
npm install
npm run build
# Avaa dist/index.html selaimessa tai asenna tuotettu asennin
```

2. Varmista, että `index.html` sisältää tiukan CSP:n tuotantoon. Poista kehityksen `unsafe-inline`-käytöt ja varmista, että kaikki tyylit ovat bundlattu tiedostoissa.

3. Testaa sulkeminen ja uudelleenkäynnistys varmistaaksesi tapahtumien säilymisen.

4. Aja `npm audit` ja päivitä haavoittuvuudet; käytä myös SCA-työkaluja (Snyk/Dependabot) jos mahdollista.

5. Signeeraa Windows-installer ennen julkaisua — ilman signeerausta käyttäjät saattavat saada varoituksia.

6. Testaa asentaminen ja poistaminen puhtaassa VM:ssä tai erillisellä käyttäjätilillä.

Tarvittaessa autan automatisoimaan buildin ja signeerauksen CI:ssä.

---

Seuraavaksi alkuperäinen englanninkielinen dokumentaatio (yllä) jatkuu tiedoston loppuosassa, jos tarvitset lisätietoja Vite/ESLint-pluginien asetuksista.

