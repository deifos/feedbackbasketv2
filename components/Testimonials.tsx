import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Container } from "@/components/ui/container"
import { Quote } from "lucide-react"

const testimonials = [
  {
    quote: "FeedbackBasket transformed how we handle user feedback. The AI suggestions are spot-on and save us hours every week.",
    author: "Sarah Chen",
    role: "Lead Developer",
    company: "TechFlow",
    avatar: "SC",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  },
  {
    quote: "The GitHub integration is seamless. We can go from feedback to pull request in minutes, not days.",
    author: "Marcus Rodriguez",
    role: "Indie Hacker",
    company: "BuildFast",
    avatar: "MR",
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  },
  {
    quote: "Finally, a feedback tool that actually helps prioritize what to build next. The smart prioritization is a game-changer.",
    author: "Emily Watson",
    role: "Product Manager",
    company: "StartupXYZ",
    avatar: "EW",
    image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  }
]

export function Testimonials() {
  return (
    <section className="py-20 bg-muted/30">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Loved by developers worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what developers and product teams are saying about FeedbackBasket
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-sky-600/20 dark:text-sky-400/20 mb-4" />
                <blockquote className="text-lg mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={testimonial.image} alt={testimonial.author} />
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}