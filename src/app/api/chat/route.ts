import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// API configuration for routeway.ai
const API_KEY = 'sk-AD9Krql_uLXSDOHNNnFWB_5MJcZdkQU8w_4ozfvE_HSD2PNsS_gLngY-lR5eID0-FoMa7LmCzloNaA';
const API_BASE_URL = 'https://api.routeway.ai/v1';

// Available free models
const AVAILABLE_MODELS: Record<string, string> = {
  'glm-4.5-air:free': 'GLM 4.5 Air',
  'kimi-k2-0905:free': 'Kimi K2',
  'minimax-m2:free': 'MiniMax M2',
  'gpt-oss-120b:free': 'GPT OSS 120B',
  'deepseek-r1-0528:free': 'DeepSeek R1',
  'devstral-2512:free': 'Devstral',
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, fileId, subject, agendaId, model, chatHistory, saveHistory, historyId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Bericht is vereist' },
        { status: 400 }
      );
    }

    // Validate model
    const selectedModel = model && AVAILABLE_MODELS[model] ? model : 'glm-4.5-air:free';

    // Build context content
    let contextContent = '';
    let contextInfo: string[] = [];

    // Get specific file content if fileId provided
    if (fileId && db.file) {
      const file = await db.file.findUnique({
        where: { id: fileId },
      });

      if (file) {
        contextContent = `Lesmateriaal: ${file.title}\nVak: ${file.subject}\nBeschrijving: ${file.description}\n\nInhoud:\n${file.content}`;
        contextInfo.push(`lesmateriaal "${file.title}" (${file.subject})`);
      }
    }

    // Get agenda/test info if agendaId provided
    if (agendaId && db.agenda) {
      const agendaItem = await db.agenda.findUnique({
        where: { id: agendaId },
      });

      if (agendaItem) {
        const testInfo = `Toets: ${agendaItem.title}\nVak: ${agendaItem.subject}\nType: ${agendaItem.type}\nDatum: ${new Date(agendaItem.testDate).toLocaleDateString('nl-NL')}\nBeschrijving: ${agendaItem.description || 'Geen beschrijving'}`;
        contextContent = contextContent ? `${contextContent}\n\n---\n\n${testInfo}` : testInfo;
        contextInfo.push(`toets "${agendaItem.title}" (${agendaItem.subject})`);
      }
    }

    // If subject is provided, get all content for that subject
    if (subject && !fileId && !agendaId && db.file) {
      const files = await db.file.findMany({
        where: { subject },
        select: {
          title: true,
          description: true,
          content: true,
          subject: true,
        },
      });

      const agendaItems = db.agenda ? await db.agenda.findMany({
        where: { subject },
      }) : [];

      if (files.length > 0) {
        const filesContent = files
          .map(
            (file) =>
              `Lesmateriaal: ${file.title}\nBeschrijving: ${file.description}\n\nInhoud:\n${file.content}`
          )
          .join('\n\n---\n\n');
        contextContent = contextContent ? `${contextContent}\n\n---\n\n${filesContent}` : filesContent;
        contextInfo.push(`alle lesmaterialen voor ${subject}`);
      }

      if (agendaItems.length > 0) {
        const agendaContent = agendaItems
          .map(
            (item) =>
              `Toets: ${item.title}\nType: ${item.type}\nDatum: ${new Date(item.testDate).toLocaleDateString('nl-NL')}\nBeschrijving: ${item.description || 'Geen beschrijving'}`
          )
          .join('\n\n');
        contextContent = contextContent ? `${contextContent}\n\n---\n\nGeplande toetsen:\n${agendaContent}` : `Geplande toetsen:\n${agendaContent}`;
      }
    }

    // If no specific context, get all files
    if (!fileId && !agendaId && !subject && db.file) {
      const files = await db.file.findMany({
        select: {
          title: true,
          description: true,
          content: true,
          subject: true,
        },
      });

      if (files.length > 0) {
        contextContent = files
          .map(
            (file) =>
              `Vak: ${file.subject}\nLesmateriaal: ${file.title}\nBeschrijving: ${file.description}\n\nInhoud:\n${file.content}`
          )
          .join('\n\n---\n\n');
        contextInfo.push('alle lesmaterialen');
      }
    }

    // Create AI chat completion using routeway.ai
    const systemPrompt = contextContent
      ? `Je bent een behulpzame AI-studieassistent voor Nederlandse scholieren. Je spreekt Nederlands en helpt studenten met hun vragen over school en studiematerialen. Je hebt toegang tot de volgende studiematerialen en toetsinformatie:

${contextContent}

Belangrijke instructies:
- Antwoord altijd in het Nederlands
- Wees behulpzaam, duidelijk en educatief
- Leg dingen stap voor stap uit als dat nodig is
- Geef voorbeelden om concepten te verduidelijken
- Als je naar specifieke informatie uit de studiematerialen verwijst, noem dan welke bron je gebruikt
- Moedig de student aan en geef studietips`
      : `Je bent een behulpzame AI-studieassistent voor Nederlandse scholieren. Je spreekt Nederlands en helpt studenten met hun vragen over school en leren.

Belangrijke instructies:
- Antwoord altijd in het Nederlands
- Wees behulpzaam, duidelijk en educatief
- Leg dingen stap voor stap uit als dat nodig is
- Geef voorbeelden om concepten te verduidelijken
- Moedig de student aan en geef studietips`;

    // Build messages array including chat history
    const messages = [];
    
    // Add previous chat history if provided
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      // Add system prompt first
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
      // Add previous messages
      for (const msg of chatHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
      // Add new user message
      messages.push({
        role: 'user',
        content: message,
      });
    } else {
      // No history, start fresh
      messages.push(
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        }
      );
    }

    // Call routeway.ai API
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', errorData);
      throw new Error(`API request failed: ${response.status}`);
    }

    const completion = await response.json();
    const aiMessage = completion.choices?.[0]?.message?.content || 'Sorry, ik kon geen antwoord genereren. Probeer het opnieuw.';

    // Save chat history if requested
    let savedHistoryId = historyId;
    if (saveHistory && db.chatHistory) {
      const allMessages = [...(chatHistory || []), { role: 'user', content: message }, { role: 'assistant', content: aiMessage }];
      
      if (historyId) {
        await db.chatHistory.update({
          where: { id: historyId, userId: user.id },
          data: {
            subject: subject || null,
            model: selectedModel,
            messages: JSON.stringify(allMessages),
          },
        });
      } else {
        const newHistory = await db.chatHistory.create({
          data: {
            userId: user.id,
            subject: subject || null,
            model: selectedModel,
            messages: JSON.stringify(allMessages),
          },
        });
        savedHistoryId = newHistory.id;
      }
    }

    return NextResponse.json({ 
      message: aiMessage,
      historyId: savedHistoryId,
      model: selectedModel,
      modelName: AVAILABLE_MODELS[selectedModel],
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwerken van je bericht' },
      { status: 500 }
    );
  }
}

// GET - Return available models
export async function GET() {
  return NextResponse.json({ models: AVAILABLE_MODELS });
}
