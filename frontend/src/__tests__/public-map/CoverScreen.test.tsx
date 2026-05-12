import { render, screen } from '@testing-library/react';
import { CoverScreen } from '../../components/public-map/CoverScreen';

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(new Date('2024-06-15T12:00:00Z'));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('CoverScreen', () => {
  it('should render couple names in heading', () => {
    render(<CoverScreen coupleName="Ana e João" startDate="2020-01-01" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Ana');
    expect(heading).toHaveTextContent('João');
  });

  it('should render opening phrase when provided', () => {
    render(
      <CoverScreen coupleName="Ana e João" startDate="2020-01-01" opening="Nossa história começa aqui" />,
    );
    expect(screen.getByText('Nossa história começa aqui')).toBeInTheDocument();
  });

  it('should not render opening phrase when not provided', () => {
    render(<CoverScreen coupleName="Ana e João" startDate="2020-01-01" />);
    expect(screen.queryByText('Nossa história começa aqui')).not.toBeInTheDocument();
  });

  it('should render relationship counter without crash', () => {
    render(<CoverScreen coupleName="Ana e João" startDate="2020-01-01" />);
    expect(screen.getByTestId('relationship-counter')).toBeInTheDocument();
  });

  it('should render pin anchor link', () => {
    render(<CoverScreen coupleName="Ana e João" startDate="2020-01-01" />);
    expect(screen.getByRole('link', { name: /toque pra começar/i })).toBeInTheDocument();
  });
});
