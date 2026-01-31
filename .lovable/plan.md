
# Thank You পেজে ল্যান্ডিং পেজ থিম ইন্টিগ্রেশন

## ✅ বাস্তবায়িত

Thank You পেজ এখন অর্ডারের `landing_page_id` থেকে থিম fetch করে এবং সেই অনুযায়ী স্টাইল প্রয়োগ করে।

```text
Order (landing_page_id) ─────> landing_page_theme ─────> Thank You Page
                                   │
                                   ├── primaryColor ✅
                                   ├── headingFont ✅
                                   ├── bodyFont ✅
                                   ├── buttonFont ✅
                                   ├── digitFont ✅
                                   └── buttonStyle ✅
```

## পরিবর্তন সারাংশ

| ফাইল | পরিবর্তন |
|------|----------|
| `src/pages/ThankYou.tsx` | Theme query, font loading, CSS injection, dynamic styling, skeleton loader |

## থিম প্রভাব

| থিম সেটিং | Thank You পেজে প্রভাব |
|-----------|----------------------|
| Primary Color | টাইটেল, আইকন, বাটন, মূল্য সামারি রঙ |
| Heading Font | "ধন্যবাদ!", সেকশন হেডার ফন্ট |
| Body Font | প্যারাগ্রাফ, গ্রাহক তথ্য ফন্ট |
| Digit Font | দাম, অর্ডার আইডি, ফোন নম্বর ফন্ট |
| Button Font | "হোমে ফিরুন" বাটন ফন্ট |
| Button Style | বাটন বর্ডার রেডিয়াস (rounded/square/pill) |
| Background Color | পেজ ব্যাকগ্রাউন্ড |
