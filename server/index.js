const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Analyze image to detect materials
app.post('/api/detect-materials', async (req, res) => {
  const { imageBase64, mediaType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 }
          },
          {
            type: 'text',
            text: `Carefully analyze this image and identify ALL visible household items or recyclable materials that could be used for crafts.

Return ONLY a JSON array with this exact format (no markdown, no extra text):
[{"name":"item name","emoji":"appropriate emoji"}]

Look for: plastic bottles, cardboard boxes, paper, fabric scraps, aluminum cans, glass jars, egg cartons, toilet paper rolls, magazines, newspapers, plastic containers, buttons, ribbons, old clothes, bottle caps, etc.

Be specific and thorough. Include quantities if multiple items of same type are visible.`
          }
        ]
      }]
    });

    const text = message.content.find(c => c.type === 'text')?.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const materials = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json({ materials });
  } catch (err) {
    console.error('Detect error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Generate craft suggestions
app.post('/api/generate-crafts', async (req, res) => {
  const { materials, preferences } = req.body;
  if (!materials || !preferences) return res.status(400).json({ error: 'Missing data' });

  const materialsText = materials.join(', ');
  const toolsText = preferences.tools?.length > 0 ? preferences.tools.join(', ') : 'scissors and glue only';
  const timestamp = Date.now();

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: `You are a creative DIY craft expert. Generate 4 UNIQUE and CREATIVE craft project ideas.

AVAILABLE MATERIALS: ${materialsText}
SKILL LEVEL: ${preferences.skillLevel}
TIME LIMIT: ${preferences.timeAvailable} minutes
PROJECT PURPOSE: ${preferences.purpose}
AVAILABLE TOOLS: ${toolsText}

REQUIREMENTS:
1. Each craft MUST be completely different and unique
2. Use ONLY the materials listed above
3. Projects must be safe for all ages
4. Steps must be simple and clear
5. Match the time limit and skill level

Return ONLY valid JSON array (no markdown, no extra text):
[
  {
    "id": "craft-${timestamp}-1",
    "name": "Creative Craft Name",
    "emoji": "🎨",
    "difficulty": "Easy ⭐",
    "time": "20 mins",
    "materials": ["material1", "material2"],
    "steps": [
      {"title": "Step Name", "description": "Clear single action to take"}
    ],
    "tips": ["Helpful tip", "Safety or improvement tip"]
  }
]`
      }]
    });

    const text = message.content.find(c => c.type === 'text')?.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const crafts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json({ crafts });
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Craftly AI server running on port ${PORT}`));
