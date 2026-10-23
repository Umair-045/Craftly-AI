const GROQ_KEY = process.env.REACT_APP_GROQ_API_KEY;
console.log('Groq key loaded:', GROQ_KEY ? 'YES (' + GROQ_KEY.substring(0, 8) + '...)' : 'NO - KEY MISSING');

// Groq for vision (image detection) - fast and free
async function detectWithGroq(imageBase64, mediaType) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { 
              url: `data:${mediaType || 'image/jpeg'};base64,${imageBase64}`,
              detail: 'low'
            }
          },
          {
            type: 'text',
            text: `List all craft materials visible in this image as JSON only: [{"name":"item","emoji":"emoji"}]`
          }
        ]
      }],
      max_tokens: 500,
      temperature: 0.1
    })
  });

  if (!res.ok) {
    const errData = await res.json();
    console.error('Groq API error response:', errData);
    throw new Error(errData.error?.message || 'Groq error');
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// Groq for text generation (craft ideas)
async function generateWithGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a creative DIY craft expert. Always respond with valid JSON only. No markdown, no explanation.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2500,
      temperature: 1.0
    })
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error?.message || 'Groq error');
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function detectMaterials(imageBase64, mediaType) {
  try {
    const text = await detectWithGroq(imageBase64, mediaType);
    const materials = tryParseJSON(text) || extractMaterialsFromText(text);
    if (materials && materials.length > 0) return materials;
  } catch (err) {
    console.error('Groq vision error:', err);
  }

  return [
    { name: 'cardboard', emoji: '📦' },
    { name: 'plastic bottle', emoji: '🍾' },
    { name: 'paper', emoji: '📄' },
    { name: 'scissors', emoji: '✂️' }
  ];
}

export async function generateCrafts(materials, preferences) {
  const materialsText = materials.join(', ');
  const toolsText = preferences.tools?.length > 0 ? preferences.tools.join(', ') : 'scissors and glue';
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);

  const craftTypes = [
    'home decoration', 'functional storage organizer', 'kids toy or game',
    'garden or outdoor item', 'wearable accessory', 'wall art',
    'gift item', 'desk organizer', 'plant holder', 'lamp or lighting'
  ];
  const shuffled = craftTypes.sort(() => Math.random() - 0.5).slice(0, 4);

  const prompt = `Generate exactly 4 COMPLETELY DIFFERENT DIY craft ideas.

MATERIALS: ${materialsText}
SKILL: ${preferences.skillLevel}
TIME: ${preferences.timeAvailable} minutes
PURPOSE: ${preferences.purpose}
TOOLS: ${toolsText}
SEED: ${randomSeed}

REQUIRED TYPES: ${shuffled.join(', ')}

Return ONLY this JSON array:
[{"id":"craft-${timestamp}-1","name":"Creative Name","emoji":"🎨","difficulty":"Easy ⭐","time":"20 mins","materials":["material1"],"steps":[{"title":"Step","description":"Action"}],"tips":["tip"]}]`;

  try {
    const text = await generateWithGroq(prompt);
    const crafts = tryParseJSON(text);
    if (crafts && crafts.length > 0) return crafts;
  } catch (err) {
    console.error('Generation error:', err);
  }

  return [];
}

function tryParseJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text.trim()); } catch {}
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) return JSON.parse(text.substring(start, end + 1));
  } catch {}
  return null;
}

function extractMaterialsFromText(text) {
  const commonMaterials = [
    { keywords: ['bottle', 'plastic'], name: 'plastic bottle', emoji: '🍾' },
    { keywords: ['cardboard', 'box', 'carton'], name: 'cardboard', emoji: '📦' },
    { keywords: ['paper', 'newspaper', 'magazine'], name: 'paper', emoji: '📄' },
    { keywords: ['fabric', 'cloth', 'textile'], name: 'fabric', emoji: '🧵' },
    { keywords: ['can', 'tin', 'aluminum'], name: 'tin can', emoji: '🥫' },
    { keywords: ['jar', 'glass'], name: 'glass jar', emoji: '🫙' },
    { keywords: ['roll', 'tube', 'toilet'], name: 'cardboard tube', emoji: '🧻' },
    { keywords: ['button', 'ribbon', 'string'], name: 'buttons', emoji: '🔘' },
  ];
  const lowerText = text.toLowerCase();
  const found = commonMaterials.filter(m => m.keywords.some(k => lowerText.includes(k)));
  return found.length > 0 ? found.map(m => ({ name: m.name, emoji: m.emoji })) : [
    { name: 'cardboard', emoji: '📦' },
    { name: 'paper', emoji: '📄' },
    { name: 'plastic bottle', emoji: '🍾' }
  ];
}
