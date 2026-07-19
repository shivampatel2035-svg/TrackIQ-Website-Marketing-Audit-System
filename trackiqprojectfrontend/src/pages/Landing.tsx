import { Hero } from '../components/Hero';
import { FeatureCards } from '../components/FeatureCards';
import { HowItWorks } from '../components/HowItWorks';
import { Faq } from '../components/Faq';

export function Landing() {
  return (
    <main className="pt-16">
      <Hero />
      <FeatureCards />
      <HowItWorks />
      <Faq />
    </main>
  );
}
