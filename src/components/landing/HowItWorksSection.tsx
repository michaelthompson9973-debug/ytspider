import { UserPlus, Settings, Rocket } from "lucide-react";

const steps = [
  { icon: UserPlus, step: "01", title: "Create an Account", description: "Sign up with your email — ready in 30 seconds." },
  { icon: Settings, step: "02", title: "Set Up Your Shop", description: "Add products, build landing pages, connect couriers." },
  { icon: Rocket, step: "03", title: "Start Selling", description: "Publish your page and start taking orders!" },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="py-20 sm:py-28 bg-white">
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How It Works</h2>
        <p className="mt-4 text-gray-500 text-lg">Launch your online shop in just 3 steps.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={s.step} className="relative flex flex-col items-center text-center p-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
              <s.icon className="h-8 w-8 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-2">Step {s.step}</span>
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
