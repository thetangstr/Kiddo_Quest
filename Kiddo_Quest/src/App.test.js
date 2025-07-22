import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  // App should render loading state initially, then login view
  expect(document.body).toBeInTheDocument();
});

test('shows loading state initially', async () => {
  render(<App />);
  
  // Check for loading indicator
  const loadingElement = screen.getByText(/loading/i);
  expect(loadingElement).toBeInTheDocument();
});
