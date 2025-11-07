const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { randomUUID } = require("crypto");

const allowedElementTypes = [
  "rectangle",
  "circle",
  "triangle",
  "arrow",
  "line",
  "text",
];

class AIServiceError extends Error {
  constructor(message, statusCode = 500, code = "AI_SERVICE_ERROR") {
    super(message);
    this.name = "AIServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const colorRegex = /^#?([0-9a-fA-F]{6})$/;

const elementSchema = z.object({
  type: z.enum(allowedElementTypes),
  name: z.string().max(120).optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).max(40).optional(),
  rotation: z.number().optional(),
  text: z.string().max(400).optional(),
  fontSize: z.number().min(8).max(256).optional(),
  fontFamily: z.string().max(120).optional(),
  align: z.enum(["left", "center", "right", "justify"]).optional(),
  cornerRadius: z.number().min(0).max(240).optional(),
  notes: z.string().max(400).optional(),
});

const responseSchema = z.object({
  elements: z.array(elementSchema).min(1).max(16),
  rationale: z.string().max(1000).optional(),
  insights: z.array(z.string().max(240)).optional(),
});

let cachedClient;

const responseSchemaDefinition = {
  type: "object",
  properties: {
    elements: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: allowedElementTypes },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
          fill: { type: "string" },
          stroke: { type: "string" },
          strokeWidth: { type: "number" },
          text: { type: "string" },
          fontSize: { type: "number" },
        },
        required: ["type", "x", "y", "width", "height"],
      },
    },
    rationale: { type: "string" },
    insights: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["elements"],
};

const ensureClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIServiceError(
      "Gemini API key is not configured. Set GEMINI_API_KEY in your environment.",
      500,
      "MISSING_GEMINI_KEY"
    );
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }

  return cachedClient;
};

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) return min;
  if (max <= min) return min;
  return Math.min(Math.max(value, min), max);
};

const coerceNumber = (value, fallback) => {
  if (Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const sanitizeColor = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback || undefined;
  }
  const match = value.match(colorRegex);
  if (!match) {
    return fallback || undefined;
  }
  return `#${match[1].toLowerCase()}`;
};

const toRadians = (value) => {
  if (!Number.isFinite(value)) return 0;
  if (Math.abs(value) > Math.PI * 2.1) {
    return (value * Math.PI) / 180;
  }
  return value;
};

const makeElementId = (type) => {
  const safeType = typeof type === "string" ? type : "element";
  if (typeof randomUUID === "function") {
    return `${safeType}_${randomUUID()}`;
  }
  const random = Math.floor(Math.random() * 1_000_000);
  return `${safeType}_${Date.now()}_${random}`;
};

const summarizeExistingElements = (elements = []) => {
  return elements.slice(-12).map((el) => ({
    type: el.type,
    x: Math.round(el.x || 0),
    y: Math.round(el.y || 0),
    width: Math.round(el.width || 0),
    height: Math.round(el.height || 0),
    text: el.text ? el.text.slice(0, 60) : undefined,
  }));
};

const allowedTypeOrDefault = (value, index = 0) => {
  if (typeof value === "string" && allowedElementTypes.includes(value)) {
    return value;
  }
  return allowedElementTypes[index % allowedElementTypes.length];
};

