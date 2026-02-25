import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "ShopFlow কি ফ্রি ব্যবহার করা যায়?",
    a: "হ্যাঁ! আমাদের ফ্রি প্ল্যানে আপনি শপ তৈরি করে শুরু করতে পারবেন। পরবর্তীতে আপনার ব্যবসার চাহিদা অনুযায়ী আপগ্রেড করতে পারবেন।",
  },
  {
    q: "কুরিয়ার ইন্টিগ্রেশন কিভাবে কাজ করে?",
    a: "Pathao, Steadfast সহ জনপ্রিয় কুরিয়ার সার্ভিসগুলোর API কী যোগ করলেই সরাসরি অর্ডার পাঠানো ও ট্র্যাকিং হবে — ম্যানুয়াল কাজ লাগবে না।",
  },
  {
    q: "একটি অ্যাকাউন্টে কয়টি শপ চালানো যায়?",
    a: "আপনার প্ল্যান অনুযায়ী সীমিত বা আনলিমিটেড শপ তৈরি করতে পারবেন। এন্টারপ্রাইজ প্ল্যানে কোনো সীমা নেই।",
  },
  {
    q: "ল্যান্ডিং পেজ বানাতে কি কোডিং লাগবে?",
    a: "মোটেই না! আমাদের ড্র্যাগ অ্যান্ড ড্রপ বিল্ডার দিয়ে কোনো কোডিং ছাড়াই প্রফেশনাল ল্যান্ডিং পেজ তৈরি করতে পারবেন।",
  },
  {
    q: "AI ফিচারগুলো কি সব প্ল্যানে আছে?",
    a: "AI-পাওয়ার্ড ফ্রড ডিটেকশন ও স্মার্ট সাজেশন প্রো এবং এন্টারপ্রাইজ প্ল্যানে উপলব্ধ। ফ্রি প্ল্যানে বেসিক ফিচারগুলো পাবেন।",
  },
  {
    q: "সাপোর্ট কিভাবে পাবো?",
    a: "ফ্রি প্ল্যানে ইমেইল সাপোর্ট এবং প্রো/এন্টারপ্রাইজ প্ল্যানে ২৪/৭ লাইভ চ্যাট ও প্রায়োরিটি সাপোর্ট পাবেন।",
  },
];

const FAQSection = () => (
  <section id="faq" className="py-20 sm:py-28 bg-gray-50">
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">সাধারণ জিজ্ঞাসা</h2>
        <p className="mt-4 text-gray-500 text-lg">প্রায়ই জিজ্ঞাসিত প্রশ্ন ও উত্তর</p>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="bg-white rounded-xl border border-gray-100 px-6 shadow-sm"
          >
            <AccordionTrigger className="text-left text-base font-medium text-gray-900 hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-gray-500 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQSection;
