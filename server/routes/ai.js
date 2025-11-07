const express = require("express");
const auth = require("../middleware/auth");
const { generateDesign, AIServiceError } = require("../services/aiDesigner");

const router = express.Router();

// AI Design Suggestions (placeholder - integrate with OpenAI or custom ML)
router.post("/suggest-colors", auth, async (req, res) => {
  try {
    const { baseColor, scheme } = req.body;

    // Simple color scheme generation (can be enhanced with AI)
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    const rgbToHex = (r, g, b) => {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const generateComplementary = (hex) => {
      const rgb = hexToRgb(hex);
      return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
    };

    const generateAnalogous = (hex) => {
      const rgb = hexToRgb(hex);
      return [
        rgbToHex(Math.min(255, rgb.r + 30), rgb.g, Math.max(0, rgb.b - 30)),
        rgbToHex(Math.max(0, rgb.r - 30), rgb.g, Math.min(255, rgb.b + 30)),
      ];
    };

    let suggestions = [baseColor];

    if (scheme === "complementary") {
      suggestions.push(generateComplementary(baseColor));
    } else if (scheme === "analogous") {
      suggestions.push(...generateAnalogous(baseColor));
    } else {
      // Triadic
      const rgb = hexToRgb(baseColor);
      suggestions.push(
        rgbToHex(rgb.b, rgb.r, rgb.g),
        rgbToHex(rgb.g, rgb.b, rgb.r)
      );
    }

    res.json({ colors: suggestions });
  } catch (error) {
    console.error("Color suggestion error:", error);
    res.status(500).json({ error: "Failed to generate color suggestions" });
  }
});

// AI Layout Suggestions
router.post("/suggest-layout", auth, async (req, res) => {
  try {
    const { elementCount, canvasSize } = req.body;

    // Simple layout suggestions (can be enhanced with AI)
    const layouts = [
      {
        name: "Grid",
        description: "Evenly spaced grid layout",
        config: { type: "grid", columns: Math.ceil(Math.sqrt(elementCount)) },
      },
      {
        name: "Centered",
        description: "Elements centered on canvas",
        config: { type: "centered", spacing: 20 },
      },
      {
        name: "Stacked",
        description: "Vertical stack layout",
        config: { type: "stack", direction: "vertical" },
      },
    ];

    res.json({ layouts });
  } catch (error) {
    console.error("Layout suggestion error:", error);
    res.status(500).json({ error: "Failed to generate layout suggestions" });
  }
});

// Smart object alignment
router.post("/auto-align", auth, async (req, res) => {
  try {
    const { elements, alignType } = req.body;

    // Simple alignment logic
    const aligned = elements.map((el, i) => {
      if (alignType === "horizontal") {
        return { ...el, y: elements[0].y };
      } else if (alignType === "vertical") {
        return { ...el, x: elements[0].x };
      } else if (alignType === "distribute-horizontal") {
        const spacing = 50;
        return { ...el, x: i * (el.width + spacing) };
      }
      return el;
    });

    res.json({ elements: aligned });
  } catch (error) {
    console.error("Auto-align error:", error);
    res.status(500).json({ error: "Failed to align elements" });
  }
});

// AI Canvas Design (Gemini)
router.post("/design", auth, async (req, res) => {
  try {
    const { prompt, canvas, existingElements, palette } = req.body || {};

    const result = await generateDesign({
      prompt,
      canvas,
      existingElements,
      palette,
      userContext: {
        id: req.user?._id?.toString(),
        name: req.user?.username,
      },
    });

    res.json({
      elements: result.elements,
      rationale: result.rationale,
      insights: result.insights,
      usage: result.usage,
    });
  } catch (error) {
    if (error instanceof AIServiceError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }

    console.error("AI design error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate design", code: "AI_DESIGN_FAILURE" });
  }
});

module.exports = router;
