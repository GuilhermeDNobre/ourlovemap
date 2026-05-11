import { render, screen } from '@testing-library/react';
import { Eyebrow } from '../components/ui/Eyebrow';

describe('Eyebrow', () => {
  it('should render children text', () => {
    render(<Eyebrow>Como funciona</Eyebrow>);
    expect(screen.getByText('Como funciona')).toBeInTheDocument();
  });

  it('should apply coral color class', () => {
    const { container } = render(<Eyebrow>Test</Eyebrow>);
    expect(container.firstChild).toHaveClass('text-olm-primary');
  });

  it('should apply uppercase tracking class', () => {
    const { container } = render(<Eyebrow>Test</Eyebrow>);
    expect(container.firstChild).toHaveClass('uppercase');
    expect(container.firstChild).toHaveClass('tracking-[0.14em]');
  });

  it('should accept custom className', () => {
    const { container } = render(<Eyebrow className="mb-4">Test</Eyebrow>);
    expect(container.firstChild).toHaveClass('mb-4');
  });
});
