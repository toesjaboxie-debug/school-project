import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

// Cache for models
let modelsCache: any[] = [];
let cacheTime = 0;

async function fetchOpenRouterModels() {
  // Use cache if less than 1 hour old
  if (modelsCache.length > 0 && Date.now() - cacheTime < 3600000) {
    return modelsCache;
  }

  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const models = data.data || [];
      
      // Sort by price (cheapest first) - pricing is per 1M tokens
      models.sort((a: any, b: any) => {
        const priceA = parseFloat(a.pricing?.prompt || '0') + parseFloat(a.pricing?.completion || '0');
        const priceB = parseFloat(b.pricing?.prompt || '0') + parseFloat(b.pricing?.completion || '0');
        return priceA - priceB;
      });

      modelsCache = models;
      cacheTime = Date.now();
      return models;
    }
  } catch (e) {
    console.error('Failed to fetch models:', e);
  }

  return [];
}

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

    const requestedModel = model || 'meta-llama/llama-3.2-3b-instruct:free';
    
    // Get model info
    const models = await fetchOpenRouterModels();
    const modelInfo = models.find((m: any) => m.id === requestedModel);
    
    // Check if free model (price is 0)
    const isFreeModel = modelInfo ? 
      (parseFloat(modelInfo.pricing?.prompt || '1') === 0 && parseFloat(modelInfo.pricing?.completion || '1') === 0) :
      requestedModel.includes(':free');

    if (!isFreeModel && !isPro) {
      return NextResponse.json({ 
        error: `🔒 Dit is een betaald model`,
        tip: 'Upgrade naar Pro (€5) in Instellingen of kies een gratis model',
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

    // Try the requested model
    let response = await callOpenRouter(requestedModel, messages);
    
    if (response.ok) {
      const completion = await response.json();
      const aiMessage = completion.choices?.[0]?.message?.content;

      if (aiMessage) {
        return NextResponse.json({ 
          message: aiMessage, 
          model: requestedModel, 
          modelName: modelInfo?.name || requestedModel.split('/')[1]
        });
      }
    }

    // If failed, try free models as fallback
    const freeModels = models.filter((m: any) => 
      parseFloat(m.pricing?.prompt || '1') === 0 && 
      parseFloat(m.pricing?.completion || '1') === 0 &&
      m.id !== requestedModel
    );

    for (const fallbackModel of freeModels.slice(0, 5)) {
      try {
        const fallbackResponse = await callOpenRouter(fallbackModel.id, messages);
        if (fallbackResponse.ok) {
          const completion = await fallbackResponse.json();
          const aiMessage = completion.choices?.[0]?.message?.content;
          if (aiMessage) {
            return NextResponse.json({ 
              message: aiMessage, 
              model: fallbackModel.id, 
              modelName: fallbackModel.name + ' (fallback)'
            });
          }
        }
      } catch {}
    }

    const errorData = await response.text();
    return NextResponse.json({ 
      error: `AI server fout (${response.status})`,
      details: errorData,
      tip: 'Probeer een ander model'
    }, { status: 500 });

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ 
      error: 'Er ging iets mis: ' + error.message
    }, { status: 500 });
  }
}

// GET - Return all models sorted by price
export async function GET() {
  const user = await getCurrentUser();
  const dbUser = user ? await db.user.findUnique({ where: { id: user.id } }) : null;
  const isPro = dbUser?.isPro || false;

  const openRouterModels = await fetchOpenRouterModels();

  const models = openRouterModels.map((m: any) => {
    const promptPrice = parseFloat(m.pricing?.prompt || '0');
    const completionPrice = parseFloat(m.pricing?.completion || '0');
    const isFree = promptPrice === 0 && completionPrice === 0;
    
    return {
      id: m.id,
      name: m.name || m.id.split('/')[1],
      description: m.description?.slice(0, 50) || '',
      isFree,
      label: isFree ? '(free)' : `(€${(promptPrice * 1000000).toFixed(2)}/1M)`,
      available: isFree || isPro,
      context_length: m.context_length,
    };
  });

  return NextResponse.json({ models, isPro, total: models.length });
}
