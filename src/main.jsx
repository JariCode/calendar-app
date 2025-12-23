/*
  main.jsx
  --------------------
  Sovelluksen entry point. Tämä tiedosto alustaa Reactin ja
  renderöi `App`-komponentin HTML-sivun `root`-elementtiin.
  - Käytetään `StrictMode`-komponenttia kehitysaikana auttamaan
    mahdollisten ongelmien havaitsemisessa.
  - `index.css` tuodaan tähän, jotta globaalit tyylit ovat voimassa.
*/
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Vendor CSS: import boxicons from node_modules so it's bundled by Vite (no CDN).
import 'boxicons/css/boxicons.min.css'
import App from './App.jsx'

// Etsitään root-elementti (index.html:ssa määritelty) ja renderöidään sovellus
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)