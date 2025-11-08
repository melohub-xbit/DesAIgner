const express = require("express");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const auth = require("../middleware/auth");

const router = express.Router();

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
const DEFAULT_CANVAS = { width: 1920, height: 1080 };
const COLOR_PALETTE = [
  "#38bdf8",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#facc15",
  "#ec4899",
  "#14b8a6",
];

let genAI;

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
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: DESIGN_SCHEMA,
      },
    });

    const userPrompt = `You are a creative UI layout designer. Create a design layout based on this request: "${prompt.trim()}"

Canvas size: ${canvasInfo.width}x${canvasInfo.height} pixels.

Generate 3-8 elements that form a complete, well-organized layout.

Supported element types:
- "rectangle": for containers, cards, panels
- "circle": for indicators, dots, decorative elements  
- "triangle": for arrows, warnings, decorative shapes
- "text": for labels, headings, descriptions
- "line": for dividers, separators
- "arrow": for connectors, flow indicators

Requirements:
- Position elements with x, y coordinates within canvas bounds
- Set appropriate width and height for each element
- For text elements: include text content and fontSize
- Leave reasonable spacing between elements (min 20-30px)
- Create visual hierarchy and logical grouping
- Align elements to an 8px or 16px grid when possible

Return a JSON array of elements with required fields: type, x, y, width, height.`;

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
