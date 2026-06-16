import { useState } from 'react';
import './App.css';

const API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api/bookings';

const weekdayDateOptions = [
  { value: '2026-06-23', day: 'tuesday', label: 'Tuesday | 5pm-6pm' },
  { value: '2026-06-24', day: 'wednesday', label: 'Wednesday | 5pm-6pm' },
  { value: '2026-06-25', day: 'thursday', label: 'Thursday | 5pm-6pm' },
];

const fridayFastTrackOption = {
  value: '2026-06-26',
  day: 'friday',
  label: 'Friday | 2pm-5pm',
};

const datePickerMin = weekdayDateOptions[0].value;
const datePickerMax = fridayFastTrackOption.value;

function getDayNumber(dateValue) {
  if (!dateValue) return null;
  return new Date(`${dateValue}T12:00:00`).getDay();
}

function isTuesdayThroughThursday(dateValue) {
  const dayNumber = getDayNumber(dateValue);
  return dayNumber >= 2 && dayNumber <= 4;
}

function isFriday(dateValue) {
  return getDayNumber(dateValue) === 5;
}

function getRemainingWeekdayDates(firstDate) {
  return weekdayDateOptions
    .filter((option) => option.value !== firstDate)
    .map((option) => option.value);
}

function App() {
  const [selectedDates, setSelectedDates] = useState({
    first: fridayFastTrackOption.value,
    second: '',
    third: '',
  });
  const [submissionStatus, setSubmissionStatus] = useState({
    type: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWeekdaySchedule = isTuesdayThroughThursday(selectedDates.first);

  const handleFirstDateChange = (event) => {
    const first = event.target.value;

    if (isFriday(first)) {
      setSelectedDates({ first, second: '', third: '' });
      return;
    }

    if (!isTuesdayThroughThursday(first)) {
      setSelectedDates({ first, second: '', third: '' });
      return;
    }

    const remainingWeekdays = getRemainingWeekdayDates(first);

    setSelectedDates({
      first,
      second: remainingWeekdays[0],
      third: remainingWeekdays[1],
    });
  };

  const handleAdditionalDateChange = (slotName) => (event) => {
    setSelectedDates((currentDates) => ({
      ...currentDates,
      [slotName]: event.target.value,
    }));
  };

  const validateSelectedDates = () => {
    if (!selectedDates.first) {
      return 'Please choose a workshop date.';
    }

    if (isFriday(selectedDates.first)) {
      return '';
    }

    if (!isTuesdayThroughThursday(selectedDates.first)) {
      return 'Please choose a Tuesday, Wednesday, Thursday, or Friday workshop date.';
    }

    const weekdayDates = [
      selectedDates.first,
      selectedDates.second,
      selectedDates.third,
    ];

    if (weekdayDates.some((date) => !date)) {
      return 'Please choose all three weekday class dates.';
    }

    if (weekdayDates.some(isFriday)) {
      return 'Friday can only be selected for the Friday Fast Track schedule.';
    }

    if (weekdayDates.some((date) => !isTuesdayThroughThursday(date))) {
      return 'Weekday classes must be Tuesday, Wednesday, and Thursday only.';
    }

    if (new Set(weekdayDates).size !== weekdayDates.length) {
      return 'Please choose each weekday class date only once.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const dateError = validateSelectedDates();
    if (dateError) {
      setSubmissionStatus({ type: 'error', message: dateError });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phoneNumber: formData.get('phone'),
      date: selectedDates.first,
      workshopDate: selectedDates.first,
      secondWorkshopDate: isWeekdaySchedule ? selectedDates.second : '',
      thirdWorkshopDate: isWeekdaySchedule ? selectedDates.third : '',
    };

    setIsSubmitting(true);
    setSubmissionStatus({ type: '', message: '' });

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Unable to submit registration.');
      }

      form.reset();
      setSelectedDates({ first: fridayFastTrackOption.value, second: '', third: '' });
      setSubmissionStatus({
        type: 'success',
        message: "You're registered! We'll send your session details soon.",
      });
    } catch (error) {
      setSubmissionStatus({
        type: 'error',
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <main className="registration-card">
        <section className="intro-section" aria-labelledby="page-title">
          <h1 id="page-title">Reserve Your Spot!</h1>

          <p>Ready to gain the skills employers are looking for?</p>

          <p>
            This free Career Readiness Workshop is designed to help you stand
            out when applying for summer jobs, part-time work, internships, or
            your first full-time career opportunity.
          </p>

          <p>During this interactive session, you'll learn:</p>

          <ul>
            <li>AI-powered job search strategies</li>
            <li>Resume tips that help you get noticed</li>
            <li>Interview techniques to build confidence</li>
            <li>Professional workplace and communication skills</li>
            <li>How to create a clear plan for your future career path</li>
          </ul>

          <h2>Choose the Schedule That Works Best for You</h2>

          <div className="schedule-block">
            <h3>Option 1: Attend One Class Per Day</h3>
            <p>
              Join us Tuesday, Wednesday, and Thursday from{' '}
              <strong>5:00 PM-6:00 PM ET.</strong> Each session focuses on a
              different career readiness skill:
            </p>
            <ul>
              <li>
                <strong>Tuesday:</strong> AI-Powered Job Search Foundations
              </li>
              <li>
                <strong>Wednesday:</strong> Interviewing &amp; Getting the
                Offer
              </li>
              <li>
                <strong>Thursday:</strong> Digital Workforce Skills
              </li>
            </ul>
          </div>

          <div className="schedule-block">
            <h3>Option 2: Friday Fast Track</h3>
            <p>
              Can't attend during the week? Complete all three classes in a
              single session on <strong>Friday from 2:00 PM-5:00 PM ET.</strong>
            </p>
          </div>

          <p className="reminder-copy">
            Once you register, we'll send your session details and reminders by
            email and text.
          </p>
        </section>

        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              <span>
                First name <b>*</b>
              </span>
              <input type="text" name="firstName" required />
            </label>

            <label>
              <span>
                Last name <b>*</b>
              </span>
              <input type="text" name="lastName" required />
            </label>
          </div>

          <label>
            <span>
              Email <b>*</b>
            </span>
            <input type="email" name="email" required />
          </label>

          <label>
            <span>
              Phone number <b>*</b>
            </span>
            <input type="tel" name="phone" required />
          </label>

          <label>
            <span>
              Which Career Readiness Date Are You Interested in Attending?{' '}
              <b>*</b>
            </span>
            <input
              type="date"
              name="workshopDate"
              value={selectedDates.first}
              onChange={handleFirstDateChange}
              min={datePickerMin}
              max={datePickerMax}
              required
            />
          </label>

          {isWeekdaySchedule && (
            <div className="additional-date-slots">
              <p>
                Since you selected the one-class-per-day schedule, choose your
                other two class dates below.
              </p>

              <div className="form-row">
                <label>
                  <span>
                    Second class date <b>*</b>
                  </span>
                  <input
                    type="date"
                    name="secondWorkshopDate"
                    value={selectedDates.second}
                    onChange={handleAdditionalDateChange('second')}
                    min={datePickerMin}
                    max={datePickerMax}
                    required
                  />
                </label>

                <label>
                  <span>
                    Third class date <b>*</b>
                  </span>
                  <input
                    type="date"
                    name="thirdWorkshopDate"
                    value={selectedDates.third}
                    onChange={handleAdditionalDateChange('third')}
                    min={datePickerMin}
                    max={datePickerMax}
                    required
                  />
                </label>
              </div>
            </div>
          )}

          {submissionStatus.message && (
            <p className={`form-message ${submissionStatus.type}`}>
              {submissionStatus.message}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
