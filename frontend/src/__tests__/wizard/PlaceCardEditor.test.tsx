import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaceCardEditor } from '../../components/wizard/PlaceCardEditor';
import type { Place } from '../../stores/wizard-store';

jest.mock('../../components/wizard/AddressInput', () => ({
  AddressInput: ({ onPick }: { apiKey: string; onPick: (r: unknown) => void }) => (
    <input
      placeholder="Buscar endereço..."
      onChange={(e) => onPick({ address: e.target.value, latitude: 0, longitude: 0 })}
    />
  ),
}));

const makeMockPlace = (): Place => ({
  id: 'test-id',
  title: '',
  address: '',
  description: '',
  photo: null,
  latitude: 0,
  longitude: 0,
});

describe('PlaceCardEditor', () => {
  it('should render place fields', () => {
    render(
      <PlaceCardEditor
        place={makeMockPlace()}
        index={0}
        showRemove={false}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(screen.getByPlaceholderText('Buscar endereço...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex: Café Central')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('O que aconteceu aqui...')).toBeInTheDocument();
  });

  it('should not show remove button when showRemove is false', () => {
    render(
      <PlaceCardEditor
        place={makeMockPlace()}
        index={0}
        showRemove={false}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /Remover lugar/i })).not.toBeInTheDocument();
  });

  it('should show remove button when showRemove is true', () => {
    render(
      <PlaceCardEditor
        place={makeMockPlace()}
        index={0}
        showRemove={true}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Remover lugar/i })).toBeInTheDocument();
  });

  it('should show error when photo is too large', async () => {
    render(
      <PlaceCardEditor
        place={makeMockPlace()}
        index={0}
        showRemove={false}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    const largeFile = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    const input = screen.getByLabelText('Upload de foto');
    fireEvent.change(input, { target: { files: [largeFile] } });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Arquivo muito grande');
    });
  });

  it('should show error when photo has invalid type', async () => {
    render(
      <PlaceCardEditor
        place={makeMockPlace()}
        index={0}
        showRemove={false}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    const badFile = new File(['data'], 'file.gif', { type: 'image/gif' });
    const input = screen.getByLabelText('Upload de foto');
    fireEvent.change(input, { target: { files: [badFile] } });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Formato inválido');
    });
  });

  it('should call onUpdate when title changes', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(
      <PlaceCardEditor
        place={makeMockPlace()}
        index={0}
        showRemove={false}
        onUpdate={onUpdate}
        onRemove={jest.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText('Ex: Café Central'), 'P');
    expect(onUpdate).toHaveBeenCalledWith({ title: 'P' });
  });
});
