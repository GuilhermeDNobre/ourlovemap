interface AddressInputProps {
  onPick: (result: { address: string; latitude: number; longitude: number }) => void;
  initialValue?: string;
}

export function AddressInput({ onPick, initialValue = '' }: AddressInputProps) {
  return (
    <input
      data-testid="address-input-mock"
      placeholder="Buscar endereço..."
      defaultValue={initialValue}
      onChange={(e) =>
        onPick({ address: e.target.value, latitude: 0, longitude: 0 })
      }
    />
  );
}
