import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { ArrowRight, Play } from "lucide-react"

export function Hero() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/20">
      <Container>
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Turn feedback into{" "}
            <span className="bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
              action
            </span>{" "}
            — instantly.
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Collect user feedback and let AI help you triage, respond, and fix what matters. 
            Build better products with intelligent feedback management.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="text-base px-8" asChild>
              <a href="#pricing">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8" asChild>
              <a href="#demo">
                <Play className="mr-2 h-4 w-4" />
                See It in Action
              </a>
            </Button>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/20 dark:to-blue-900/20 rounded-2xl p-8 border">
              <div className="bg-white dark:bg-card rounded-lg shadow-lg p-6 max-w-md mx-auto">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">FB</span>
                  </div>
                  <span className="font-medium">Feedback Widget Preview</span>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="flex space-x-2 pt-2">
                    <div className="h-8 bg-sky-100 dark:bg-sky-900/30 rounded px-3 flex items-center text-xs">
                      💡 AI Suggestion
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}