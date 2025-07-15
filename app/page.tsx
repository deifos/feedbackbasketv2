import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { HowItWorks } from "@/components/HowItWorks"
import { Features } from "@/components/Features"
import { Testimonials } from "@/components/Testimonials"
import { Pricing } from "@/components/Pricing"
import { FAQ } from "@/components/FAQ"
import { CTA } from "@/components/CTA"
import { Footer } from "@/components/Footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}