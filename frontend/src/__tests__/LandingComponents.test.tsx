import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DarkMockup } from '../components/landing/DarkMockup';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { PreviewExperience } from '../components/landing/PreviewExperience';
import { UseCases } from '../components/landing/UseCases';
import { BentoFeatures } from '../components/landing/BentoFeatures';
import { FinalCTA } from '../components/landing/FinalCTA';
import { Footer } from '../components/landing/Footer';

function withRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('DarkMockup', () => {
  it('should render without errors', () => {
    const { container } = render(<DarkMockup />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render couple names', () => {
    const { container } = render(<DarkMockup />);
    expect(container.textContent).toContain('Ana');
    expect(container.textContent).toContain('Lucas');
  });

  it('should render with lg size', () => {
    const { container } = render(<DarkMockup size="lg" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Hero', () => {
  it('should render headline text', () => {
    withRouter(<Hero />);
    expect(screen.getByText(/O mapa de tudo/)).toBeInTheDocument();
  });

  it('should render CTAs', () => {
    withRouter(<Hero />);
    expect(screen.getByText('Criar nosso mapa')).toBeInTheDocument();
    expect(screen.getByText('Ver exemplo')).toBeInTheDocument();
  });

  it('should render social proof', () => {
    withRouter(<Hero />);
    expect(screen.getByText(/3.200 casais/)).toBeInTheDocument();
  });
});

describe('HowItWorks', () => {
  it('should render all 3 steps', () => {
    render(<HowItWorks />);
    expect(screen.getByText('Preencha os momentos')).toBeInTheDocument();
    expect(screen.getByText('Escolha seu plano')).toBeInTheDocument();
    expect(screen.getByText('Receba o QR Code')).toBeInTheDocument();
  });

  it('should render section heading', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/Três passos/)).toBeInTheDocument();
  });
});

describe('PreviewExperience', () => {
  it('should render feature list', () => {
    render(<PreviewExperience />);
    expect(screen.getByText('Mapa interativo com rota entre os lugares')).toBeInTheDocument();
    expect(screen.getByText('Contador do relacionamento ao vivo')).toBeInTheDocument();
  });

  it('should render the Exclusivo badge', () => {
    render(<PreviewExperience />);
    expect(screen.getByText('Exclusivo')).toBeInTheDocument();
  });
});

describe('UseCases', () => {
  it('should render all 4 use case cards', () => {
    render(<UseCases />);
    expect(screen.getByText('Pedido de casamento')).toBeInTheDocument();
    expect(screen.getByText('Aniversário de namoro')).toBeInTheDocument();
    expect(screen.getByText('Viagem inesquecível')).toBeInTheDocument();
    expect(screen.getByText('Primeiro encontro')).toBeInTheDocument();
  });
});

describe('BentoFeatures', () => {
  it('should render all feature tiles', () => {
    render(<BentoFeatures />);
    expect(screen.getByText('Mapa interativo com pins')).toBeInTheDocument();
    expect(screen.getByText('Fotos em polaroide')).toBeInTheDocument();
    expect(screen.getByText('Música do YouTube')).toBeInTheDocument();
    expect(screen.getByText('Contador ao vivo')).toBeInTheDocument();
    expect(screen.getByText('Compartilhe no Instagram')).toBeInTheDocument();
    expect(screen.getByText('QR Code por email')).toBeInTheDocument();
  });
});

describe('FinalCTA', () => {
  it('should render the headline', () => {
    withRouter(<FinalCTA />);
    expect(screen.getByText(/Crie o/)).toBeInTheDocument();
  });

  it('should render the CTA button', () => {
    withRouter(<FinalCTA />);
    expect(screen.getByText('Começar agora')).toBeInTheDocument();
  });
});

describe('Footer', () => {
  it('should render the brand name', () => {
    render(<Footer />);
    expect(screen.getByText('Map')).toBeInTheDocument();
  });

  it('should render legal links', () => {
    render(<Footer />);
    expect(screen.getByText('Termos')).toBeInTheDocument();
    expect(screen.getByText('Privacidade')).toBeInTheDocument();
    expect(screen.getByText('Contato')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });

  it('should render copyright text', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 Our Love Map/)).toBeInTheDocument();
  });
});