const coerceElementsPayload = (payload, canvas) => {
  const { width: canvasWidth = 1920, height: canvasHeight = 1080 } =
    canvas || {};

  if (Array.isArray(payload)) {
    return { elements: payload };
  }

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (!Array.isArray(payload.elements)) {
    return payload;
  }

  const sanitizedElements = payload.elements
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        return null;
      }

      const type = allowedTypeOrDefault(raw.type, index);

      const desiredWidth = coerceNumber(raw.width ?? raw.size?.width, 240);
      const desiredHeight = coerceNumber(raw.height ?? raw.size?.height, 160);

      const width = clamp(Math.round(desiredWidth), 24, canvasWidth);
      const height = clamp(Math.round(desiredHeight), 24, canvasHeight);

      const x = clamp(
        Math.round(coerceNumber(raw.x ?? raw.position?.x, 80 + index * 60)),
        0,
        Math.max(canvasWidth - width, 0)
      );
      const y = clamp(
        Math.round(coerceNumber(raw.y ?? raw.position?.y, 80 + index * 60)),
        0,
        Math.max(canvasHeight - height, 0)
      );

      const entry = {
        ...raw,
        type,
        x,
        y,
        width,
        height,
      };

      if (typeof entry.strokeWidth !== "number") {
        entry.strokeWidth = type === "line" ? 4 : 2;
      }

      const cleanedFill = sanitizeColor(raw.fill, undefined);
      const cleanedStroke = sanitizeColor(raw.stroke, undefined);
      if (cleanedFill) {
        entry.fill = cleanedFill;
      } else {
        delete entry.fill;
      }

      if (cleanedStroke) {
        entry.stroke = cleanedStroke;
      } else {
        delete entry.stroke;
      }

      return entry;
    })
    .filter(Boolean);

  if (sanitizedElements.length === 0) {
    sanitizedElements.push({
      type: allowedElementTypes[0],
      x: 80,
      y: 80,
      width: Math.min(360, canvasWidth - 40),
      height: Math.min(240, canvasHeight - 40),
      strokeWidth: 2,
    });
  }

  return { ...payload, elements: sanitizedElements };
};

const buildSystemPrompt = () => {
  return [
    "You are an autonomous UI layout designer embedded inside a collaborative canvas.",
    "When the user asks for a design, you must respond with pure JSON that matches the provided schema.",
    "Use only the supported element types: rectangle, circle, triangle, arrow, line, text.",
    "Every element must expose its numeric position and size via top-level fields: x, y, width, height.",
    "Keep layouts balanced, accessible, and production-ready. Favor clean spacing, alignment, and readable typography.",
    "All coordinates and sizes are in canvas pixels.",
    "Do not overlap new elements with each other unless explicitly requested. Leave the existing elements untouched.",
    "Limit the number of new elements to what is necessary (typically 3-8).",
    "Prefer harmonious color palettes. Ensure text has sufficient contrast with its background.",
    'Reply with a single JSON object shaped like { "elements": [...] } and nothing else.',
    'Example: { "elements": [{ "type": "rectangle", "x": 120, "y": 160, "width": 320, "height": 200 }] }',
  ].join(" ");
};

const buildUserPrompt = ({
  prompt,
  canvas,
  existingSummary,
  palette,
  user,
}) => {
  const {
    width = 1920,
    height = 1080,
    backgroundColor = "#ffffff",
  } = canvas || {};

  const paletteText =
    Array.isArray(palette) && palette.length > 0
      ? `Preferred palette: ${palette.join(", ")}.`
      : "";

  const existing = existingSummary.length
    ? `Existing elements (${existingSummary.length}): ${JSON.stringify(
        existingSummary
      )}.`
    : "Canvas is currently empty.";

  const author = user?.name ? `The request comes from ${user.name}.` : "";

  return [
    `Canvas size: ${width}x${height}px. Background: ${backgroundColor}.`,
    existing,
    paletteText,
    author,
    `User brief: ${prompt}.`,
    "Ensure the response strictly follows the JSON schema and omits commentary.",
  ]
    .filter(Boolean)
    .join("\n");
};

const parseAssistantJson = (raw) => {
  if (typeof raw !== "string") {
    return null;
  }

  const attempts = new Set();
  const trimmed = raw.trim();
  if (trimmed) {
    attempts.add(trimmed);
  }

  const fenceMatch = trimmed.match(/```(?:json)?([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    attempts.add(fenceMatch[1].trim());
  }

  if (trimmed.startsWith("```")) {
    const withoutFence = trimmed
      .replace(/^```(?:\w+)?\s*/, "")
      .replace(/```$/, "")
      .trim();
    if (withoutFence) {
      attempts.add(withoutFence);
    }
  }

  const braceIndex = trimmed.indexOf("{");
  const bracketIndex = trimmed.indexOf("[");
  const startIndex = [braceIndex, bracketIndex]
    .filter((v) => v >= 0)
    .sort((a, b) => a - b)[0];
  if (startIndex !== undefined) {
    attempts.add(trimmed.slice(startIndex).trim());
  }

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      continue;
    }
  }

  return null;
};

