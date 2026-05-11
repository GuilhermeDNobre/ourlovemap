import { render, screen } from '@testing-library/react';
import { LivePreview } from '../../components/wizard/LivePreview';
import { useWizardStore } from '../../stores/wizard-store';

beforeEach(() => {
  useWizardStore.getState().reset();
});

describe('LivePreview', () => {
  it('should render placeholder when names is empty', () => {
    render(<LivePreview />);
    expect(screen.getByText('Nomes do casal')).toBeInTheDocument();
  });

  it('should render couple names when set', () => {
    useWizardStore.getState().setField('names', 'Ana e Lucas');
    const { container } = render(<LivePreview />);
    expect(container.textContent).toContain('Ana');
    expect(container.textContent).toContain('Lucas');
  });

  it('should render opening phrase when set', () => {
    useWizardStore.getState().setField('opening', 'Nossa história começou...');
    render(<LivePreview />);
    expect(screen.getByText(/"Nossa história começou\.\.\."/)).toBeInTheDocument();
  });

  it('should render counter when startDate is set', () => {
    useWizardStore.getState().setField('startDate', '2020-01-01');
    render(<LivePreview />);
    expect(screen.getByText(/anos/i)).toBeInTheDocument();
  });

  it('should render music chip when step >= 3 and videoId is set', () => {
    useWizardStore.getState().setField('step', 3);
    useWizardStore.getState().setField('music', {
      videoId: 'abc123',
      query: 'nossa música',
      startTime: 0,
      endTime: 0,
      loop: false,
    });
    render(<LivePreview />);
    expect(screen.getByText('nossa música')).toBeInTheDocument();
  });
});
