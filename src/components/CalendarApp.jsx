import { useState } from "react";

const CalendarApp = () => {
    const daysOfWeek = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
    const monthsOfYear = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];

    const currentDate = new Date();

    const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
    const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Jos viikko alkaa maanantaista (sunnuntain sijaan), säädä alkavat tyhjät solut.
    // Tarkista `daysOfWeek`-taulukon ensimmäinen merkintä; jos se on 'Ma', käytä maanantaita viikon aloituspäivänä.
    const weekStartIndex = daysOfWeek[0] === 'Ma' ? 1 : 0; // 0 = sunnuntai, 1 = maanantai
    const leadingEmptyDays = (firstDayMonth - weekStartIndex + 7) % 7;

    const prevMonth = () => {
        setCurrentMonth(prevMonth => (prevMonth === 0 ? 11 : prevMonth - 1));
        setCurrentYear(prevYear => (currentMonth === 0 ? prevYear - 1 : prevYear));
    }

      const nextMonth = () => {
        setCurrentMonth(prevMonth => (prevMonth === 11 ? 0 : prevMonth + 1));
        setCurrentYear(prevYear => (currentMonth === 11 ? prevYear + 1 : prevYear));
    }

  return <div className="calendar-app">
    <div className="calendar">
        <h1 className="heading">Kalenteri</h1>
        <div className="navigate-date">
            <h2 className="month">{monthsOfYear[currentMonth]}</h2>
            <h2 className="year">{currentYear}</h2>
            <div className="buttons">
                <i className='bx bx-chevron-left' onClick={prevMonth}></i>
                <i className='bx bx-chevron-right' onClick={nextMonth}></i>
            </div>
        </div>
        <div className="weekdays">
            {daysOfWeek.map(day => <span key={day}>{day}</span>)}
        </div>
        <div className="days">
            {[...Array(leadingEmptyDays).keys()].map((_, index) => <span key={`empty-${index}`}/>)}
            {[...Array(daysInMonth).keys()].map(day => 
            <span key={day + 1} className={day + 1 === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear() ? "current-day" : ""}>
            {day + 1}</span>)}
        </div>
    </div>
    <div className="events">
        <div className="event-popup">
            <div className="time-input">
                <div className="event-popup-time">Aika</div>
                <input type="number" name="hours" min={0} max={24} className="hours"/>
                <input type="number" name="minutes" min={0} max={60} className="minutes"/>
            </div>
            <textarea placeholder="Enter Event Text (Maximum 60 characters)"></textarea>
            <button className="event-popup-btn">Add Event</button>
            <button className="close-event-popup">
                <i className='bx bx-x'></i>
            </button>
        </div>
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