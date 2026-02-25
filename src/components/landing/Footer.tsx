import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const Footer = () => (
  <footer id="contact" className="border-t border-gray-100 bg-gray-50" style={{ fontFamily: "'Poppins', 'Hind Siliguri', sans-serif" }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">ShopFlow</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            বাংলাদেশের উদ্যোক্তাদের জন্য সবচেয়ে সহজ ই-কমার্স প্ল্যাটফর্ম।
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><a href="#features" className="hover:text-violet-600 transition-colors">Features</a></li>
            <li><a href="#pricing" className="hover:text-violet-600 transition-colors">Pricing</a></li>
            <li><a href="#how-it-works" className="hover:text-violet-600 transition-colors">How It Works</a></li>
            <li><a href="#faq" className="hover:text-violet-600 transition-colors">FAQ</a></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><a href="#" className="hover:text-violet-600 transition-colors">About Us</a></li>
            <li><a href="#contact" className="hover:text-violet-600 transition-colors">Contact</a></li>
            <li><a href="#" className="hover:text-violet-600 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-violet-600 transition-colors">Terms of Service</a></li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Connect</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><a href="#" className="hover:text-violet-600 transition-colors">Facebook</a></li>
            <li><a href="#" className="hover:text-violet-600 transition-colors">LinkedIn</a></li>
            <li><a href="#" className="hover:text-violet-600 transition-colors">Twitter / X</a></li>
            <li><Link to="/login" className="hover:text-violet-600 transition-colors">Login</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-10 pt-6 text-center space-y-1">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} ShopFlow. All rights reserved.</p>
        <p className="text-xs text-gray-400">আর্কিটেক্ট: আল গিফারী</p>
      </div>
    </div>
  </footer>
);

export default Footer;
