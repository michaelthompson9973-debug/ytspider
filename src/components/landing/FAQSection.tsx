import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Can I use ShopFlow for free?", a: "Yes! Our free plan lets you create a shop and get started. You can upgrade later as your business grows." },
  { q: "How does courier integration work?", a: "Add your Pathao or Steadfast API keys and you can send orders and track deliveries directly — no manual work needed." },
  { q: "How many shops can I run from one account?", a: "Depending on your plan, you can create limited or unlimited shops. The Enterprise plan has no limits." },
  { q: "Do I need coding skills to build landing pages?", a: "Not at all! Our drag-and-drop builder lets you create professional landing pages without any coding." },
  { q: "Are AI features available on all plans?", a: "AI-powered fraud detection and smart suggestions are available on Pro and Enterprise plans. The Free plan includes basic features." },
  { q: "How can I get support?", a: "Free plan includes email support. Pro/Enterprise plans include 24/7 live chat and priority support." },
];

const FAQSection = () => (
  <section id="faq" className="py-20 sm:py-28 bg-gray-50">
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
        <p className="mt-4 text-gray-500 text-lg">Common questions and answers</p>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="bg-white rounded-xl border border-gray-100 px-6 shadow-sm">
            <AccordionTrigger className="text-left text-base font-medium text-gray-900 hover:no-underline">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-gray-500 leading-relaxed">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQSection;