const normalizeElements = (elements, canvas, existingCount) => {
  const { width: canvasWidth = 1920, height: canvasHeight = 1080 } =
    canvas || {};

  return elements.map((raw, index) => {
    const width = clamp(
      Math.round(coerceNumber(raw.width, 240)),
      24,
      canvasWidth
    );
    const height = clamp(
      Math.round(coerceNumber(raw.height, 160)),
      24,
      canvasHeight
    );

    const x = clamp(
      Math.round(coerceNumber(raw.x, 80 + index * 40)),
      0,
      Math.max(canvasWidth - width, 0)
    );
    const y = clamp(
      Math.round(coerceNumber(raw.y, 80 + index * 40)),
      0,
      Math.max(canvasHeight - height, 0)
    );

    const base = {
      id: makeElementId(raw.type),
      type: raw.type,
      name: raw.name,
      x,
      y,
      width,
      height,
      rotation: toRadians(raw.rotation ?? 0),
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: existingCount + index,
      blendMode: "normal",
      effects: {},
      metadata: {
        generatedBy: "gemini",
        promptVersion: "1.0",
        createdAt: new Date().toISOString(),
        rationale: raw.notes,
      },
    };

    const fillFallback = raw.type === "text" ? "#111827" : "#3b82f6";
    const strokeFallback =
      raw.type === "line" || raw.type === "arrow" ? "#111827" : "#0f172a";

    const fill = sanitizeColor(raw.fill, fillFallback);
    const stroke = sanitizeColor(raw.stroke, strokeFallback);
    const strokeWidth = clamp(
      coerceNumber(raw.strokeWidth, raw.type === "line" ? 4 : 2),
      0,
      24
    );

    if (raw.type === "text") {
      const textContent = raw.text || "AI generated copy";
      return {
        ...base,
        fill,
        stroke: undefined,
        strokeWidth: 0,
        text: textContent,
        fontSize: clamp(coerceNumber(raw.fontSize, 28), 12, 96),
        fontFamily: raw.fontFamily || "Inter",
        align: raw.align || "left",
      };
    }

    if (raw.type === "line") {
      // For lines, treat width/height as delta values; allow thin height.
      const adjustedHeight = clamp(
        Math.round(coerceNumber(size.height, 4)),
        1,
        Math.max(canvasHeight, 2)
      );
      return {
        ...base,
        width: clamp(
          Math.round(coerceNumber(size.width, 320)),
          32,
          canvasWidth
        ),
        height: adjustedHeight,
        stroke: fill || stroke,
        fill: null,
        strokeWidth,
      };
    }

    if (raw.type === "arrow") {
      return {
        ...base,
        fill,
        stroke,
        strokeWidth,
      };
    }

    return {
      ...base,
      fill,
      stroke,
      strokeWidth,
      cornerRadius: clamp(
        coerceNumber(raw.cornerRadius, raw.type === "rectangle" ? 12 : 0),
        0,
        240
      ),
    };
  });
};

