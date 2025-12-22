import { useState } from "react";

// Komponentti: CalendarApp
// Tämä tiedosto näyttää yksinkertaisen kalenterin ja tapahtumien listausalueen.
// Kommentit ovat suomeksi ja selittävät muuttujia ja osioita.
const CalendarApp = () => {
    // Viikonpäivien lyhenteet (suomeksi) ja kuukaudet taulukossa
    const daysOfWeek = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
    const monthsOfYear = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];

    // Nykyinen päivämäärä - käytetään korostamaan tämän päivän päivää
    const currentDate = new Date();

    // Komponentin tila: valittu kuukausi ja vuosi (aloitetaan nykyisestä)
    const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
    const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
    const [selectedDate, setSelectedDate] = useState(currentDate);
    const [showEventPopup, setShowEventPopup] = useState(false);    

    // Lasketaan valitun kuukauden päivämäärä ja kuukauden ensimmäisen päivän viikonpäivä
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Jos halutaan, että viikko alkaa maanantaista (taulukon ensimmäinen merkintä on 'Ma'),
    // täytyy säätää kuinka monta tyhjää solua renderöidään kuukauden alussa.
    const weekStartIndex = daysOfWeek[0] === 'Ma' ? 1 : 0; // 0 = sunnuntai, 1 = maanantai
    const leadingEmptyDays = (firstDayMonth - weekStartIndex + 7) % 7;

    // Funktiot vaihtaa edelliseen/seuraavaan kuukauteen päivittämällä tilaa
    const prevMonth = () => {
        setCurrentMonth(prevMonth => (prevMonth === 0 ? 11 : prevMonth - 1));
        setCurrentYear(prevYear => (currentMonth === 0 ? prevYear - 1 : prevYear));
    }

    const nextMonth = () => {
        setCurrentMonth(prevMonth => (prevMonth === 11 ? 0 : prevMonth + 1));
        setCurrentYear(prevYear => (currentMonth === 11 ? prevYear + 1 : prevYear));
    }

    const handleDayClick = (day) => {
        const clickedDate = new Date(currentYear, currentMonth, day);
        const today = new Date();

        if(clickedDate >= today) {
            setSelectedDate(clickedDate);
            setShowEventPopup(true);
        }
    }

  return <div className="calendar-app">
    {/* Vasemman puolen kalenteri */}
    <div className="calendar">
        {/* Otsikko */}
        <h1 className="heading">Kalenteri</h1>

        {/* Päivämääränavigointi: kuukauden nimi, vuosi ja nuolinapit */}
        <div className="navigate-date">
            <h2 className="month">{monthsOfYear[currentMonth]}</h2>
            <h2 className="year">{currentYear}</h2>
            <div className="buttons">
                {/* Edellinen kuukausi */}
                <i className='bx bx-chevron-left' onClick={prevMonth}></i>
                {/* Seuraava kuukausi */}
                <i className='bx bx-chevron-right' onClick={nextMonth}></i>
            </div>
        </div>

        {/* Viikonpäivät-rivi (Ma..Su) */}
        <div className="weekdays">
            {daysOfWeek.map(day => <span key={day}>{day}</span>)}
        </div>

        {/* Päivät-ruudukko: ensin tyhjät solut kuukauden alussa, sitten päivät 1..N */}
        <div className="days">
            {[...Array(leadingEmptyDays).keys()].map((_, index) => <span key={`empty-${index}`}/>)}
            {[...Array(daysInMonth).keys()].map(day => 
            <span key={day + 1} className={day + 1 === currentDate.getDate() &&
             currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear()
              ? "current-day" : ""
              } onClick={() => handleDayClick(day + 1)}>
            {day + 1}</span>)}
        </div>
    </div>

    {/* Oikean puolen tapahtuma-alue */}
    <div className="events">
        {/* Tapahtuman lisäyspopup (piilotettu CSS:llä oletuksena) */}
        {showEventPopup && (
        <div className="event-popup">
            <div className="time-input">
                <div className="event-popup-time">Aika</div>
                {/* Tunnit ja minuutit: numeroinputit */}
                <input type="number" name="hours" min={0} max={24} className="hours"/>
                <input type="number" name="minutes" min={0} max={60} className="minutes"/>
            </div>
            {/* Tapahtuman teksti (max 60 merkkiä) */}
            <textarea placeholder="Kirjoita tapahtuman teksti (enintään 60 merkkiä)"></textarea>
            <button className="event-popup-btn">Lisää tapahtuma</button>
            <button className="close-event-popup" onClick={() => setShowEventPopup(false)}>
                <i className='bx bx-x'></i>
            </button>
        </div>
        )}
        {/* Esimerkki tapahtumasta näkyvillä listassa */}
        <div className="event">
            <div className="event-date-wrapper">
                <div className="event-date">24 Joulukuu, 2025</div>
                <div className="event-time">10:00</div>
            </div>
            <div className="event-text">Tapaaminen Joulupukin kanssa</div>
            <div className="event-buttons">
                <i className="bx bxs-edit-alt"></i>
                <i className="bx bxs-message-alt-x"></i>
            </div>
        </div>
    </div>
  </div>
}

export default CalendarApp