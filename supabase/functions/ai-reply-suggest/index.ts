import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TrainingData {
  category: string;
  title: string;
  content: string;
  keywords: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { customerMessage, conversationHistory = [], connectionId } = await req.json();

    if (!customerMessage) {
      return new Response(
        JSON.stringify({ error: 'Customer message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing AI reply for message:', customerMessage.substring(0, 100));

    // Fetch training data
    const { data: trainingData, error: trainingError } = await supabase
      .from('ai_training_data')
      .select('category, title, content, keywords')
      .eq('is_active', true);

    if (trainingError) {
      console.error('Error fetching training data:', trainingError);
    }

    // Fetch active auto-reply rules
    const { data: autoRules, error: rulesError } = await supabase
      .from('auto_reply_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (rulesError) {
      console.error('Error fetching auto-reply rules:', rulesError);
    }

    // Check keyword-based rules first
    const lowerMessage = customerMessage.toLowerCase();
    let matchedRule = null;

    for (const rule of autoRules || []) {
      if (rule.trigger_type === 'keyword') {
        const keywords = rule.trigger_conditions?.keywords as string[] || [];
        const matched = keywords.some(keyword => 
          lowerMessage.includes(keyword.toLowerCase())
        );
        if (matched) {
          matchedRule = rule;
          break;
        }
      }
    }

    // If we have a matched keyword rule, return its response
    if (matchedRule && matchedRule.response_type === 'text') {
      // Update use count
      await supabase
        .from('auto_reply_rules')
        .update({ use_count: (matchedRule.use_count || 0) + 1 })
        .eq('id', matchedRule.id);

      return new Response(
        JSON.stringify({
          suggestion: matchedRule.response_content,
          matchedRule: matchedRule.name,
          confidence: 'high',
          source: 'keyword_rule'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from training data
    const trainingContext = (trainingData || []).map((item: TrainingData) => 
      `[${item.category.toUpperCase()}] ${item.title}:\n${item.content}`
    ).join('\n\n');

    // Build conversation history for context
    const historyContext = conversationHistory
      .slice(-5)
      .map((msg: { role: string; content: string }) => 
        `${msg.role === 'customer' ? 'গ্রাহক' : 'আমরা'}: ${msg.content}`
      )
      .join('\n');

    const systemPrompt = `আপনি একজন বাংলাদেশী ই-কমার্স কাস্টমার সার্ভিস এজেন্ট। আপনার কাজ হলো গ্রাহকদের প্রশ্নের সংক্ষিপ্ত এবং সহায়ক উত্তর দেওয়া।

## নির্দেশনা:
- বাংলায় উত্তর দিন
- সংক্ষিপ্ত এবং স্পষ্ট উত্তর দিন
- বন্ধুত্বপূর্ণ কিন্তু পেশাদার টোন রাখুন
- যদি অর্ডার সম্পর্কিত প্রশ্ন হয়, নাম এবং ঠিকানা জিজ্ঞাসা করুন
- যদি দাম জিজ্ঞাসা করা হয়, সঠিক দাম বলুন
- যদি উত্তর জানা না থাকে, বলুন যে একজন এজেন্ট শীঘ্রই সাহায্য করবে

## প্রোডাক্ট এবং পলিসি তথ্য:
${trainingContext || 'কোনো ট্রেনিং ডেটা নেই'}

## আগের কথোপকথন:
${historyContext || 'নতুন কথোপকথন'}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `গ্রাহকের মেসেজ: "${customerMessage}"\n\nএই মেসেজের জন্য একটি সংক্ষিপ্ত উত্তর সাজেশন দিন।` }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limit exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted, please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const aiResponse = await response.json();
    const suggestion = aiResponse.choices?.[0]?.message?.content?.trim() || '';

    console.log('AI suggestion generated successfully');

    return new Response(
      JSON.stringify({
        suggestion,
        confidence: 'medium',
        source: 'ai_generated'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI reply suggest error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
