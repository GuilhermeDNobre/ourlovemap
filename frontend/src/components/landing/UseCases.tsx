import { Eyebrow } from '../ui/Eyebrow';

const CASES = [
  {
    icon: '💍',
    title: 'Pedido de casamento',
    body: 'Revele o grande momento com um mapa que conta tudo.',
  },
  {
    icon: '🗓️',
    title: 'Aniversário de namoro',
    body: 'Um presente que lembra cada virada do calendário.',
  },
  {
    icon: '✈️',
    title: 'Viagem inesquecível',
    body: 'Os lugares onde vocês se perderam (e se acharam).',
  },
  {
    icon: '☕',
    title: 'Primeiro encontro',
    body: 'Comece a história com estilo, já no dia um.',
  },
];

export function UseCases() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="max-w-[1120px] mx-auto">
        <div className="text-center max-w-[600px] mx-auto mb-14">
          <Eyebrow>Pra cada momento de vocês</Eyebrow>
          <h2
            className="font-serif text-olm-title mt-4 leading-[1.1]"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
          >
            Feito pra qualquer <em className="text-olm-primary">ocasião</em>.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {CASES.map((c) => (
            <div
              key={c.title}
              className="p-7 rounded-[20px] bg-olm-bg border border-[rgba(65,60,123,0.06)] cursor-pointer transition-all duration-200 ease-emphasized hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-[32px] mb-3.5">{c.icon}</div>
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
