import { FileText, Globe, Pencil, ShoppingCart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnhancedStats } from './types';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  gradient: string;
  iconBg: string;
}

function StatCard({ icon: Icon, label, value, subtext, gradient, iconBg }: StatCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-4 sm:p-5",
      "bg-gradient-to-br shadow-md hover:shadow-lg transition-all duration-300",
      "hover:scale-[1.02] hover:-translate-y-0.5",
      gradient
    )}>
      <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/5" />
      <div className="relative z-10 flex items-start gap-3">
        <div className={cn("flex-shrink-0 p-2.5 sm:p-3 rounded-xl shadow-sm", iconBg)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-white/80 truncate mb-0.5">{label}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-digit tracking-tight text-white drop-shadow-sm">{value}</p>
          {subtext && <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

interface Props {
  stats: EnhancedStats | null | undefined;
}

export function LandingPageStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
      <StatCard icon={FileText} label="মোট পেজ" value={stats?.total ?? 0}
        gradient="from-slate-700 via-slate-800 to-slate-900" iconBg="bg-white/20 backdrop-blur-sm" />
      <StatCard icon={Globe} label="পাবলিশড" value={stats?.published ?? 0}
        gradient="from-emerald-500 via-emerald-600 to-teal-700" iconBg="bg-white/20 backdrop-blur-sm" />
      <StatCard icon={Pencil} label="ড্রাফট" value={stats?.draft ?? 0}
        gradient="from-amber-400 via-orange-500 to-orange-600" iconBg="bg-white/20 backdrop-blur-sm" />
      <StatCard icon={ShoppingCart} label="মোট অর্ডার" value={stats?.totalOrders ?? 0}
        gradient="from-blue-500 via-blue-600 to-indigo-700" iconBg="bg-white/20 backdrop-blur-sm" />
      <StatCard icon={TrendingUp} label="এই সপ্তাহে" value={stats?.thisWeek ?? 0} subtext="নতুন পেজ"
        gradient="from-pink-500 via-rose-500 to-red-600" iconBg="bg-white/20 backdrop-blur-sm" />
    </div>
  );
}
