import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render primary variant by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByText('Primary');
    expect(btn.className).toContain('bg-olm-primary');
  });

  it('should render secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByText('Secondary');
    expect(btn.className).toContain('bg-transparent');
    expect(btn.className).toContain('text-olm-title');
  });

  it('should render premium variant', () => {
    render(<Button variant="premium">Premium</Button>);
    const btn = screen.getByText('Premium');
    expect(btn.className).toContain('bg-olm-dark-800');
  });

  it('should render ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByText('Ghost');
    expect(btn.className).toContain('bg-transparent');
  });

  it('should apply sm size class', () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByText('Small');
    expect(btn.className).toContain('text-[13px]');
  });

  it('should apply lg size class', () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByText('Large');
    expect(btn.className).toContain('text-base');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
