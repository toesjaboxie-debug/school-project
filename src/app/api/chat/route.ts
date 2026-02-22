import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// OpenRouter API Key
const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// All models
const ALL_MODELS: Record<string, { name: string; description: string; isFree: boolean }> = {
  // FREE Models
  'google/gemma-3-1b-it:free': { name: 'Gemma 3 1B', description: 'Snel', isFree: true },
  'google/gemma-3-4b-it:free': { name: 'Gemma 3 4B', description: 'Balans', isFree: true },
  'google/gemma-3-12b-it:free': { name: 'Gemma 3 12B', description: 'Capabel', isFree: true },
  'meta-llama/llama-3.2-1b-instruct:free': { name: 'Llama 3.2 1B', description: 'Snel', isFree: true },
  'meta-llama/llama-3.2-3b-instruct:free': { name: 'Llama 3.2 3B', description: 'Balans', isFree: true },
  'meta-llama/llama-3.1-8b-instruct:free': { name: 'Llama 3.1 8B', description: 'Krachtig', isFree: true },
  'qwen/qwen3-1.7b:free': { name: 'Qwen 3 1.7B', description: 'Compact', isFree: true },
  'qwen/qwen3-4b:free': { name: 'Qwen 3 4B', description: 'Veelzijdig', isFree: true },
  'qwen/qwen-2.5-7b-instruct:free': { name: 'Qwen 2.5 7B', description: 'Kwaliteit', isFree: true },
  'deepseek/deepseek-r1-0528:free': { name: 'DeepSeek R1', description: 'Redeneren', isFree: true },
  'deepseek/deepseek-chat-v3-0324:free': { name: 'DeepSeek V3', description: 'Chat', isFree: true },
  'mistralai/mistral-7b-instruct:free': { name: 'Mistral 7B', description: 'Efficiënt', isFree: true },
  'huggingfaceh4/zephyr-7b-beta:free': { name: 'Zephyr 7B', description: 'Open source', isFree: true },
  
  // PAID Models
  'openai/gpt-4o': { name: 'GPT-4o', description: 'Beste AI', isFree: false },
  'openai/gpt-4o-mini': { name: 'GPT-4o Mini', description: 'Snel & goedkoop', isFree: false },
  'openai/gpt-4-turbo': { name: 'GPT-4 Turbo', description: 'Krachtig', isFree: false },
  'anthropic/claude-3.5-sonnet': { name: 'Claude 3.5 Sonnet', description: 'Coderen', isFree: false },
  'anthropic/claude-3-opus': { name: 'Claude 3 Opus', description: 'Meest capabel', isFree: false },
  'google/gemini-pro-1.5': { name: 'Gemini Pro 1.5', description: 'Google', isFree: false },
  'meta-llama/llama-3.2-90b-vision-instruct': { name: 'Llama 3.2 90B', description: 'Grootste', isFree: false },
};

async function callOpenRouter(modelId: string, messages: any[]) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://hyperionedulearn.vercel.app',
      'X-Title': 'EduLearn AI',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    const isPro = dbUser?.isPro || false;

    const body = await request.json();
    const { message, model, chatHistory } = body;

    if (!message) {
      return NextResponse.json({ error: 'Bericht is vereist' }, { status: 400 });
    }

    const requestedModel = model || 'google/gemma-3-4b-it:free';
    const modelConfig = ALL_MODELS[requestedModel];

    if (!modelConfig) {
      return NextResponse.json({ error: 'Model niet gevonden' }, { status: 400 });
    }

    if (!modelConfig.isFree && !isPro) {
      return NextResponse.json({ 
        error: `🔒 ${modelConfig.name} is een Pro model`,
        tip: 'Upgrade naar Pro (€5 eenmalig) in Instellingen',
        requiresPro: true
      }, { status: 403 });
    }

    const systemPrompt = `Je bent een behulpzame AI-studieassistent voor Nederlandse scholieren. Antwoord ALTIJD in het Nederlands. Wees vriendelijk en educatief.`;

    const messages = [{ role: 'system', content: systemPrompt }];
    
    if (chatHistory?.length) {
      for (const msg of chatHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    messages.push({ role: 'user', content: message });

    // Try the model
    const response = await callOpenRouter(requestedModel, messages);
    
    if (response.ok) {
      const completion = await response.json();
      const aiMessage = completion.choices?.[0]?.message?.content;

      if (aiMessage) {
        return NextResponse.json({ 
          message: aiMessage, 
          model: requestedModel, 
          modelName: modelConfig.name
        });
      }
    }

    // If failed, try fallback models (only free ones)
    const errorText = await response.text();
    
    // Try fallback
    const freeModels = Object.keys(ALL_MODELS).filter(id => ALL_MODELS[id].isFree && id !== requestedModel);
    
    for (const fallbackId of freeModels) {
      try {
        const fallbackResponse = await callOpenRouter(fallbackId, messages);
        if (fallbackResponse.ok) {
          const completion = await fallbackResponse.json();
          const aiMessage = completion.choices?.[0]?.message?.content;
          if (aiMessage) {
            return NextResponse.json({ 
              message: aiMessage, 
              model: fallbackId, 
              modelName: ALL_MODELS[fallbackId].name + ' (fallback)'
            });
          }
        }
      } catch {}
    }

    return NextResponse.json({ 
      error: `AI server fout (${response.status})`,
      tip: 'Probeer een ander model of probeer later opnieuw'
    }, { status: 500 });

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ 
      error: 'Er ging iets mis: ' + error.message
    }, { status: 500 });
  }
}

// GET - Return all models
export async function GET() {
  const user = await getCurrentUser();
  const dbUser = user ? await db.user.findUnique({ where: { id: user.id } }) : null;
  const isPro = dbUser?.isPro || false;

  const models = Object.entries(ALL_MODELS).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
    isFree: config.isFree,
    label: config.isFree ? '(free)' : '(paid)',
    available: config.isFree || isPro
  }));

  return NextResponse.json({ models, isPro });
}
