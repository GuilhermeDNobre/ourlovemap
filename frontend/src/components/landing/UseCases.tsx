import { Gem, CalendarHeart, Plane, Coffee, type LucideIcon } from 'lucide-react';
import { Eyebrow } from '../ui/Eyebrow';

const CASES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Gem,
    title: 'Pedido de casamento',
    body: 'Revele o grande momento com um mapa que conta tudo.',
  },
  {
    icon: CalendarHeart,
    title: 'Aniversário de namoro',
    body: 'Um presente que lembra cada virada do calendário.',
  },
  {
    icon: Plane,
    title: 'Viagem inesquecível',
    body: 'Os lugares onde vocês se perderam (e se acharam).',
  },
  {
    icon: Coffee,
    title: 'Primeiro encontro',
    body: 'Comece a história com estilo, já no dia um.',
  },
];

export function UseCases() {
  return (
    <section className="bg-olm-bg-elevated border-b border-olm-surface px-6 py-24">
      <div className="max-w-[1120px] mx-auto">
        <div data-scroll-group className="text-center max-w-[600px] mx-auto mb-14">
          <Eyebrow>Pra cada momento de vocês</Eyebrow>
          <h2
            className="olm-h2"
          >
            Feito pra qualquer <em className="text-olm-primary">ocasião</em>.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 olm-stagger">
          {CASES.map((c) => (
            <div
              key={c.title}
              className="olm-card p-7 rounded-[20px] bg-olm-bg border border-olm-surface cursor-pointer"
            >
              <div className="w-14 h-14 rounded-[18px] bg-olm-primary-100 text-olm-primary flex items-center justify-center mb-3.5">
                <c.icon size={22} strokeWidth={1.75} />
              </div>
              <div className="font-serif text-xl text-olm-title leading-[1.15] mb-2">
                {c.title}
              </div>
              <div className="text-sm text-fg-2 leading-[1.5]">{c.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
