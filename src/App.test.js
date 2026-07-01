import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateForDay(dayNumber) {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth(), 1);

  while (date.getDay() !== dayNumber) {
    date.setDate(date.getDate() + 1);
  }

  const value = toDateInputValue(date);
  const label = new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return { value, label };
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the career readiness registration page', () => {
  render(<App />);
  expect(screen.getByLabelText(/^first name/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
});

test('shows two additional non-friday date slots for weekday schedules', () => {
  const tuesday = getDateForDay(2);

  render(<App />);

  expect(
    screen.queryByRole('button', { name: /second class date/i, hidden: true })
  ).not.toBeInTheDocument();

  fireEvent.click(
    screen.getByRole('button', {
      name: /which career readiness date/i,
      hidden: true,
    })
  );
  fireEvent.click(screen.getByRole('button', { name: tuesday.label, hidden: true }));

  expect(screen.getByText(/second class date/i, { hidden: true })).toBeInTheDocument();
  expect(screen.getByText(/third class date/i, { hidden: true })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /second class date/i, hidden: true })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /third class date/i, hidden: true })
  ).toBeInTheDocument();
});

test('submits the registration to the backend', async () => {
  jest.spyOn(window, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      hubspotContactSynced: true,
      hubspotSyncAction: 'updated',
    }),
  });

  render(<App />);

  fireEvent.change(screen.getByLabelText(/^first name/i), {
    target: { value: 'Ken' },
  });
  fireEvent.change(screen.getByLabelText(/^last name/i), {
    target: { value: 'Smith' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: /^email \*/i }), {
    target: { value: 'ken@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/^phone number/i), {
    target: { value: '555-555-5555' },
  });
  fireEvent.change(screen.getByLabelText(/zip code/i), {
    target: { value: '40202' },
  });
  fireEvent.change(screen.getByLabelText(/unemployment status/i), {
    target: { value: 'Dislocated Worker' },
  });
  fireEvent.change(screen.getByLabelText(/kentucky county/i), {
    target: { value: 'Warren' },
  });
  fireEvent.click(screen.getByLabelText(/consent to receive automated marketing/i));
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(window.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/bookings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          firstname: 'Ken',
          lastname: 'Smith',
          email: 'ken@example.com',
          phone: '555-555-5555',
          zip: '40202',
          are_you_unemployed: 'Dislocated Worker',
          which_kentucky_county_do_you_live_in: 'Warren',
          opt_in_check_for_emailing_texting_applicants: true,
          which_career_readiness_date_are_you_interested_in_attending_work: '',
          choose_the_2nd_date_for_your_career_readiness_class_work: '',
          choose_the_3rd_date_for_your_career_readiness_class_work: '',
        }),
      })
    );
  });
});
