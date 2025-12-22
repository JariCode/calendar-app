/*
  App.jsx
  --------------------
  Pääsovelluskomponentti, joka toimii sovelluksen juurena.
  Tuo `CalendarApp`-komponentin ja sen tyylit ja sijoittaa ne
  keskitettyyn `container`-elementtiin. Tästä komponentista
  alkaa komponenttipuu, joka renderöidään DOM:iin `main.jsx`-tiedoston
  kautta.
*/
import CalendarApp from "./components/CalendarApp"
import './components/CalendarApp.css'

const App = () => {
  // Palauttaa yksinkertaisen kontainerin, joka keskittää sisällön
  return (
    <div className="container">
      <CalendarApp />
    </div>
  )
}

// Viedään komponentti oletusvientinä, jotta `main.jsx` voi käyttää sitä
export default App