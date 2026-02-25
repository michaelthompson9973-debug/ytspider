import { UserPlus, Settings, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "০১",
    title: "অ্যাকাউন্ট তৈরি করুন",
    description: "ইমেইল দিয়ে সাইন আপ করুন — ৩০ সেকেন্ডে রেডি।",
  },
  {
    icon: Settings,
    step: "০২",
    title: "শপ সেটআপ করুন",
    description: "প্রোডাক্ট যোগ করুন, ল্যান্ডিং পেজ বানান, কুরিয়ার কানেক্ট করুন।",
  },
  {
    icon: Rocket,
    step: "০৩",
    title: "সেল শুরু করুন",
    description: "পেজ পাবলিশ করুন এবং অর্ডার নেওয়া শুরু করুন!",
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="py-20 sm:py-28 bg-white">
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">কিভাবে কাজ করে?</h2>
        <p className="mt-4 text-gray-500 text-lg">মাত্র ৩ ধাপে আপনার অনলাইন শপ চালু করুন।</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={s.step} className="relative flex flex-col items-center text-center p-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
              <s.icon className="h-8 w-8 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-2">ধাপ {s.step}</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{s.description}</p>
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-12 -right-4 w-8 h-0.5 bg-gradient-to-r from-violet-300 to-pink-300" />
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
