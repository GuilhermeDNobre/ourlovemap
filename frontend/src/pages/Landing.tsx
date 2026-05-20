import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { PreviewExperience } from '../components/landing/PreviewExperience';
import { UseCases } from '../components/landing/UseCases';
import { BentoFeatures } from '../components/landing/BentoFeatures';
import { Pricing } from '../components/landing/Pricing';
import { FAQ } from '../components/landing/FAQ';
import { FinalCTA } from '../components/landing/FinalCTA';
import { Footer } from '../components/landing/Footer';
import { useScrollReveal } from '../hooks/use-scroll-reveal';

export default function Landing() {
  const revealRef = useScrollReveal();

  return (
    <div ref={revealRef} data-testid="landing-page" className="overflow-x-hidden">
      <Navbar />
      <main className="relative">
        <div
          className="absolute inset-0 pointer-events-none z-10 hidden lg:block"
          aria-hidden="true"
        >
          <div className="max-w-[1280px] mx-auto h-full border-x border-olm-surface" />
        </div>
        <Hero />
        <HowItWorks />
        <PreviewExperience />
        <UseCases />
        <BentoFeatures />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
