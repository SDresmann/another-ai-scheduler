import { useState } from 'react';
import './App.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://dw-ai-scheduler-backend.onrender.com'
    : 'http://localhost:5000');

const DATE_PICKERS_VISIBLE = true;

const UNEMPLOYMENT_STATUS_OPTIONS = [
  'Dislocated Worker',
  'Fired or Terminated',
  'First Time Job Seeker',
  'Position Eliminated',
  'Voluntarily Left Previous Job',
];

const KENTUCKY_COUNTY_OPTIONS = [
  'Warren',
  'Logan',
  'Metcalfe',
  'Barren',
  'Edmonson',
  'Hart',
  'Monroe',
  'Allen',
  'Butler',
  'Simpson',
  'Other',
];

function FormField({
  label,
  required = false,
  className = '',
  htmlFor,
  children,
}) {
  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <div className="form-field-label">
          {htmlFor ? (
            <label htmlFor={htmlFor}>
              {label} {required && <span className="required">*</span>}
            </label>
          ) : (
            <span>
              {label} {required && <span className="required">*</span>}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function getDayNumber(dateValue) {
  if (!dateValue) return null;
  return new Date(`${dateValue}T12:00:00`).getDay();
}

function isWednesday(dateValue) {
  return getDayNumber(dateValue) === 3;
}

function isFriday(dateValue) {
  return getDayNumber(dateValue) === 5;
}

function isAvailableClassDay(dateValue) {
  return isWednesday(dateValue) || isFriday(dateValue);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function formatDateForDisplay(dateValue) {
  if (!dateValue) return '';

  return new Date(`${dateValue}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isUnavailableDate(dateValue) {
  return !isAvailableClassDay(dateValue);
}

function DatePicker({
  label,
  name,
  value,
  onChange,
  required,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const startingDate = value ? new Date(`${value}T12:00:00`) : new Date();
    return new Date(startingDate.getFullYear(), startingDate.getMonth(), 1);
  });
  const monthDays = getMonthDays(visibleMonth);
  const monthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const changeMonth = (direction) => {
    setVisibleMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1)
    );
  };

  const selectDate = (date) => {
    onChange({ target: { value: toDateInputValue(date) } });
    setIsOpen(false);
  };

  return (
    <FormField
      label={label}
      required={required}
      className="date-picker"
    >
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className={`date-picker-trigger${value ? '' : ' placeholder'}`}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-label={label}
      >
        {value ? formatDateForDisplay(value) : 'Please Select'}
      </button>

      {isOpen && (
        <div className="calendar-panel">
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              ‹
            </button>
            <strong>{monthLabel}</strong>
            <button
              type="button"
              className="calendar-nav"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="calendar-grid">
            {monthDays.map((date, index) => {
              if (!date) {
                return <span key={`empty-${index}`} className="calendar-empty" />;
              }

              const dateValue = toDateInputValue(date);
              const unavailable = isUnavailableDate(dateValue);
              const selected = value === dateValue;

              return (
                <button
                  key={dateValue}
                  type="button"
                  className={`calendar-day${unavailable ? ' unavailable' : ''}${
                    selected ? ' selected' : ''
                  }`}
                  disabled={unavailable}
                  onClick={() => selectDate(date)}
                  aria-label={formatDateForDisplay(dateValue)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </FormField>
  );
}

function App() {
  const [selectedDates, setSelectedDates] = useState({
    first: '',
    second: '',
    third: '',
  });
  const [submissionStatus, setSubmissionStatus] = useState({
    type: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const resetRegistration = () => {
    setIsSubmitted(false);
    setSubmissionStatus({ type: '', message: '' });
    setSelectedDates({ first: '', second: '', third: '' });
    setFormKey((currentKey) => currentKey + 1);
  };

  const handleFirstDateChange = (event) => {
    setSelectedDates({
      first: event.target.value,
      second: '',
      third: '',
    });
  };

  const validateSelectedDates = () => {
    if (!DATE_PICKERS_VISIBLE) {
      return '';
    }

    if (!selectedDates.first) {
      return 'Please choose a workshop date.';
    }

    if (!isAvailableClassDay(selectedDates.first)) {
      return 'Please choose a Wednesday or Friday workshop date.';
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
      firstname: formData.get('firstname'),
      lastname: formData.get('lastname'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      zip: formData.get('zip'),
      are_you_unemployed: formData.get('are_you_unemployed'),
      which_kentucky_county_do_you_live_in: formData.get('which_kentucky_county_do_you_live_in'),
      opt_in_check_for_emailing_texting_applicants:
        formData.get('opt_in_check_for_emailing_texting_applicants') === 'on',
      class_date: selectedDates.first,
    };

    setIsSubmitting(true);
    setSubmissionStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
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

      await response.json();

      form.reset();
      setSelectedDates({ first: '', second: '', third: '' });
      setIsSubmitted(true);
      setSubmissionStatus({ type: '', message: '' });
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
        {isSubmitted ? (
          <section className="thank-you-card">
            <h1>Thank you!</h1>
            <p>We received your registration.</p>
            <button
              type="button"
              className="submit-button"
              onClick={resetRegistration}
            >
              Register again
            </button>
          </section>
        ) : (
        <form
          key={formKey}
          className="registration-form"
          onSubmit={handleSubmit}
        >
          <div className="form-row">
            <FormField
              label="First name"
              htmlFor="firstname"
              required
            >
              <input id="firstname" type="text" name="firstname" required />
            </FormField>

            <FormField
              label="Last name"
              htmlFor="lastname"
              required
            >
              <input id="lastname" type="text" name="lastname" required />
            </FormField>
          </div>

          <FormField label="Email" htmlFor="email" required>
            <input id="email" type="email" name="email" required />
          </FormField>

          <div className="form-row">
            <FormField
              label="Phone number"
              htmlFor="phone"
              required
            >
              <input id="phone" type="tel" name="phone" required />
            </FormField>

            <FormField label="Zip code" htmlFor="zip" required>
              <input id="zip" type="text" name="zip" required />
            </FormField>
          </div>

          <FormField
            label="What is your unemployment status?"
            htmlFor="are_you_unemployed"
            required
          >
            <select
              id="are_you_unemployed"
              name="are_you_unemployed"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Please Select
              </option>
              {UNEMPLOYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Which Kentucky county do you live in?"
            htmlFor="which_kentucky_county_do_you_live_in"
            required
          >
            <select
              id="which_kentucky_county_do_you_live_in"
              name="which_kentucky_county_do_you_live_in"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Please Select
              </option>
              {KENTUCKY_COUNTY_OPTIONS.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </FormField>

          <div
            className={`date-picker-section${
              DATE_PICKERS_VISIBLE ? '' : ' date-picker-section--hidden'
            }`}
            aria-hidden={DATE_PICKERS_VISIBLE ? undefined : true}
          >
            <DatePicker
              label="Which Career Readiness Date Are You Interested in Attending?"
              name="class_date"
              value={selectedDates.first}
              onChange={handleFirstDateChange}
              required={DATE_PICKERS_VISIBLE}
            />
          </div>

          <FormField className="consent-field">
            <div className="consent-row">
              <input
                type="checkbox"
                id="marketing-consent"
                name="opt_in_check_for_emailing_texting_applicants"
                required
              />
              <label htmlFor="marketing-consent" className="consent-copy">
                I consent to receive automated marketing emails and text messages
                from Kable Academy dba Kable Academy and Favored Staffing at the
                phone number and email I provided above, including pre-recorded
                messages and calls and text messages from automatic dialing
                systems. You can reply STOP to cancel text messages at any time
                and click UNSUBSCRIBE in any email. Carrier message and data
                rates may apply.
              </label>
            </div>
          </FormField>

          {submissionStatus.message && (
            <p className={`form-message ${submissionStatus.type}`}>
              {submissionStatus.message}
            </p>
          )}

          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
        )}
      </main>
    </div>
  );
}

export default App;
