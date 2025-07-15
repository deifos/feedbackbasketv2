import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/ui/container"
import { Check, Zap } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with AI-powered feedback",
    features: [
      "Up to 100 feedback items/month",
      "Basic AI suggestions",
      "1 project",
      "Email support",
      "Customizable widget"
    ],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "Unlimited feedback with advanced AI features",
    features: [
      "Unlimited feedback items",
      "Advanced AI triage & responses",
      "Up to 5 projects",
      "Priority support",
      "GitHub integration",
      "IDE extensions",
      "Custom branding"
    ],
    cta: "Start Pro Trial",
    popular: true
  },
  {
    name: "Team",
    price: "$29",
    period: "per month",
    description: "Multi-user collaboration with enterprise features",
    features: [
      "Everything in Pro",
      "Unlimited projects",
      "Team collaboration",
      "Advanced analytics",
      "SSO integration",
      "API access",
      "Dedicated support"
    ],
    cta: "Contact Sales",
    popular: false
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-sky-500 shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-sky-400 to-blue-600">
                  <Zap className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">/{plan.period}</span>
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </Container>
    </section>
  )
}