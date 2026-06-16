import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the career readiness registration page', () => {
  render(<App />);
  expect(screen.getByText(/reserve your spot/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
});

test('shows two additional non-friday date slots for weekday schedules', () => {
  render(<App />);

  expect(screen.queryByLabelText(/second class date/i)).not.toBeInTheDocument();

  fireEvent.change(
    screen.getByLabelText(/which career readiness date/i),
    { target: { value: '2026-06-23' } }
  );

  const secondDate = screen.getByLabelText(/second class date/i);
  const thirdDate = screen.getByLabelText(/third class date/i);

  expect(secondDate).toBeInTheDocument();
  expect(thirdDate).toBeInTheDocument();
  expect(secondDate).not.toHaveValue('2026-06-26');
  expect(thirdDate).not.toHaveValue('2026-06-26');
});

test('submits the registration to the backend', async () => {
  jest.spyOn(window, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });

  render(<App />);

  fireEvent.change(screen.getByLabelText(/first name/i), {
    target: { value: 'Ken' },
  });
  fireEvent.change(screen.getByLabelText(/last name/i), {
    target: { value: 'Smith' },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'ken@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/phone number/i), {
    target: { value: '555-555-5555' },
  });

  fireEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(window.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/bookings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Ken',
          lastName: 'Smith',
          email: 'ken@example.com',
          phoneNumber: '555-555-5555',
          date: '2026-06-26',
          workshopDate: '2026-06-26',
          secondWorkshopDate: '',
          thirdWorkshopDate: '',
        }),
      })
    );
  });
});
