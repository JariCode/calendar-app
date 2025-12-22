// Sovelluksen käynnistys (entry point)
// Tässä tiedostossa React-sovellus kytketään DOM:iin ja renderöidään root-elementtiin.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
