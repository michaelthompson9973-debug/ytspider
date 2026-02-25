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
  { icon: Store, title: "মাল্টিপল শপ তৈরি ও ম্যানেজ", description: "একটি অ্যাকাউন্ট থেকে একাধিক শপ পরিচালনা করুন সহজেই।", bg: "bg-violet-100 text-violet-700" },
  { icon: Bot, title: "AI Integrated অর্ডার ম্যানেজমেন্ট", description: "AI-পাওয়ার্ড ফ্রড ডিটেকশন ও স্মার্ট অর্ডার প্রসেসিং।", bg: "bg-blue-100 text-blue-700" },
  { icon: Package, title: "কুরিয়ার ইন্টিগ্রেশন", description: "Pathao, Steadfast সহ একাধিক কুরিয়ার সার্ভিস সরাসরি সংযুক্ত।", bg: "bg-emerald-100 text-emerald-700" },
  { icon: Smartphone, title: "মোবাইল-ফার্স্ট ল্যান্ডিং পেজ বিল্ডার", description: "ড্র্যাগ অ্যান্ড ড্রপে সুন্দর ল্যান্ডিং পেজ তৈরি করুন।", bg: "bg-orange-100 text-orange-700" },
  { icon: MessageCircle, title: "Messenger / WhatsApp ইনবক্স", description: "সব মেসেজ এক জায়গায়। কাস্টমারদের সাথে রিয়েলটাইম চ্যাট।", bg: "bg-pink-100 text-pink-700" },
  { icon: BarChart3, title: "রিয়েলটাইম অ্যানালিটিক্স", description: "সেলস, অর্ডার ও কাস্টমার ডেটা রিয়েলটাইমে ট্র্যাক করুন।", bg: "bg-cyan-100 text-cyan-700" },
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
            আপনার অনলাইন শপ তৈরি করুন
            <span className="block mt-2 text-yellow-300">মিনিটেই</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            ShopFlow দিয়ে প্রোডাক্ট আপলোড, অর্ডার ম্যানেজ, কুরিয়ার ইন্টিগ্রেশন এবং ল্যান্ডিং পেজ — সবকিছু এক জায়গায়।
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">সব ফিচার এক প্ল্যাটফর্মে</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
              আপনার ই-কমার্স ব্যবসা পরিচালনার জন্য যা কিছু দরকার — সবই ShopFlow-তে।
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">প্রাইসিং প্ল্যান</h2>
            <p className="mt-4 text-gray-500 text-lg">আপনার ব্যবসার জন্য সেরা প্ল্যান বেছে নিন।</p>
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
                      জনপ্রিয়
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {plan.description && <p className="mt-1 text-sm text-gray-500">{plan.description}</p>}
                  <div className="mt-4">
                    {plan.is_contact_sales ? (
                      <span className="text-2xl font-bold text-gray-900">যোগাযোগ করুন</span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold text-gray-900">৳{plan.price_monthly.toLocaleString("bn-BD")}</span>
                        <span className="text-gray-500 text-sm">/মাস</span>
                      </>
                    )}
                  </div>
                  <ul className="mt-6 space-y-3">
                    <PlanFeature label={`${formatLimit(plan.max_shops)} শপ`} />
                    <PlanFeature label={`${formatLimit(plan.max_products)} প্রোডাক্ট`} />
                    <PlanFeature label={`${formatLimit(plan.max_landing_pages)} ল্যান্ডিং পেজ`} />
                    <PlanFeature label={`প্রতিদিন সর্বোচ্চ ${formatLimit(plan.max_orders_per_month)} অর্ডার`} />
                    <PlanFeature label={`${formatLimit(plan.max_team_members)} টিম মেম্বার`} />
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
                      {plan.is_contact_sales ? "যোগাযোগ করুন" : "এখনই শুরু করুন"}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">কোনো প্ল্যান পাওয়া যায়নি।</p>
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
