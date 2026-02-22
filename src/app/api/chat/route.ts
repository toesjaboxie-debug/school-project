import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// OpenRouter API Key
const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// All models with free/paid status
const ALL_MODELS: Record<string, { name: string; description: string; isFree: boolean }> = {
  // FREE Models
  'google/gemma-3-1b-it:free': { name: 'Gemma 3 1B', description: 'Snel en lichtgewicht', isFree: true },
  'google/gemma-3-4b-it:free': { name: 'Gemma 3 4B', description: 'Balans tussen snelheid en kwaliteit', isFree: true },
  'google/gemma-3-12b-it:free': { name: 'Gemma 3 12B', description: 'Meest capabele Gemma', isFree: true },
  'meta-llama/llama-3.2-1b-instruct:free': { name: 'Llama 3.2 1B', description: 'Snel en efficiënt', isFree: true },
  'meta-llama/llama-3.2-3b-instruct:free': { name: 'Llama 3.2 3B', description: 'Goede balans', isFree: true },
  'meta-llama/llama-3.1-8b-instruct:free': { name: 'Llama 3.1 8B', description: 'Krachtige Llama', isFree: true },
  'qwen/qwen3-1.7b:free': { name: 'Qwen 3 1.7B', description: 'Compact en snel', isFree: true },
  'qwen/qwen3-4b:free': { name: 'Qwen 3 4B', description: 'Veelzijdig', isFree: true },
  'qwen/qwen-2.5-7b-instruct:free': { name: 'Qwen 2.5 7B', description: 'Uitstekende kwaliteit', isFree: true },
  'deepseek/deepseek-r1-0528:free': { name: 'DeepSeek R1', description: 'Redeneren en denken', isFree: true },
  'deepseek/deepseek-chat-v3-0324:free': { name: 'DeepSeek V3', description: 'Krachtige chat', isFree: true },
  'mistralai/mistral-7b-instruct:free': { name: 'Mistral 7B', description: 'Efficiënt en krachtig', isFree: true },
  
  // PAID Models (Pro only)
  'openai/gpt-4o': { name: 'GPT-4o', description: 'Meest geavanceerde AI', isFree: false },
  'openai/gpt-4o-mini': { name: 'GPT-4o Mini', description: 'Snel en goedkoop', isFree: false },
  'openai/gpt-4-turbo': { name: 'GPT-4 Turbo', description: 'Krachtige GPT-4', isFree: false },
  'openai/chatgpt-4o-latest': { name: 'ChatGPT-4o', description: 'Laatste ChatGPT', isFree: false },
  'anthropic/claude-3.5-sonnet': { name: 'Claude 3.5 Sonnet', description: 'Beste voor coderen', isFree: false },
  'anthropic/claude-3-opus': { name: 'Claude 3 Opus', description: 'Meest capabele Claude', isFree: false },
  'google/gemini-pro-1.5': { name: 'Gemini Pro 1.5', description: 'Google\'s beste', isFree: false },
  'meta-llama/llama-3.2-90b-vision-instruct': { name: 'Llama 3.2 90B', description: 'Grootste Llama', isFree: false },
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
      return NextResponse.json({ error: 'Niet ingelogd. Log in om te chatten.' }, { status: 401 });
    }

    // Check if user has Pro
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    const isPro = dbUser?.isPro || false;

    const body = await request.json();
    const { message, model, chatHistory, includeGrades, includeUpcoming } = body;

    if (!message) {
      return NextResponse.json({ error: 'Bericht is vereist' }, { status: 400 });
    }

    // Determine which model to use
    const requestedModel = model || 'google/gemma-3-4b-it:free';
    const modelConfig = ALL_MODELS[requestedModel];

    if (!modelConfig) {
      return NextResponse.json({ 
        error: 'Model niet gevonden',
        tip: 'Kies een geldig model uit de lijst.'
      }, { status: 400 });
    }

    // Check if trying to use paid model without Pro
    if (!modelConfig.isFree && !isPro) {
      return NextResponse.json({ 
        error: `🔒 ${modelConfig.name} is een Pro model`,
        tip: 'Upgrade naar Pro (€5 eenmalig) om alle modellen te gebruiken. Ga naar Instellingen > Pro Upgraden.',
        requiresPro: true
      }, { status: 403 });
    }

    // Build context
    const contextParts: string[] = [];

    if (includeGrades) {
      try {
        const grades = await db.grade.findMany({ 
          where: { studentId: user.id }, 
          orderBy: { date: 'desc' }, 
          take: 10 
        });
        if (grades.length > 0) {
          const gradesInfo = grades.map(g => `- ${g.subject}: ${g.testName} - Cijfer: ${g.grade}/${g.maxGrade}`).join('\n');
          contextParts.push(`Mijn recente cijfers:\n${gradesInfo}`);
        }
      } catch {}
    }

    if (includeUpcoming) {
      try {
        const upcomingTests = await db.agenda.findMany({ 
          where: { testDate: { gte: new Date() } }, 
          orderBy: { testDate: 'asc' }, 
          take: 5 
        });
        if (upcomingTests.length > 0) {
          const upcomingInfo = upcomingTests.map(a => `- ${a.title} (${a.subject}) - ${new Date(a.testDate).toLocaleDateString('nl-NL')}`).join('\n');
          contextParts.push(`Aanstaande toetsen:\n${upcomingInfo}`);
        }
      } catch {}
    }

    const systemPrompt = contextParts.length > 0
      ? `Je bent een behulpzame AI-studieassistent voor Nederlandse scholieren. Je spreekt ALTIJD in het Nederlands.\n\nInformatie over de leerling:\n${contextParts.join('\n\n')}\n\nInstructies:\n- Antwoord ALTIJD in het Nederlands\n- Wees behulpzaam, vriendelijk en educatief\n- Geef studietips waar mogelijk`
      : `Je bent een behulpzame AI-studieassistent voor Nederlandse scholieren. Antwoord ALTIJD in het Nederlands. Wees vriendelijk, geduldig en educatief. Geef studietips en leg dingen duidelijk uit.`;

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
    try {
      const response = await callOpenRouter(requestedModel, messages);

      if (response.ok) {
        const completion = await response.json();
        const aiMessage = completion.choices?.[0]?.message?.content;

        if (aiMessage) {
          return NextResponse.json({ 
            message: aiMessage, 
            model: requestedModel, 
            modelName: modelConfig.name,
            isFree: modelConfig.isFree
          });
        } else {
          return NextResponse.json({ 
            error: 'Model gaf geen antwoord',
            details: JSON.stringify(completion),
            tip: 'Probeer een ander model.'
          }, { status: 500 });
        }
      } else {
        const errorText = await response.text();
        let errorDetails = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || errorText;
        } catch {}

        // If free model fails, try fallback to another free model
        if (modelConfig.isFree) {
          const freeModels = Object.entries(ALL_MODELS).filter(([id, m]) => m.isFree && id !== requestedModel);
          for (const [fallbackId, fallbackConfig] of freeModels.slice(0, 3)) {
            try {
              const fallbackResponse = await callOpenRouter(fallbackId, messages);
              if (fallbackResponse.ok) {
                const completion = await fallbackResponse.json();
                const aiMessage = completion.choices?.[0]?.message?.content;
                if (aiMessage) {
                  return NextResponse.json({ 
                    message: aiMessage, 
                    model: fallbackId, 
                    modelName: fallbackConfig.name + ' (fallback)',
                    isFree: true
                  });
                }
              }
            } catch {}
          }
        }

        return NextResponse.json({ 
          error: `❌ ${modelConfig.name} fout (${response.status})`,
          details: errorDetails,
          tip: modelConfig.isFree ? 'Probeer een ander gratis model.' : 'Probeer een gratis model of upgrade naar Pro.'
        }, { status: response.status });
      }
    } catch (e: any) {
      return NextResponse.json({ 
        error: 'Kon geen verbinding maken met de AI server',
        details: e.message,
        tip: 'Controleer je internetverbinding en probeer opnieuw.'
      }, { status: 503 });
    }

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ 
      error: 'Er ging iets mis: ' + error.message,
      details: error.stack
    }, { status: 500 });
  }
}

// GET - Return available models
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

  return NextResponse.json({ 
    models,
    isPro,
    proPrice: 5
  });
}
