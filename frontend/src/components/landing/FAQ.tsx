import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eyebrow } from '../ui/Eyebrow';

const QUESTIONS = [
  {
    q: 'Quanto tempo a página fica online?',
    a: 'No plano Básico, a página fica ativa por 7 dias após a criação. No Premium, ela fica no ar pra sempre, sem expiração.',
  },
  {
    q: 'Posso editar após o pagamento?',
    a: 'Sim! Você pode enviar um email para support@ourlovemap.com detalhando as alterações e elas serão realizadas em breve.',
  },
  {
    q: 'Como recebo o QR Code?',
    a: 'Assim que o pagamento é confirmado, o QR Code chega no seu email em formato pronto pra imprimir, enviar ou colocar em um cartão.',
  },
  {
    q: 'Funciona bem no celular?',
    a: 'Sim — a página foi pensada mobile-first. Quando a pessoa escaneia o QR, abre bonita no celular dela direto.',
  },
  {
    q: 'Posso adicionar mais localizações depois?',
    a: 'Pode! É só fazer upgrade pro Premium ou contatar o suporte que ajudamos a ajustar.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(-1);

  const handleToggle = (i: number) => {
    setOpenIndex(openIndex === i ? -1 : i);
  };

  return (
    <section id="faq" className="bg-olm-bg-elevated border-b border-olm-surface px-6 py-24">
      <div className="max-w-[1120px] mx-auto">
        <div data-scroll-group className="text-center max-w-[600px] mx-auto mb-12">
          <Eyebrow>Dúvidas frequentes</Eyebrow>
          <h2
            className="font-serif text-olm-title mt-4 leading-[1.1]"
            style={{ fontSize: 'var(--fs-h2)' }}
          >
            A gente <em className="text-olm-primary">responde</em>.
          </h2>
        </div>

        <div className="max-w-[760px] mx-auto">
          {QUESTIONS.map((item, i) => (
            <div
              key={item.q}
              className={i === 0 ? 'border-t border-b border-olm-surface' : 'border-b border-olm-surface'}
            >
              <button
                onClick={() => handleToggle(i)}
                className="w-full py-[22px] px-1 bg-transparent border-none cursor-pointer flex justify-between items-center text-left font-sans text-base font-semibold text-olm-title"
                aria-expanded={openIndex === i}
              >
                <span>{item.q}</span>
                <span
                  className="text-olm-primary text-[22px] ml-4 shrink-0 transition-transform duration-200 ease-emphasized"
                  style={{ transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="overflow-hidden"
                  >
                    <div className="px-1 pb-[22px] text-[15px] leading-relaxed text-fg-2 max-w-[640px]">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
