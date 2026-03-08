import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTABanner = () => (
  <section className="relative overflow-hidden py-20 sm:py-28">
    <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-blue-600 to-pink-500" />
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-white">Start Your Online Shop Today</h2>
      <p className="mt-4 text-lg text-white/80">
        Thousands of entrepreneurs already use ShopFlow. Join now — completely free!
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button size="lg" className="bg-white text-violet-700 hover:bg-gray-100 font-semibold text-base px-8 shadow-xl" asChild>
          <Link to="/register">
            Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

export default CTABanner;