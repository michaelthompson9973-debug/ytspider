import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Zap, ArrowRight } from "lucide-react";
import { z } from "zod";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { AuthSkeleton } from "@/components/landing/AuthSkeleton";
import { PageLoadWrapper } from "@/components/landing/PageLoadWrapper";

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষর হতে হবে").max(100),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(255),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে").max(72),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "পাসওয়ার্ড মিলছে না",
  path: ["confirmPassword"],
});

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse({ fullName, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট তৈরি করা হয়েছে");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল ভেরিফাই করুন, তারপর লগইন করে প্ল্যান বেছে নিন।");
      navigate("/pricing");
    } catch {
      toast.error("অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) return <AuthSkeleton />;

  return (
    <PageLoadWrapper>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-pink-50 p-4 pt-20">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-pink-600 bg-clip-text text-transparent">
                ShopFlow
              </span>
            </Link>
            <CardTitle className="text-2xl">অ্যাকাউন্ট তৈরি করুন</CardTitle>
            <CardDescription>ফ্রিতে শুরু করুন, পরে আপগ্রেড করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">পুরো নাম</Label>
                <Input id="fullName" placeholder="আপনার নাম" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="কমপক্ষে ৬ অক্ষর" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
                <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="আবার পাসওয়ার্ড দিন" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white border-0 font-semibold" disabled={isLoading}>
                {isLoading ? "তৈরি হচ্ছে..." : (<>অ্যাকাউন্ট তৈরি করুন <ArrowRight className="ml-2 h-4 w-4" /></>)}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link to="/login" className="text-violet-600 font-medium hover:underline">লগইন করুন</Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </PageLoadWrapper>
  );
}
