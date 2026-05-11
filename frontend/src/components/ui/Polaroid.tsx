interface PolaroidProps {
  src: string;
  alt: string;
  caption?: string;
  rotation?: number;
  className?: string;
}

export function Polaroid({ src, alt, caption, rotation = 0, className = '' }: PolaroidProps) {
  return (
    <div
      className={`bg-white p-3 pb-8 shadow-md inline-block ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <img src={src} alt={alt} className="w-full object-cover" />
      {caption && (
        <p className="mt-2 text-center text-sm italic font-serif text-fg-3">{caption}</p>
      )}
    </div>
  );
}
