import Hero from '../components/landing/Hero';
import ChaosToMemory from '../components/landing/ChaosToMemory';
import ThreeModes from '../components/landing/ThreeModes';
import HowItWorks from '../components/landing/HowItWorks';
import FinalCTA from '../components/landing/FinalCTA';

export default function LandingPage() {
  return (
    <main className="bg-[#0a0a0b] text-white">
      <Hero />
      <ChaosToMemory />
      <ThreeModes />
      <HowItWorks />
      <FinalCTA />
    </main>
  );
}
