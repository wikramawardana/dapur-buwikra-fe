"use client";

import {
  Features,
  Footer,
  Hero,
  MenuPreview,
  Navbar,
  Testimonials,
} from "@/components/landing-page";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <MenuPreview />
      <Testimonials />
      <Footer />
    </main>
  );
}
