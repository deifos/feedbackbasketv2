import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/ui/container"
import { Widget, MessageSquare, Brain, Zap } from "lucide-react"

const steps = [
  {
    icon: Widget,
    title: "Add the widget",
    description: "Embed our lightweight widget in your app with just a few lines of code.",
    badge: "Step 1"
  },
  {
    icon: MessageSquare,
    title: "Get user feedback",
    description: "Users can easily submit feedback, bug reports, and feature requests.",
    badge: "Step 2"
  },
  {
    icon: Brain,
    title: "Let AI triage",
    description: "Our AI automatically categorizes, prioritizes, and suggests responses.",
    badge: "Step 3"
  },
  {
    icon: Zap,
    title: "Take action faster",
    description: "Sync with GitHub, create issues, and track progress seamlessly.",
    badge: "Step 4"
  }
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-muted/30">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From feedback collection to action items in four simple steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Badge variant="secondary" className="mb-4">
                  {step.badge}
                </Badge>
                <div className="mb-4">
                  <step.icon className="h-8 w-8 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}