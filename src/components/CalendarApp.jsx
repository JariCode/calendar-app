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
    const [eventEndTime, setEventEndTime] = useState({ hours: '', minutes: '' });
    const [eventEndDate, setEventEndDate] = useState(null);
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
            // aloitusaika valinnaiseksi: oletuksena tyhjä, aktivoituu kun käyttäjä syöttää
            setEventTime({ hours: '', minutes: '' });
            // by default leave end time/date empty (optional)
            setEventEndTime({ hours: '', minutes: '' });
            setEventEndDate(null);
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
        const startDate = new Date(selectedDate);
        const startTimeMinutes = (parseInt(eventTime.hours || '0', 10) * 60) + parseInt(eventTime.minutes || '0', 10);
        // Determine whether user provided an end time (optional)
        const hasEndTime = (eventEndTime.hours !== '' || eventEndTime.minutes !== '');
        let endDateFinal = null;
        let endTimeFinal = null;

        if (hasEndTime) {
            let endDateObj = eventEndDate ? new Date(eventEndDate) : new Date(startDate);
            const endTimeMinutes = (parseInt(eventEndTime.hours || '0', 10) * 60) + parseInt(eventEndTime.minutes || '0', 10);
            // If end is before start, snap end to start
            if (endDateObj < startDate || (endDateObj.getTime() === startDate.getTime() && endTimeMinutes < startTimeMinutes)) {
                endDateObj = new Date(startDate);
            }
            endDateFinal = endDateObj;
            endTimeFinal = `${String(eventEndTime.hours).padStart(2, '0')}:${String(eventEndTime.minutes).padStart(2, '0')}`;
        }

        const hasStartTime = (eventTime.hours !== '' || eventTime.minutes !== '');
        const timeFinal = hasStartTime ? `${String(eventTime.hours).padStart(2, '0')}:${String(eventTime.minutes).padStart(2, '0')}` : null;

        const newEvent = {
            id: editingEvent ? editingEvent.id : Date.now(),
            date: startDate,
            time: timeFinal,
            endDate: endDateFinal,
            endTime: endTimeFinal,
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
        setEventTime({ hours: '', minutes: '' });
        setEventEndTime({ hours: '', minutes: '' });
        setEventEndDate(null);
        setEventText('');
        setShowEventPopup(false);
        setEditingEvent(null);
    }

    const handleEventEdit = (event) => {
        setSelectedDate(new Date(event.date))
        // Prefill start time only if event has one (optional)
        if (event.time) {
            setEventTime({
                hours: event.time.split(':')[0],
                minutes: event.time.split(':')[1]
            });
        } else {
            setEventTime({ hours: '', minutes: '' });
        }
        // If event has endTime, populate; otherwise leave empty (optional)
        if (event.endTime) {
            setEventEndTime({
                hours: event.endTime.split(':')[0],
                minutes: event.endTime.split(':')[1]
            });
            setEventEndDate(event.endDate ? new Date(event.endDate) : new Date(event.date));
        } else {
            setEventEndTime({ hours: '', minutes: '' });
            setEventEndDate(null);
        }
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

    const handleEndTimeChange = (e) => {
        const { name, value } = e.target;
        setEventEndTime((prevTime) => ({
            ...prevTime,
            [name]: value.padStart(2, '0')
        }));
    }

    const handleEndDatePartChange = (e) => {
        const { name, value } = e.target;
        const num = parseInt(value || '0', 10);
        const base = eventEndDate ? new Date(eventEndDate) : new Date(selectedDate);
        if (isNaN(num)) return;
        if (name === 'day') base.setDate(Math.max(1, Math.min(31, num)));
        if (name === 'month') base.setMonth(Math.max(1, Math.min(12, num)) - 1);
        if (name === 'year') base.setFullYear(num);
        setEventEndDate(base);
    }

    // --- Persistence: load from Electron IPC or localStorage, save debounced ---
    const saveTimer = useRef(null);

    useEffect(() => {
        const load = async () => {
                try {
                    if (window?.electronAPI?.loadEvents) {
                        const loaded = await window.electronAPI.loadEvents();
                        if (Array.isArray(loaded)) {
                            const parsed = loaded.map(e => ({ ...e,
                                date: e.date ? new Date(e.date) : new Date(),
                                endDate: e.endDate ? new Date(e.endDate) : null,
                                endTime: e.endTime ?? null
                            }));
                            setEvents(parsed);
                            return;
                        }
                    }
            } catch (err) {
                console.error('Electron load failed:', err);
            }

            // Only use localStorage fallback when NOT running inside Electron (web build)
            if (!window?.electronAPI?.loadEvents) {
                try {
                    const raw = localStorage.getItem('calendarEvents');
                    if (raw) {
                        const parsed = JSON.parse(raw).map(e => ({ ...e,
                            date: new Date(e.date),
                            endDate: e.endDate ? new Date(e.endDate) : null,
                            endTime: e.endTime ?? null
                        }));
                        setEvents(parsed);
                    }
                } catch (err) {
                    console.error('localStorage load failed:', err);
                }
            }
        }
        load();
    }, []);

    useEffect(() => {
        // always save to localStorage as a fallback/persistence for web
        try {
            const serializable = events.map(e => ({ ...e,
                date: e.date instanceof Date ? e.date.toISOString() : e.date,
                endDate: e.endDate instanceof Date ? e.endDate.toISOString() : e.endDate ?? null,
                endTime: e.endTime ?? null
            }));
            localStorage.setItem('calendarEvents', JSON.stringify(serializable));
        } catch (err) {
            console.error('localStorage save failed:', err);
        }

        // If Electron available, save via IPC debounced
        if (!window?.electronAPI?.saveEvents) return;

        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                const serializable = events.map(e => ({ ...e,
                    date: e.date instanceof Date ? e.date.toISOString() : e.date,
                    endDate: e.endDate instanceof Date ? e.endDate.toISOString() : e.endDate ?? null,
                    endTime: e.endTime ?? null
                }));
                await window.electronAPI.saveEvents(serializable);
            } catch (err) {
                console.error('Electron save failed:', err);
            }
        }, 700);

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        }
    }, [events]);

    // Graceful shutdown: register a handler invoked by main when it's about
    // to close the window. We save asynchronously and then signal readiness.
    const eventsRef = useRef(events);
    useEffect(() => { eventsRef.current = events; }, [events]);

    useEffect(() => {
        if (!window?.electronAPI?.onPrepareToClose) return;
        const unsubscribe = window.electronAPI.onPrepareToClose(async () => {
            try {
                const serializable = eventsRef.current.map(e => ({ ...e,
                    date: e.date instanceof Date ? e.date.toISOString() : e.date,
                    endDate: e.endDate instanceof Date ? e.endDate.toISOString() : e.endDate ?? null,
                    endTime: e.endTime ?? null
                }));
                if (window?.electronAPI?.saveEvents) {
                    await window.electronAPI.saveEvents(serializable);
                }
            } catch (err) {
                console.error('shutdown save failed:', err);
            } finally {
                try { window.electronAPI.signalReadyToClose(); } catch (e) {}
            }
        });

        return () => { try { unsubscribe(); } catch (e) {} };
    }, []);

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
                <div className="event-popup-time">Alku</div>
                {/* Tunnit ja minuutit: numeroinputit */}
                <input type="number" name="hours" min={0} max={24} className="hours" placeholder="tun" value={eventTime.hours} 
                onChange={handleTimeChange} />
                <input type="number" name="minutes" min={0} max={60} className="minutes" placeholder="min" value={eventTime.minutes} 
                onChange={handleTimeChange}/>
            </div>
            <div className="time-input">
                <div className="event-popup-time">Loppu</div>
                    <input type="number" name="hours" min={0} max={24} className="hours" placeholder="tun" value={eventEndTime.hours} 
                    onChange={handleEndTimeChange} />
                    <input type="number" name="minutes" min={0} max={60} className="minutes" placeholder="min" value={eventEndTime.minutes} 
                    onChange={handleEndTimeChange}/>
            </div>
            <div className="time-input">
                <div className="event-popup-time" style={{ visibility: 'hidden' }}>spacer</div>
                <div className="date-controls">
                    <input type="number" name="day" min={1} max={31} className="hours" placeholder="pv" value={eventEndDate ? String(eventEndDate.getDate()).padStart(2, '0') : ''} onChange={handleEndDatePartChange} />
                    <input type="number" name="month" min={1} max={12} className="minutes" placeholder="kk" value={eventEndDate ? String(eventEndDate.getMonth() + 1).padStart(2, '0') : ''} onChange={handleEndDatePartChange} />
                    <input type="number" name="year" min={1970} max={9999} className="year-input" placeholder="vvvv" value={eventEndDate ? String(eventEndDate.getFullYear()) : ''} onChange={handleEndDatePartChange} />
                </div>
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
        {events.map((event, index) => {
            const start = new Date(event.date);
            const end = event.endDate ? new Date(event.endDate) : null;
            const sameDay = end ? (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && start.getDate() === end.getDate()) : false;
            return (
            <div className="event" key={index}>
                <div className="event-date-wrapper">
                    {/** If no end date or end is same day -> show one date then time range */}
                    {(!end || sameDay) && (
                        <>
                            <div className="event-date">{`${monthsOfYear[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`}</div>
                            <div className="event-time">
                                {/** If both start and end on same day and both times exist, show range; otherwise show whichever exists */}
                                {end && sameDay ? (
                                    (event.time && event.endTime) ? `${event.time}-${event.endTime}` : (event.endTime || event.time || '')
                                ) : (
                                    event.time || ''
                                )}
                            </div>
                        </>
                    )}

                    {/** If end date exists and is different day -> show start date/time and end date/time on separate rows with dashes */}
                    {end && !sameDay && (
                        <>
                            <div className="event-date">{`${monthsOfYear[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`}</div>
                            <div className="event-time">{event.time ? `${event.time}-` : ''}</div>
                            <div className="event-date">{`${monthsOfYear[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`}</div>
                            <div className="event-time">{event.endTime ? `-${event.endTime}` : ''}</div>
                        </>
                    )}
                </div>
                <div className="event-text">{event.text}</div>
                <div className="event-buttons">
                    <i className="bx bxs-edit-alt" onClick={() => handleEventEdit(event)}></i>
                    <i className="bx bxs-message-alt-x" onClick={() => handleDeleteEvent(event.id)}></i>
                </div>
            </div>
            )
        })}
    </div>
  </div>
}

export default CalendarApp