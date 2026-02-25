import { Store, ShoppingCart, Clock, Headphones } from "lucide-react";

const stats = [
  { icon: Store, value: "১,০০০+", label: "অ্যাক্টিভ শপ" },
  { icon: ShoppingCart, value: "৫০,০০০+", label: "প্রসেসড অর্ডার" },
  { icon: Clock, value: "৯৯.৯%", label: "আপটাইম" },
  { icon: Headphones, value: "২৪/৭", label: "সাপোর্ট" },
];

const StatsSection = () => (
  <section className="py-14 bg-white border-b border-gray-100">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
            <s.icon className="h-6 w-6 text-violet-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{s.value}</span>
          <span className="text-sm text-gray-500">{s.label}</span>
        </div>
      ))}
    </div>
  </section>
);

export default StatsSection;