const generateDesign = async ({
  prompt,
  canvas,
  existingElements = [],
  palette = [],
  userContext = {},
}) => {
  if (!prompt || typeof prompt !== "string") {
    throw new AIServiceError(
      "A natural language prompt is required.",
      400,
      "MISSING_PROMPT"
    );
  }

  const client = ensureClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const existingSummary = summarizeExistingElements(existingElements);

  const request = {
    model: modelName,
    systemInstruction: {
      parts: [{ text: buildSystemPrompt() }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildUserPrompt({
              prompt,
              canvas,
              existingSummary,
              palette,
              user: userContext,
            }),
          },
        ],
      },
    ],
    config: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: responseSchemaDefinition,
      maxOutputTokens: 2048,
    },
  };

  let response;
  try {
    response = await client.models.generateContent(request);
  } catch (error) {
    throw new AIServiceError(
      error.message || "Failed to contact Gemini service.",
      502,
      "GEMINI_REQUEST_FAILED"
    );
  }

  const extractTextFromResponse = (res) => {
    if (!res) return "";

    if (typeof res.text === "string" && res.text.trim().length > 0) {
      return res.text.trim();
    }

    if (typeof res.text === "function") {
      const maybe = res.text();
      if (typeof maybe === "string" && maybe.trim().length > 0) {
        return maybe.trim();
      }
    }

    if (typeof res.response?.text === "function") {
      const maybe = res.response.text();
      if (typeof maybe === "string" && maybe.trim().length > 0) {
        return maybe.trim();
      }
    }

    const candidates = [];

    if (Array.isArray(res.output)) {
      candidates.push(...res.output);
    }

    if (Array.isArray(res.candidates)) {
      candidates.push(...res.candidates);
    }

    if (Array.isArray(res.response?.candidates)) {
      candidates.push(...res.response.candidates);
    }

    const collected = [];

    const harvestParts = (parts) => {
      parts.filter(Boolean).forEach((part) => {
        if (typeof part.text === "string") {
          collected.push(part.text);
          return;
        }

        if (part.jsonValue) {
          collected.push(JSON.stringify(part.jsonValue));
          return;
        }

        if (part.structValue) {
          collected.push(JSON.stringify(part.structValue));
          return;
        }

        if (part.inlineData?.data) {
          collected.push(part.inlineData.data.toString());
        }
      });
    };

    candidates.forEach((candidate) => {
      if (!candidate) return;
      const content = candidate.content || candidate;
      if (Array.isArray(content?.parts)) {
        harvestParts(content.parts);
      } else if (Array.isArray(candidate.parts)) {
        harvestParts(candidate.parts);
      }
    });

    return collected.join("").trim();
  };

  const text = extractTextFromResponse(response);
  if (!text) {
    throw new AIServiceError(
      "Gemini returned an empty response.",
      502,
      "EMPTY_RESPONSE"
    );
  }

  const parsed = parseAssistantJson(text);
  if (!parsed) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Gemini JSON parse failed. Raw response:", text);
    }
    throw new AIServiceError(
      "Gemini returned invalid JSON.",
      502,
      "INVALID_JSON"
    );
  }

  const preparedPayload = coerceElementsPayload(parsed, canvas);

  if (!preparedPayload || typeof preparedPayload !== "object") {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Gemini response malformed:", parsed);
    }
    throw new AIServiceError(
      "Gemini response malformed: expected an object payload.",
      502,
      "MALFORMED_RESPONSE"
    );
  }

  const validation = responseSchema.safeParse(preparedPayload);
  if (!validation.success) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Gemini schema validation failed:", validation.error);
    }
    throw new AIServiceError(
      `Gemini response failed validation: ${validation.error.message}`,
      502,
      "SCHEMA_VALIDATION_FAILED"
    );
  }

  const normalizedElements = normalizeElements(
    validation.data.elements,
    canvas,
    existingElements.length
  );

  const usageMetadata =
    response?.usageMetadata ||
    response?.usage ||
    response?.response?.usageMetadata;

  const usage = usageMetadata
    ? {
        totalTokens:
          usageMetadata.totalTokenCount ?? usageMetadata.totalTokens ?? null,
        inputTokens:
          usageMetadata.promptTokenCount ?? usageMetadata.inputTokens ?? null,
        outputTokens:
          usageMetadata.candidatesTokenCount ??
          usageMetadata.outputTokens ??
          null,
      }
    : undefined;

  return {
    elements: normalizedElements,
    rationale: validation.data.rationale,
    insights: validation.data.insights || [],
    usage,
    raw: process.env.NODE_ENV === "development" ? validation.data : undefined,
  };
};

module.exports = {
  generateDesign,
  AIServiceError,
};
