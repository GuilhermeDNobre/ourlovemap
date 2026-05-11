import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Step3Musica } from '../../components/wizard/steps/Step3Musica';
import { useWizardStore } from '../../stores/wizard-store';

const mockSearchYouTube = jest.fn();

jest.mock('../../lib/youtube-api', () => ({
  searchYouTube: (...args: unknown[]) => mockSearchYouTube(...args),
}));

beforeEach(() => {
  useWizardStore.getState().reset();
  jest.clearAllMocks();
  mockSearchYouTube.mockResolvedValue([
    {
      videoId: 'result123',
      title: 'Test Song Result',
      thumbnailUrl: 'https://example.com/thumb.jpg',
    },
  ]);
});

function renderStep(onNext = jest.fn(), onBack = jest.fn()) {
  return render(
    <MemoryRouter>
      <Step3Musica onNext={onNext} onBack={onBack} />
    </MemoryRouter>,
  );
}

describe('Step3Musica', () => {
  it('should render search input initially', () => {
    renderStep();
    expect(screen.getByPlaceholderText(/Buscar música ou colar link/i)).toBeInTheDocument();
  });

  it('should have "Continuar" enabled without music selected', () => {
    renderStep();
    expect(screen.getByRole('button', { name: /continuar/i })).not.toBeDisabled();
  });

  it('should show track card when valid YouTube URL is entered', async () => {
    const user = userEvent.setup();
    renderStep();
    const input = screen.getByPlaceholderText(/Buscar música ou colar link/i);
    await user.type(input, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Remover música/i })).toBeInTheDocument();
    });
    expect(mockSearchYouTube).not.toHaveBeenCalled();
  });

  it('should not call searchYouTube immediately when typing regular text (debounce)', async () => {
    const user = userEvent.setup();
    renderStep();
    const input = screen.getByPlaceholderText(/Buscar música ou colar link/i);
    await user.type(input, 'love song');
    expect(mockSearchYouTube).not.toHaveBeenCalled();
  });

  it('should show error when invalid URL is entered', async () => {
    const user = userEvent.setup();
    renderStep();
    const input = screen.getByPlaceholderText(/Buscar música ou colar link/i);
    await user.type(input, 'https://example.com/not-youtube');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/URL inválida/i)).toBeInTheDocument();
  });

  it('should show sliders and loop toggle when track is selected from store', () => {
    useWizardStore.getState().setField('music', {
      videoId: 'abc123',
      query: 'Test Song',
      startTime: 0,
      endTime: 30,
      loop: false,
    });
    renderStep();
    expect(screen.getByLabelText(/Tempo de início/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tempo de fim/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Repetir em loop/i })).toBeInTheDocument();
  });

  it('should remove track when remove button is clicked', async () => {
    useWizardStore.getState().setField('music', {
      videoId: 'abc123',
      query: 'Test Song',
      startTime: 0,
      endTime: 30,
      loop: false,
    });
    const user = userEvent.setup();
    renderStep();
    await user.click(screen.getByRole('button', { name: /Remover música/i }));
    expect(screen.getByPlaceholderText(/Buscar música ou colar link/i)).toBeInTheDocument();
    expect(useWizardStore.getState().music.videoId).toBe('');
  });

  it('should select track from search results when clicked', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderStep();
    const input = screen.getByPlaceholderText(/Buscar música ou colar link/i);
    await user.type(input, 'test');
    await act(async () => { jest.runAllTimers(); });
    await waitFor(() => {
      expect(screen.getByText('Test Song Result')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Test Song Result'));
    expect(useWizardStore.getState().music.videoId).toBe('result123');
    jest.useRealTimers();
  });

  it('should toggle loop when checkbox is clicked', async () => {
    useWizardStore.getState().setField('music', {
      videoId: 'abc123',
      query: 'Test Song',
      startTime: 0,
      endTime: 30,
      loop: false,
    });
    const user = userEvent.setup();
    renderStep();
    const checkbox = screen.getByRole('checkbox', { name: /Repetir em loop/i });
    await user.click(checkbox);
    expect(useWizardStore.getState().music.loop).toBe(true);
  });
});
