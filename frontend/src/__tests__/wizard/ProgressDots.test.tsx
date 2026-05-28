import { render, screen } from '@testing-library/react';
import { ProgressDots } from '../../components/wizard/ProgressDots';

describe('ProgressDots', () => {
  it('should render all 4 step labels', () => {
    render(<ProgressDots currentStep={1} />);
    expect(screen.getByText('Vocês')).toBeInTheDocument();
    expect(screen.getByText('Localizações')).toBeInTheDocument();
    expect(screen.getByText('Música')).toBeInTheDocument();
    expect(screen.getByText('Envio')).toBeInTheDocument();
  });

  it('should show check icon on past steps', () => {
    render(<ProgressDots currentStep={3} />);
    const step1 = screen.getByLabelText(/Step 1.*completo/i);
    const step2 = screen.getByLabelText(/Step 2.*completo/i);
    expect(step1).toBeInTheDocument();
    expect(step2).toBeInTheDocument();
  });

  it('should show active style on current step', () => {
    render(<ProgressDots currentStep={2} />);
    const activeStep = screen.getByLabelText(/Step 2.*ativo/i);
    expect(activeStep).toBeInTheDocument();
    expect(activeStep.className).toContain('bg-olm-accent');
  });

  it('should show neutral style on future steps', () => {
    render(<ProgressDots currentStep={1} />);
    const futureStep = screen.getByLabelText(/Step 2/i);
    expect(futureStep).toBeInTheDocument();
    expect(futureStep.className).toContain('bg-olm-surface');
  });

  it('should show step numbers for non-past steps', () => {
    render(<ProgressDots currentStep={1} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
