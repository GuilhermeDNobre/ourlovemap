import { render, screen } from '@testing-library/react';
import { CoupleNames } from '../components/ui/CoupleNames';

describe('CoupleNames', () => {
  it('should render both names within the container', () => {
    const { container } = render(<CoupleNames names="Ana e Lucas" />);
    expect(container.textContent).toContain('Ana');
    expect(container.textContent).toContain('Lucas');
  });

  it('should render "e" with coral class', () => {
    render(<CoupleNames names="Ana e Lucas" />);
    const separator = screen.getByText('e');
    expect(separator.className).toContain('text-olm-primary');
  });

  it('should render "e" as em element', () => {
    render(<CoupleNames names="Ana e Lucas" />);
    const separator = screen.getByText('e');
    expect(separator.tagName).toBe('EM');
  });

  it('should render plain text when no "e" separator found', () => {
    render(<CoupleNames names="SingleName" />);
    expect(screen.getByText('SingleName')).toBeInTheDocument();
  });

  it('should handle case-insensitive "e" separator', () => {
    const { container } = render(<CoupleNames names="Ana E Lucas" />);
    const em = container.querySelector('em');
    expect(em).toBeInTheDocument();
    expect(em?.className).toContain('text-olm-primary');
  });
});
