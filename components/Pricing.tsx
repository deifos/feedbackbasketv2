"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/ui/container"
import { Switch } from "@/components/ui/switch"
import { Check, Zap } from "lucide-react"
import { PLAN_CONFIGS } from "@/lib/config/plans"

interface PlanData {
  name: string
  monthlyPrice: number
  annualPrice: number
  description: string
  features: string[]
  cta: string
  popular: boolean
  stripePriceIds: {
    monthly: string | null
    annual: string | null
  }
  projects: number
  feedbackPerMonth: number
}

const plans: PlanData[] = [
  {
    name: "Free",
    monthlyPrice: PLAN_CONFIGS.FREE.price.monthly,
    annualPrice: PLAN_CONFIGS.FREE.price.annual,
    description: "Perfect for getting started with AI-powered feedback",
    features: [
      `Up to ${PLAN_CONFIGS.FREE.feedbackPerMonth} feedback items/month`,
      "Basic AI suggestions",
      `${PLAN_CONFIGS.FREE.projects} project`,
      "Email support",
      "Customizable widget"
    ],
    cta: "Start Free",
    popular: false,
    stripePriceIds: PLAN_CONFIGS.FREE.stripePriceIds,
    projects: PLAN_CONFIGS.FREE.projects,
    feedbackPerMonth: PLAN_CONFIGS.FREE.feedbackPerMonth
  },
  {
    name: "Starter",
    monthlyPrice: PLAN_CONFIGS.STARTER.price.monthly,
    annualPrice: PLAN_CONFIGS.STARTER.price.annual,
    description: "Great for growing projects with more feedback",
    features: [
      `Up to ${PLAN_CONFIGS.STARTER.feedbackPerMonth} feedback items/month`,
      "Advanced AI suggestions",
      `Up to ${PLAN_CONFIGS.STARTER.projects} projects`,
      "Priority support",
      "GitHub integration",
      "IDE extensions"
    ],
    cta: "Start Starter",
    popular: true,
    stripePriceIds: PLAN_CONFIGS.STARTER.stripePriceIds,
    projects: PLAN_CONFIGS.STARTER.projects,
    feedbackPerMonth: PLAN_CONFIGS.STARTER.feedbackPerMonth
  },
  {
    name: "Pro",
    monthlyPrice: PLAN_CONFIGS.PRO.price.monthly,
    annualPrice: PLAN_CONFIGS.PRO.price.annual,
    description: "For teams and power users who need maximum capacity",
    features: [
      `Up to ${PLAN_CONFIGS.PRO.feedbackPerMonth} feedback items/month`,
      "Advanced AI triage & responses",
      `Up to ${PLAN_CONFIGS.PRO.projects} projects`,
      "Priority support",
      "GitHub integration",
      "IDE extensions",
      "Custom branding",
      "Advanced analytics"
    ],
    cta: "Start Pro",
    popular: false,
    stripePriceIds: PLAN_CONFIGS.PRO.stripePriceIds,
    projects: PLAN_CONFIGS.PRO.projects,
    feedbackPerMonth: PLAN_CONFIGS.PRO.feedbackPerMonth
  }
]

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  const handleUpgrade = async (plan: PlanData) => {
    if (plan.name === "Free") {
      // For free plan, just redirect to signup or dashboard
      window.location.href = "/dashboard"
      return
    }

    const priceId = isAnnual ? plan.stripePriceIds.annual : plan.stripePriceIds.monthly
    
    if (!priceId) {
      console.error("No price ID found for plan:", plan.name)
      return
    }

    try {
      // Call the upgrade API endpoint with plan and billing cycle
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan.name.toUpperCase(),
          billingCycle: isAnnual ? 'annual' : 'monthly',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { checkoutUrl } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error("Error upgrading plan:", error)
      alert("There was an error starting the upgrade process. Please try again.")
    }
  }

  const calculateSavings = (monthlyPrice: number, annualPrice: number) => {
    if (monthlyPrice === 0 || annualPrice === 0) return 0
    const monthlyTotal = monthlyPrice * 12
    const annualTotal = annualPrice * 12
    return Math.round(((monthlyTotal - annualTotal) / monthlyTotal) * 100)
  }

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
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm ${!isAnnual ? 'font-semibold' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-sky-500"
            />
            <span className={`text-sm ${isAnnual ? 'font-semibold' : 'text-muted-foreground'}`}>
              Annual
            </span>
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
              Save {Math.max(...plans.map(p => calculateSavings(p.monthlyPrice, p.annualPrice)).filter(s => s > 0))}%
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice
            const savings = calculateSavings(plan.monthlyPrice, plan.annualPrice)
            
            return (
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
                    <span className="text-4xl font-bold">
                      ${currentPrice}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {plan.name === "Free" ? "/forever" : isAnnual ? "/month" : "/month"}
                    </span>
                    {isAnnual && plan.name !== "Free" && savings > 0 && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Save {savings}% annually
                      </div>
                    )}
                    {isAnnual && plan.name !== "Free" && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Billed annually (${plan.annualPrice * 12}/year)
                      </div>
                    )}
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
                    onClick={() => handleUpgrade(plan)}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All paid plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </Container>
    </section>
  )
}