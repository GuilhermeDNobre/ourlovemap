import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../components/ui/Toggle';

describe('Toggle', () => {
  it('should render unchecked by default', () => {
    render(<Toggle checked={false} onChange={jest.fn()} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('should render checked state', () => {
    render(<Toggle checked={true} onChange={jest.fn()} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('should call onChange with true when clicked while unchecked', () => {
    const handleChange = jest.fn();
    render(<Toggle checked={false} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should call onChange with false when clicked while checked', () => {
    const handleChange = jest.fn();
    render(<Toggle checked={true} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('should render label when provided', () => {
    render(<Toggle checked={false} onChange={jest.fn()} label="Loop" />);
    expect(screen.getByText('Loop')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Toggle checked={false} onChange={jest.fn()} disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
