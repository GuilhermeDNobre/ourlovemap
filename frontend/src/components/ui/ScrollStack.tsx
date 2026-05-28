import {
  Children,
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

const ScrollCtx = createContext<MotionValue<number> | null>(null);

function StackCard({
  children,
  index,
  total,
}: {
  children: ReactNode;
  index: number;
  total: number;
}) {
  const scrollYProgress = useContext(ScrollCtx)!;
  const start = index / total;
  const end = (index + 1) / total;
  const y = useTransform(scrollYProgress, [start, end], ['0%', '-100%']);

  return (
    <motion.div
      className="sticky top-0 min-h-screen"
      style={{ zIndex: total - index, y }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollStack({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);
  const count = items.length;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <ScrollCtx.Provider value={scrollYProgress}>
      <div
        ref={containerRef}
        className="relative"
        style={{ height: `${count * 100}vh` }}
      >
        {items.map((child, i) => (
          <StackCard key={i} index={i} total={count}>
            {child}
          </StackCard>
        ))}
      </div>
    </ScrollCtx.Provider>
  );
}
