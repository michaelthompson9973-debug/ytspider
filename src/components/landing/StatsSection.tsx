import { Store, ShoppingCart, Clock, Headphones } from "lucide-react";

const stats = [
  { icon: Store, value: "1,000+", label: "Active Shops" },
  { icon: ShoppingCart, value: "50,000+", label: "Orders Processed" },
  { icon: Clock, value: "99.9%", label: "Uptime" },
  { icon: Headphones, value: "24/7", label: "Support" },
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
