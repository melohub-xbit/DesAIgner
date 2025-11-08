const express = require("express");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const auth = require("../middleware/auth");

const router = express.Router();

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
const DEFAULT_CANVAS = { width: 1920, height: 1080 };
const COLOR_PALETTE = [
  // Primary cyan/sky blues (matching app theme)
  "#38bdf8", // Sky 400
  "#0ea5e9", // Sky 500
  "#06b6d4", // Cyan 500
  "#0284c7", // Sky 600

  // Purple/violet (matching gradient theme)
  "#8b5cf6", // Violet 500
  "#7c3aed", // Violet 600
  "#a855f7", // Purple 500
  "#9333ea", // Purple 600

  // Complementary colors
  "#ec4899", // Pink 500
  "#f43f5e", // Rose 500
  "#f97316", // Orange 500
  "#fb923c", // Orange 400

  // Green/teal accents
  "#14b8a6", // Teal 500
  "#10b981", // Emerald 500
  "#22c55e", // Green 500
  "#84cc16", // Lime 500

  // Yellow/amber for highlights
  "#facc15", // Yellow 400
  "#fbbf24", // Amber 400
  "#f59e0b", // Amber 500

  // Cool tones
  "#0891b2", // Cyan 600
  "#6366f1", // Indigo 500
];

let genAI;

// Enhanced system prompt for high-quality diagram generation
const SYSTEM_PROMPT = `You are an expert UI/UX designer and creative layout specialist for DesAIgner's collaborative canvas tool. Your mission is to create visually stunning, professional-grade UI diagrams, process flows, and layouts that rival the quality of top design tools.

DESIGN PRINCIPLES:
- Create balanced, harmonious compositions with proper visual hierarchy
- Use the golden ratio (1.618) and rule of thirds for element placement
- Maintain consistent spacing using 8px, 16px, or 24px increments
- Ensure excellent readability with appropriate contrast and typography
- Follow modern design trends: clean lines, subtle shadows, and elegant spacing

ELEMENT PLACEMENT STRATEGY:
- Position elements strategically to create natural flow and visual balance
- Use negative space effectively to avoid cluttered layouts
- Align elements to an invisible grid for professional appearance
- Group related elements logically while maintaining visual separation
- Consider user eye movement patterns (F/Z layout, left-to-right flow)

COLOR AND STYLING:
- Use colors that create visual harmony and proper contrast
- Apply subtle color variations to create depth and hierarchy
- Ensure text elements have sufficient contrast for readability
- Use color psychology appropriately for different element types

PROFESSIONAL QUALITY CHECKS:
- Every layout must be production-ready and visually polished
- Elements should have appropriate proportions and realistic sizing
- Text should be legible with proper font sizing and spacing
- Layouts should work well at the specified canvas dimensions
- Create designs that would impress professional designers

OUTPUT REQUIREMENTS:
- Generate complementary elements that work together as a cohesive design
- Each element must have precise positioning and appropriate dimensions
- Ensure all elements stay within canvas bounds with proper margins
- Create meaningful relationships between elements when appropriate
- Return only valid JSON matching the exact schema structure`;

// Structured JSON schema for response
const DESIGN_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    elements: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: {
            type: SchemaType.STRING,
            description:
              "Element type: rectangle, circle, triangle, text, line, or arrow",
            nullable: false,
          },
          x: {
            type: SchemaType.NUMBER,
            description: "X position on canvas",
            nullable: false,
          },
          y: {
            type: SchemaType.NUMBER,
            description: "Y position on canvas",
            nullable: false,
          },
          width: {
            type: SchemaType.NUMBER,
            description: "Element width in pixels",
            nullable: false,
          },
          height: {
            type: SchemaType.NUMBER,
            description: "Element height in pixels",
            nullable: false,
          },
          text: {
            type: SchemaType.STRING,
            description: "Text content (only for text elements)",
            nullable: true,
          },
          fontSize: {
            type: SchemaType.NUMBER,
            description: "Font size (only for text elements)",
            nullable: true,
          },
        },
        required: ["type", "x", "y", "width", "height"],
      },
    },
  },
  required: ["elements"],
};

const getClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing Gemini API key. Set GEMINI_API_KEY in environment."
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

