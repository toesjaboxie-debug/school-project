import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

// Cache for models
let modelsCache: any[] = [];
let cacheTime = 0;

// Report error to admin
async function reportError(userId: string, errorType: string, errorMessage: string, details?: string) {
  try {
    await db.errorReport.create({
      data: { errorType, errorMessage, details, reporterId: userId }
    });
  } catch (e) {
    console.error('Failed to report error:', e);
  }
}

async function fetchOpenRouterModels() {
  if (modelsCache.length > 0 && Date.now() - cacheTime < 3600000) {
    return modelsCache;
  }

  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set!');
    return [];
  }

  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
    });

    if (response.ok) {
      const data = await response.json();
      const models = data.data || [];
      models.sort((a: any, b: any) => {
        const priceA = parseFloat(a.pricing?.prompt || '0') + parseFloat(a.pricing?.completion || '0');
        const priceB = parseFloat(b.pricing?.prompt || '0') + parseFloat(b.pricing?.completion || '0');
        return priceA - priceB;
      });
      modelsCache = models;
      cacheTime = Date.now();
      return models;
    } else {
      const errorText = await response.text();
      console.error(`Failed to fetch models (${response.status}):`, errorText);
    }
  } catch (e: any) {
    console.error('Failed to fetch models:', e);
  }

  return [];
}

async function callOpenRouter(modelId: string, messages: any[], files?: string[]) {
  let userContent: any = messages[messages.length - 1]?.content || '';
  
  if (files && files.length > 0) {
    const content: any[] = [{ type: 'text', text: userContent }];
    for (const fileUrl of files) {
      content.push({ type: 'image_url', image_url: { url: fileUrl } });
    }
    messages[messages.length - 1] = { role: 'user', content };
  }
  
  const requestBody = {
    model: modelId,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  };

  console.log('Calling OpenRouter with model:', modelId);
  console.log('API Key exists:', !!OPENROUTER_API_KEY);
  console.log('API Key prefix:', OPENROUTER_API_KEY?.substring(0, 10) + '...');

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://hyperionedulearn.vercel.app',
      'X-Title': 'EduLearn AI',
    },
    body: JSON.stringify(requestBody),
  });
  
  return response;
}

