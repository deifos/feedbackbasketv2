import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { ArrowRight, Calendar } from "lucide-react"

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20">
      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to build with better feedback?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Join thousands of developers who are already using FeedbackBasket to turn user feedback into actionable insights. Start your free trial today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-base px-8" asChild>
              <a href="#pricing">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8" asChild>
              <a href="/demo">
                <Calendar className="mr-2 h-4 w-4" />
                Book a Demo
              </a>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </Container>
    </section>
  )
}