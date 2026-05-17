interface AddressInputProps {
  apiKey: string;
  onPick: (result: { address: string; latitude: number; longitude: number }) => void;
}

export function AddressInput({ onPick }: AddressInputProps) {
  return (
    <input
      data-testid="address-input-mock"
      placeholder="Buscar endereço..."
      onChange={(e) =>
        onPick({ address: e.target.value, latitude: 0, longitude: 0 })
      }
    />
  );
}