export async function POST(request: NextRequest) {
  let userId = 'unknown';
  
  try {
    // Check API key first
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ 
        error: 'OPENROUTER_API_KEY niet geconfigureerd',
        exactError: 'Environment variable OPENROUTER_API_KEY is leeg of niet ingesteld. Ga naar Vercel Dashboard → Settings → Environment Variables en voeg toe.',
        tip: 'Voeg OPENROUTER_API_KEY toe in Vercel environment variables'
      }, { status: 500 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    userId = user.id;

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }
    
    const isPro = dbUser.isPro || false;
    const balance = dbUser.balance || 0;

    const body = await request.json();
    const { message, model, chatHistory, files, subject } = body;

    if (!message) {
      return NextResponse.json({ error: 'Bericht is vereist' }, { status: 400 });
    }

    const requestedModel = model || 'meta-llama/llama-3.2-3b-instruct:free';
    
    const models = await fetchOpenRouterModels();
    const modelInfo = models.find((m: any) => m.id === requestedModel);
    
    const promptPrice = parseFloat(modelInfo?.pricing?.prompt || '0');
    const completionPrice = parseFloat(modelInfo?.pricing?.completion || '0');
    const isFreeModel = promptPrice === 0 && completionPrice === 0;

    if (!isFreeModel && !isPro && balance <= 0) {
      await reportError(userId, 'INSUFFICIENT_BALANCE', `User tried paid model ${requestedModel}`);
      return NextResponse.json({ 
        error: '🔒 Dit is een betaald model',
        tip: 'Word Pro voor onbeperkte toegang of laad saldo op',
        requiresPro: true
      }, { status: 403 });
    }

    let systemPrompt = `Je bent een behulpzame AI-studieassistent voor Nederlandse scholieren. Antwoord ALTIJD in het Nederlands. Wees vriendelijk en educatief.`;
    if (subject) {
      systemPrompt += `\n\nDe student vraagt over het vak: ${subject}. Geef specifieke hulp voor dit vak.`;
    }

    const messages = [{ role: 'system', content: systemPrompt }];
    if (chatHistory?.length) {
      for (const msg of chatHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    messages.push({ role: 'user', content: message });

    const response = await callOpenRouter(requestedModel, messages, files);
    
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
      
      // No message in response
      return NextResponse.json({ 
        error: 'AI gaf geen antwoord',
        exactError: `Response was OK maar geen message gevonden. Response: ${JSON.stringify(completion).slice(0, 500)}`
      }, { status: 500 });
    }

    // Handle error response - SHOW EXACT ERROR
    const errorText = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorText);
    } catch {
      parsedError = { raw: errorText };
    }

    const exactError = parsedError.error?.message || parsedError.error?.metadata?.raw || parsedError.message || errorText.slice(0, 1000);
    const errorCode = parsedError.error?.code || response.status;

    // Report to admin
    await reportError(userId, `AI_CHAT_${response.status}`, exactError, `Model: ${requestedModel}\nFull: ${errorText}`);

    // 401 Unauthorized
    if (response.status === 401) {
      return NextResponse.json({ 
        error: '❌ API Key Ongeldig (401 Unauthorized)',
        exactError: exactError,
        details: `De OpenRouter API key wordt geweigerd. Mogelijke oorzaken:
- API key is verlopen of ingetrokken
- API key heeft niet de juiste rechten
- API key is niet correct gekopieerd

Current key: ${OPENROUTER_API_KEY?.substring(0, 15)}...${OPENROUTER_API_KEY?.slice(-4)}`,
        tip: 'Controleer je API key op openrouter.ai/keys',
        rawResponse: errorText.slice(0, 500)
      }, { status: 500 });
    }

    // 402 Payment Required
    if (response.status === 402) {
      return NextResponse.json({
        error: '💳 Niet genoeg credits (402 Payment Required)',
        exactError: exactError,
        tip: 'Voeg credits toe aan je OpenRouter account'
      }, { status: 500 });
    }

    // 429 Rate Limit
    if (response.status === 429) {
      return NextResponse.json({
        error: '⏳ Rate limit bereikt (429 Too Many Requests)',
        exactError: exactError,
        tip: 'Wacht even en probeer opnieuw'
      }, { status: 500 });
    }

    // Try free models as fallback
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
              modelName: fallbackModel.name || fallbackModel.id.split('/')[1],
              fallback: true,
              originalError: `Originele model (${requestedModel}) faalde met ${response.status}: ${exactError}`
            });
          }
        }
      } catch {}
    }

    return NextResponse.json({ 
      error: `AI server fout (${response.status})`,
      exactError: exactError,
      details: errorText.slice(0, 500),
      tip: 'Probeer een ander model of probeer later opnieuw'
    }, { status: 500 });

  } catch (error: any) {
    console.error('Chat error:', error);
    await reportError(userId, 'AI_CHAT_EXCEPTION', error.message, error.stack);
    
    return NextResponse.json({ 
      error: 'Er ging iets mis: ' + error.message,
      exactError: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// GET - Return all models sorted by price
export async function GET() {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ 
        error: 'OPENROUTER_API_KEY niet geconfigureerd. Voeg toe in Vercel Environment Variables.',
        models: [],
        isPro: false,
        balance: 0
      });
    }

    const user = await getCurrentUser();
    const dbUser = user ? await db.user.findUnique({ where: { id: user.id } }) : null;
    const isPro = dbUser?.isPro || false;
    const balance = dbUser?.balance || 0;

    const openRouterModels = await fetchOpenRouterModels();

    if (openRouterModels.length === 0) {
      return NextResponse.json({ 
        error: 'Kon geen modellen ophalen van OpenRouter. Controleer je API key.',
        models: [],
        isPro,
        balance
      });
    }

    const models = openRouterModels.map((m: any) => {
      const promptPrice = parseFloat(m.pricing?.prompt || '0');
      const completionPrice = parseFloat(m.pricing?.completion || '0');
      const isFree = promptPrice === 0 && completionPrice === 0;
      const pricePerMillion = (promptPrice + completionPrice) * 1000000;
      
      return {
        id: m.id,
        name: m.name || m.id.split('/')[1],
        description: m.description?.slice(0, 100) || '',
        isFree,
        pricePerMillion: pricePerMillion.toFixed(4),
        label: isFree ? '(gratis)' : `€${pricePerMillion.toFixed(2)}/1M`,
        available: isPro || isFree || balance > 0,
        context_length: m.context_length,
        supportsVision: m.architecture?.modality === 'multimodal' || m.id.includes('vision'),
      };
    });

    return NextResponse.json({ 
      models, 
      isPro, 
      balance,
      total: models.length,
      freeCount: models.filter(m => m.isFree).length
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      models: [],
      isPro: false,
      balance: 0
    });
  }
}
