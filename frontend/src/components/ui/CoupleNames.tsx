interface CoupleNamesProps {
  names: string;
  className?: string;
}

export function CoupleNames({ names, className = '' }: CoupleNamesProps) {
  const parts = names.split(/\s+e\s+/i);

  if (parts.length < 2) {
    return <span className={className}>{names}</span>;
  }

  const [first, ...rest] = parts;
  const last = rest.join(' e ');

  return (
    <span className={className}>
      {first} <em className="text-olm-primary">e</em> {last}
    </span>
  );
}
