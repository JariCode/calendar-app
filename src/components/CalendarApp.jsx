import { useState, useEffect, useRef } from "react";

/*
    CalendarApp.jsx
    --------------------
    Pääkomponentti, joka näyttää kuukausikalenterin, viikonpäivät ja
    tapahtumalistan. Sisältää logiikan päivien valintaan, tapahtuman
    lisäämiseen, muokkaamiseen ja poistamiseen.

    Kommentit tiedostossa selittävät tilamuuttujia ja funktioita suomeksi.
*/
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
    const [events, setEvents] = useState([]);
    const [eventTime, setEventTime] = useState({ hours: '', minutes: '' });
    const [eventText, setEventText] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);

    // Komponentin tila: valittu kuukausi/vuosi/päivä ja tapahtumiin liittyvät arvot
    // - `currentMonth` / `currentYear`: mitä kuukautta näytetään
    // - `selectedDate`: käyttäjän valitsema päivämäärä tapahtuman lisäystä varten
    // - `showEventPopup`: näyttääkö tapahtuman lisäys-/muokkaus-ikkunan
    // - `events`: sovelluksen tapahtumalista (taulukko)
    // - `eventTime` / `eventText`: lomakekenttien sisältö
    // - `editingEvent`: jos muokataan olemassa olevaa tapahtumaa, sen tiedot tässä

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

    // Navigointifunktiot: siirtyminen edelliseen / seuraavaan kuukauteen
    const nextMonth = () => {
        setCurrentMonth(prevMonth => (prevMonth === 11 ? 0 : prevMonth + 1));
        setCurrentYear(prevYear => (currentMonth === 11 ? prevYear + 1 : prevYear));
    }

    const handleDayClick = (day) => {
        const clickedDate = new Date(currentYear, currentMonth, day);
        const today = new Date();

        if(clickedDate >= today || isSameDay(clickedDate, today)) {
            setSelectedDate(clickedDate);
            setShowEventPopup(true);
            setEventTime({ hours: '00', minutes: '00' });
            setEventText('');
            setEditingEvent(null);
        }
    }

    // Apufunktio: tarkistaa ovatko kaksi päivämäärää sama päivä
    const isSameDay = (date1, date2) => {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }

    const handleEventSubmit = () => {
        const newEvent = {
            id: editingEvent ? editingEvent.id : Date.now(),
            date: selectedDate,
            time: `${eventTime.hours.padStart(2, '0')}:${eventTime.minutes.padStart(2, '0')}`,
            text: eventText
        }

        let updatedEvents = [...events];
        if(editingEvent) {
            updatedEvents = updatedEvents.map((event) => 
            event.id === editingEvent.id ? newEvent : event
            )
        } else {
            updatedEvents.push(newEvent);
        }

        updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        setEvents(updatedEvents);
        setEventTime({ hours: '00', minutes: '00' });
        setEventText('');
        setShowEventPopup(false);
        setEditingEvent(null);
    }

    const handleEventEdit = (event) => {
        setSelectedDate(new Date(event.date))
        setEventTime({
            hours: event.time.split(':')[0],
            minutes: event.time.split(':')[1]
        });
        setEventText(event.text);
        setEditingEvent(event);
        setShowEventPopup(true);
    };

    // Avaa olemassa olevan tapahtuman muokkausta varten ja täyttää lomakkeen
    const handleDeleteEvent = (eventId) => {
        const updatedEvents = events.filter((event) => event.id !== eventId);
        setEvents(updatedEvents);
    }

    // Poistaa tapahtuman ID:llä
    const handleTimeChange = (e) => {
        const { name, value } = e.target;
        setEventTime((prevTime) => ({
            ...prevTime,
            [name]: value.padStart(2, '0')
        }));
    }

    // --- Persistence: load from Electron IPC or localStorage, save debounced ---
    const saveTimer = useRef(null);

    useEffect(() => {
        const load = async () => {
                try {
                    if (window?.electronAPI?.loadEvents) {
                        const loaded = await window.electronAPI.loadEvents();
                        if (Array.isArray(loaded)) {
                            const parsed = loaded.map(e => ({ ...e, date: e.date ? new Date(e.date) : new Date() }));
                            setEvents(parsed);
                            return;
                        }
                    }
            } catch (err) {
                console.error('Electron load failed:', err);
            }

            // Fallback: localStorage
            try {
                const raw = localStorage.getItem('calendarEvents');
                if (raw) {
                    const parsed = JSON.parse(raw).map(e => ({ ...e, date: new Date(e.date) }));
                    setEvents(parsed);
                }
            } catch (err) {
                console.error('localStorage load failed:', err);
            }
        }
        load();
    }, []);

    useEffect(() => {
        // always save to localStorage as a fallback/persistence for web
        try {
            const serializable = events.map(e => ({ ...e, date: e.date instanceof Date ? e.date.toISOString() : e.date }));
            localStorage.setItem('calendarEvents', JSON.stringify(serializable));
        } catch (err) {
            console.error('localStorage save failed:', err);
        }

        // If Electron available, save via IPC debounced
        if (!window?.electronAPI?.saveEvents) return;

        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                const serializable = events.map(e => ({ ...e, date: e.date instanceof Date ? e.date.toISOString() : e.date }));
                await window.electronAPI.saveEvents(serializable);
            } catch (err) {
                console.error('Electron save failed:', err);
            }
        }, 700);

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        }
    }, [events]);

    // Päivittää tunnit/minuutit lomakekentästä. Täyttää tarvittaessa 0:lla etunollat.
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
        {/* Tapahtuman lisäyspopup */}
        {showEventPopup && (
        <div className="event-popup">
            <div className="time-input">
                <div className="event-popup-time">Aika</div>
                {/* Tunnit ja minuutit: numeroinputit */}
                <input type="number" name="hours" min={0} max={24} className="hours" value={eventTime.hours} 
                onChange={handleTimeChange} />
                <input type="number" name="minutes" min={0} max={60} className="minutes" value={eventTime.minutes} 
                onChange={handleTimeChange}/>
            </div>
            {/* Tapahtuman teksti (max 60 merkkiä) */}
            <textarea placeholder="Kirjoita tapahtuman teksti (enintään 60 merkkiä)" value={eventText} 
            onChange={(e) => {
                if(e.target.value.length <= 60) {
                    setEventText(e.target.value);
                }
            }}>
            </textarea>
            <button className="event-popup-btn" onClick={handleEventSubmit}>
            {editingEvent ? "Tallenna muutokset" : "Lisää tapahtuma"}</button>
            <button className="close-event-popup" onClick={() => setShowEventPopup(false)}>
                <i className='bx bx-x'></i>
            </button>
        </div>
        )}
        {/* Esimerkki tapahtumasta näkyvillä listassa */}
        {events.map((event, index) => (
        <div className="event" key={index}>
            <div className="event-date-wrapper">
                <div className="event-date">{`${
                monthsOfYear[event.date.getMonth()]
                } ${event.date.getDate()}, ${event.date.getFullYear()}`}</div>
                <div className="event-time">{event.time}</div>
            </div>
            <div className="event-text">{event.text}</div>
            <div className="event-buttons">
                <i className="bx bxs-edit-alt" onClick={() => handleEventEdit(event)}></i>
                <i className="bx bxs-message-alt-x" onClick={() => handleDeleteEvent(event.id)}></i>
            </div>
        </div>
        ))}
    </div>
  </div>
}

export default CalendarApp