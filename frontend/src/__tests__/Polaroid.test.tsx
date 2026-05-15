import { render, screen } from '@testing-library/react';
import { Polaroid } from '../components/ui/Polaroid';

describe('Polaroid', () => {
  it('should render the image with alt text', () => {
    render(<Polaroid src="photo.jpg" alt="Our photo" />);
    expect(screen.getByRole('img', { name: 'Our photo' })).toBeInTheDocument();
  });

  it('should render caption when provided', () => {
    render(<Polaroid src="photo.jpg" alt="Photo" caption="Nosso primeiro encontro" />);
    expect(screen.getByText('Nosso primeiro encontro')).toBeInTheDocument();
  });

  it('should not render caption when not provided', () => {
    const { container } = render(<Polaroid src="photo.jpg" alt="Photo" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('should apply rotation style', () => {
    const { container } = render(<Polaroid src="photo.jpg" alt="Photo" rotation={5} />);
    expect(container.firstChild).toHaveStyle({ transform: 'rotate(5deg)' });
  });

  it('should apply zero rotation by default', () => {
    const { container } = render(<Polaroid src="photo.jpg" alt="Photo" />);
    expect(container.firstChild).toHaveStyle({ transform: 'rotate(0deg)' });
  });
});