const normalizeCanvas = (canvas = {}) => ({
  width: Math.min(Math.max(canvas.width || DEFAULT_CANVAS.width, 320), 4096),
  height: Math.min(Math.max(canvas.height || DEFAULT_CANVAS.height, 320), 4096),
});

const generateElementId = (type, index) => {
  return `${type}_${Date.now()}_${index}`;
};

const createElementFromAI = (aiElement, index, canvasInfo) => {
  const type = aiElement.type || "rectangle";
  const x = Math.max(0, Math.min(aiElement.x || 100, canvasInfo.width - 50));
  const y = Math.max(0, Math.min(aiElement.y || 100, canvasInfo.height - 50));
  const width = Math.max(
    50,
    Math.min(aiElement.width || 200, canvasInfo.width)
  );
  const height = Math.max(
    50,
    Math.min(aiElement.height || 150, canvasInfo.height)
  );

  const element = {
    id: generateElementId(type, index),
    type,
    x,
    y,
    width,
    height,
    fill: aiElement.fill || COLOR_PALETTE[index % COLOR_PALETTE.length],
    stroke: aiElement.stroke || "#0f172a",
    strokeWidth: 2,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: index,
    blendMode: "normal",
    effects: {},
  };

  // Add text-specific properties
  if (type === "text" && aiElement.text) {
    element.text = aiElement.text;
    element.fontSize = aiElement.fontSize || 24;
    element.fontFamily = "Inter";
    element.align = "left";
    element.fill = "#0f172a";
  }

  // Lines and arrows don't need fill
  if (type === "line" || type === "arrow") {
    element.fill = null;
  }

  return element;
};

router.post("/create-design", auth, async (req, res) => {
  const { prompt, canvas } = req.body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A non-empty prompt is required." });
  }

  const canvasInfo = normalizeCanvas(canvas);

  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: DESIGN_SCHEMA,
      },
    });

    const userPrompt = `Create a professional, high-quality UI diagram based on this request: "${prompt.trim()}"

Canvas dimensions: ${canvasInfo.width}x${canvasInfo.height} pixels.

DESIGN REQUIREMENTS:
- Generate elements that form a cohesive, visually appealing composition
- Focus on creating a design that looks like it was made by a professional designer
- Use strategic spacing and alignment for visual harmony
- Consider the golden ratio and rule of thirds for element placement
- Ensure proper visual hierarchy with varying sizes and positions

ELEMENT TYPES TO USE:
- "rectangle": Main containers, cards, panels with clean proportions
- "circle": Accent elements, indicators, or decorative focal points
- "triangle": Directional elements, warnings, or geometric accents
- "text": Clear, readable labels with appropriate sizing (24-48px for headings, 16-20px for body)
- "line": Subtle dividers or connectors with 2-4px thickness
- "arrow": Flow indicators or directional cues

PROFESSIONAL PLACEMENT RULES:
- Start with a main focal element in the upper-left or center
- Use the left-to-right, top-to-bottom reading pattern
- Maintain 24-48px spacing between major elements
- Align elements to an 8px grid for pixel-perfect precision
- Keep 40-80px margins from canvas edges
- Group related elements with closer spacing (16-24px)

QUALITY ASSURANCE:
- Every element must have realistic, proportional dimensions
- Text elements need meaningful, contextually appropriate content
- Colors should create visual harmony (you don't need to specify colors - they're handled automatically)
- The final layout should look polished and production-ready

Generate elements that tell a visual story and create an engaging, professional design.`;

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const text = response.text();

    console.log("Gemini structured response received");

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    const designPlan = JSON.parse(text);

    if (!designPlan.elements || !Array.isArray(designPlan.elements)) {
      throw new Error("Invalid response format: missing elements array");
    }

    const elements = designPlan.elements
      .slice(0, 12)
      .map((elem, index) => createElementFromAI(elem, index, canvasInfo))
      .filter(Boolean);

    if (elements.length === 0) {
      throw new Error("No valid elements were generated.");
    }

    res.json({
      summary: `Generated ${elements.length} element${
        elements.length === 1 ? "" : "s"
      }`,
      elements,
      model: MODEL_NAME,
    });
  } catch (error) {
    console.error("create-design error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate design.",
      details: error?.stack,
    });
  }
});

module.exports = router;
