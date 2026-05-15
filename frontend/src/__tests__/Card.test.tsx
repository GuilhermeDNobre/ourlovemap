import { render, screen } from '@testing-library/react';
import { Card } from '../components/ui/Card';

describe('Card', () => {
  it('should render children', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply light variant classes by default', () => {
    const { container } = render(<Card><p>Content</p></Card>);
    expect(container.firstChild).toHaveClass('bg-white');
    expect(container.firstChild).toHaveClass('shadow-md');
  });

  it('should apply dark variant classes', () => {
    const { container } = render(<Card variant="dark"><p>Content</p></Card>);
    expect(container.firstChild).toHaveClass('bg-olm-dark-800');
  });

  it('should accept custom className', () => {
    const { container } = render(<Card className="p-4"><p>Content</p></Card>);
    expect(container.firstChild).toHaveClass('p-4');
  });
});
