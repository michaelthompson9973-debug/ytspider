

# "/" রুটে পাবলিক ল্যান্ডিং পেজ তৈরি

## সমস্যা
বর্তমানে `/` রুট থেকে `/shop` এ রিডাইরেক্ট হয়। ইউজার চান এখানে একটি রঙিন, ভিজুয়াল পাবলিক ল্যান্ডিং পেজ থাকুক যেটা প্ল্যাটফর্মের পরিচিতি দেবে।

## পরিকল্পনা

### ধাপ ১: `src/pages/Index.tsx` সম্পূর্ণ রিরাইট

একটি ফুল পাবলিক ল্যান্ডিং পেজ তৈরি হবে যেটায় থাকবে:

**Header (Sticky)**
- ShopFlow লোগো (বাম)
- নেভিগেশন: Features, Pricing
- বাটন: "লগইন" → `/login`, "Get Started" → `/login`

**Hero Section (গ্র্যাডিয়েন্ট ব্যাকগ্রাউন্ড)**
- বড় হেডলাইন: "আপনার অনলাইন শপ তৈরি করুন মিনিটেই"
- সাবটেক্সট: প্ল্যাটফর্মের সংক্ষিপ্ত বর্ণনা
- দুটি CTA বাটন: "Create Account" → `/login`, "Get Started" → `/login`
- রঙিন গ্র্যাডিয়েন্ট (purple → blue → pink)

**Features Section**
- আইকন কার্ড গ্রিড (3 কলাম desktop, 1 কলাম mobile)
- ফিচার তালিকা:
  - 🏪 মাল্টিপল শপ তৈরি ও ম্যানেজ
  - 🤖 AI Integrated অর্ডার ম্যানেজমেন্ট
  - 📦 কুরিয়ার ইন্টিগ্রেশন (Pathao, Steadfast)
  - 📱 মোবাইল-ফার্স্ট ল্যান্ডিং পেজ বিল্ডার
  - 💬 Messenger/WhatsApp ইনবক্স
  - 📊 রিয়েলটাইম অ্যানালিটিক্স
- প্রতিটি কার্ডে রঙিন আইকন ব্যাকগ্রাউন্ড

**Pricing Section**
- ডাটাবেস থেকে `usePricingPlans(true)` দিয়ে প্ল্যান ফেচ
- বর্তমান Pricing.tsx পেজের মতো কার্ড লেআউট
- CTA বাটন: "এখনই শুরু করুন" → `/checkout?plan=slug`

**Footer**
- ShopFlow ব্র্যান্ডিং
- লিংক: Pricing, Login, Contact
- কপিরাইট

### ধাপ ২: App.tsx রাউট আপডেট

```text
// আগে:
<Route path="/" element={<Navigate to="/shop" replace />} />

// পরে:
<Route path="/" element={<Index />} />
```

### ধাপ ৩: ডিজাইন স্টাইল

- **রঙিন গ্র্যাডিয়েন্ট**: Hero তে `bg-gradient-to-br from-violet-600 via-blue-600 to-pink-500`
- Feature কার্ডে রঙিন icon badge (violet, blue, green, orange, pink, cyan)
- Pricing কার্ডে featured plan এ ring + scale effect
- Section separator গুলোতে subtle gradient

---

## ফাইল পরিবর্তন

| ফাইল | ধরন |
|------|------|
| `src/pages/Index.tsx` | আপডেট (সম্পূর্ণ রিরাইট) |
| `src/App.tsx` | আপডেট (লাইন ৮৯: Navigate → Index কম্পোনেন্ট) |

