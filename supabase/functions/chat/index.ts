import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Extract token and Authenticate user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth Error Details:', authError)
      throw new Error('Unauthorized: Invalid User Session')
    }

    const body = await req.json()
    console.log('Request body received for user:', user.id)
    const { messages, session_id, track, module } = body

    // 1. Setup specialized System Prompt
    const systemPrompt = `You are TESDA-Bot, a premium academic assistant for vocational students in the Philippines. 
    Current Track: ${track}
    ${module ? `Active Module: ${module}` : 'General Inquiry'}
    
    Instructions:
    - Be patient, encouraging, and professional.
    - Use local Philippine context where relevant.
    - Focus on help with NCII Training Regulations and technical mastery.
    - If a student asks something unrelated to their studies, gently guide them back to the topic.
    - Keep responses concise but comprehensive.`

    // 2. Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`DeepSeek API Error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const botContent = data.choices[0].message.content

    // 3. Persist bot message to database (schema-constraints best practice)
    if (session_id) {
      await supabaseClient.from('chat_messages').insert({
        session_id,
        user_id: user.id,
        role: 'assistant',
        content: botContent
      })
    }

    return new Response(JSON.stringify({ content: botContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
