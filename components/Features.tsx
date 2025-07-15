import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Brain, ArrowUpDown, Code, Github, FolderOpen, Palette } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI Suggestions",
    description: "Get intelligent recommendations for responses and next steps based on feedback patterns."
  },
  {
    icon: ArrowUpDown,
    title: "Smart Prioritization",
    description: "Automatically rank feedback by impact, urgency, and user sentiment to focus on what matters."
  },
  {
    icon: Code,
    title: "IDE Integration",
    description: "Create issues and track progress directly from VS Code, Cursor, and other popular editors."
  },
  {
    icon: Github,
    title: "GitHub Sync",
    description: "Seamlessly sync feedback with GitHub issues and pull requests for streamlined workflows."
  },
  {
    icon: FolderOpen,
    title: "Multi-project Support",
    description: "Manage feedback across multiple projects and teams from a single, unified dashboard."
  },
  {
    icon: Palette,
    title: "Customizable Widgets",
    description: "Match your brand with fully customizable feedback widgets that blend into your app."
  }
]

export function Features() {
  return (
    <section id="features" className="py-20">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to manage feedback
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to turn user feedback into actionable insights
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-2">
                  <feature.icon className="h-8 w-8 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}