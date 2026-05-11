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

export default function Landing() {
  return (
    <div data-testid="landing-page">
      <Navbar />
      <main>
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
