// Pääsovelluskomponentti
// Tämä tiedosto renderöi `CalendarApp`-komponentin keskeiseen kontaineriin.
import CalendarApp from "./components/CalendarApp"
import './components/CalendarApp.css'

const App = () => {
  // `container`-luokka keskittää koko sovelluksen näkymän
  return (
    <div className="container">
      <CalendarApp />
    </div>
  )
}

export default App