import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Store, Bot, Package, Smartphone, MessageCircle, BarChart3, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePricingPlans, formatLimit } from "@/hooks/usePricingPlans";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/landing/Header";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FAQSection from "@/components/landing/FAQSection";
import CTABanner from "@/components/landing/CTABanner";
import Footer from "@/components/landing/Footer";
import { HomeSkeleton } from "@/components/landing/HomeSkeleton";
import { PageLoadWrapper } from "@/components/landing/PageLoadWrapper";

const features = [
  { icon: Store, title: "Multi-Shop Management", description: "Manage multiple shops from a single account with ease.", bg: "bg-violet-100 text-violet-700" },
  { icon: Bot, title: "AI-Integrated Order Management", description: "AI-powered fraud detection and smart order processing.", bg: "bg-blue-100 text-blue-700" },
  { icon: Package, title: "Courier Integration", description: "Directly connect with Pathao, Steadfast, and other courier services.", bg: "bg-emerald-100 text-emerald-700" },
  { icon: Smartphone, title: "Mobile-First Landing Page Builder", description: "Create beautiful landing pages with drag and drop.", bg: "bg-orange-100 text-orange-700" },
  { icon: MessageCircle, title: "Messenger / WhatsApp Inbox", description: "All messages in one place. Real-time chat with customers.", bg: "bg-pink-100 text-pink-700" },
  { icon: BarChart3, title: "Real-time Analytics", description: "Track sales, orders, and customer data in real-time.", bg: "bg-cyan-100 text-cyan-700" },
];

const Index = () => {
  const { data: plans, isLoading: plansLoading } = usePricingPlans(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return <HomeSkeleton />;
  }

  return (
    <PageLoadWrapper className="min-h-screen bg-white">
      <Header />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-blue-600 to-pink-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-36 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Build Your Online Shop
            <span className="block mt-2 text-yellow-300">In Minutes</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            With ShopFlow — product uploads, order management, courier integration, and landing pages — everything in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-violet-700 hover:bg-gray-100 font-semibold text-base px-8 shadow-xl" asChild>
              <Link to="/register">
                Create Account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/50 bg-white/10 text-white hover:bg-white/20 font-semibold text-base px-8 backdrop-blur-sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      <StatsSection />

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">All Features in One Platform</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
              Everything you need to run your e-commerce business — all in ShopFlow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={`h-12 w-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorksSection />

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Pricing Plans</h2>
            <p className="mt-4 text-gray-500 text-lg">Choose the best plan for your business.</p>
          </div>
          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-6 sm:p-8 transition-all duration-300 ${
                    plan.is_featured
                      ? "border-violet-400 ring-2 ring-violet-400/30 shadow-xl scale-[1.03] bg-gradient-to-b from-violet-50 to-white"
                      : "border-gray-200 bg-white hover:shadow-lg"
                  }`}
                >
                  {plan.is_featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name_en || plan.name}</h3>
                  {(plan.description_en || plan.description) && <p className="mt-1 text-sm text-gray-500">{plan.description_en || plan.description}</p>}
                  <div className="mt-4">
                    {plan.is_contact_sales ? (
                      <span className="text-2xl font-bold text-gray-900">Contact Us</span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold text-gray-900">৳{plan.price_monthly.toLocaleString()}</span>
                        <span className="text-gray-500 text-sm">/month</span>
                      </>
                    )}
                  </div>
                  <ul className="mt-6 space-y-3">
                    <PlanFeature label={`${formatLimit(plan.max_shops)} Shops`} />
                    <PlanFeature label={`${formatLimit(plan.max_products)} Products`} />
                    <PlanFeature label={`${formatLimit(plan.max_landing_pages)} Landing Pages`} />
                    <PlanFeature label={`Up to ${formatLimit(plan.max_orders_per_month)} Orders/day`} />
                    <PlanFeature label={`${formatLimit(plan.max_team_members)} Team Members`} />
                  </ul>
                  <Button
                    className={`w-full mt-8 font-semibold ${
                      plan.is_featured
                        ? "bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white border-0"
                        : ""
                    }`}
                    variant={plan.is_featured ? "default" : "outline"}
                    asChild
                  >
                    <Link to={plan.is_contact_sales ? "/login" : `/checkout?plan=${plan.slug}`}>
                      {plan.is_contact_sales ? "Contact Us" : "Get Started"}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">No plans found.</p>
          )}
        </div>
      </section>

      <FAQSection />
      <CTABanner />
      <Footer />
    </PageLoadWrapper>
  );
};

const PlanFeature = ({ label }: { label: string }) => (
  <li className="flex items-center gap-2 text-sm text-gray-600">
    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
    {label}
  </li>
);

export default Index;