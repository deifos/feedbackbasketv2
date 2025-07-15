import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Container } from "@/components/ui/container"

const faqs = [
  {
    question: "Can I use FeedbackBasket on multiple projects?",
    answer: "Yes! The Pro plan supports up to 5 projects, while the Team plan offers unlimited projects. You can easily switch between projects in your dashboard and manage feedback across all your applications."
  },
  {
    question: "How does the AI make suggestions?",
    answer: "Our AI analyzes feedback patterns, sentiment, and context to provide intelligent suggestions for responses and next steps. It learns from your feedback history and industry best practices to offer increasingly relevant recommendations."
  },
  {
    question: "Can I connect FeedbackBasket to GitHub?",
    answer: "Absolutely! Our GitHub integration allows you to automatically create issues from feedback, sync status updates, and track progress. This feature is available on Pro and Team plans."
  },
  {
    question: "Does it work with Cursor or VS Code?",
    answer: "Yes, we offer extensions for popular IDEs including VS Code, Cursor, and other editors. You can view feedback, create issues, and track progress directly from your development environment."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "You can export all your feedback data at any time. If you cancel, you'll have 30 days to download your data before it's permanently deleted. We believe your data should always be portable."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! All paid plans come with a 14-day free trial. You can explore all features without providing a credit card. The Free plan is also available forever with basic features."
  }
]

export function FAQ() {
  return (
    <section id="faq" className="py-20 bg-muted/30">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about FeedbackBasket
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  )
}