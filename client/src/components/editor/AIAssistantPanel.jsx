import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Lightbulb,
  Palette,
  LayoutDashboard,
  Wand2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEditorStore } from "../../store/editorStore";
import { aiAPI } from "../../utils/api";
import socketService from "../../utils/socket";

const quickStarts = [
  {
    title: "Dashboard overview",
    description: "Cards, charts, and call-to-action for an admin screen.",
    prompt:
      "Design a crisp SaaS dashboard hero with a header bar, KPI cards, a primary chart, and a call-to-action footer strip.",
  },
  {
    title: "Product launch",
    description: "Hero layout with feature highlights and pricing strip.",
    prompt:
      "Create a landing hero for a new AI product with a headline, supporting text, dual action buttons, a feature grid, and a pricing teaser.",
  },
  {
    title: "Flow diagram",
    description: "Three step process with arrows and annotations.",
    prompt:
      "Lay out a left-to-right process diagram with three stages, directional arrows, and short text callouts for each step.",
  },
];

const summarizeElement = (element) => ({
  id: element.id,
  type: element.type,
  x: Math.round(element.x ?? 0),
  y: Math.round(element.y ?? 0),
  width: Math.round(element.width ?? 0),
  height: Math.round(element.height ?? 0),
  text: element.text ? element.text.slice(0, 80) : undefined,
});

const derivePalette = (elements) => {
  const palette = new Set();
  elements.forEach((element) => {
    if (typeof element.fill === "string" && element.fill.startsWith("#")) {
      palette.add(element.fill.toLowerCase());
    }
  });
  return Array.from(palette).slice(0, 6);
};

const AIAssistantPanel = ({ isOpen, onClose, projectId }) => {
  const { elements, canvasSettings, addElementsBatch } = useEditorStore(
    (state) => ({
      elements: state.elements,
      canvasSettings: state.canvasSettings,
      addElementsBatch: state.addElementsBatch,
    })
  );

  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState([
    {
      role: "assistant",
      content:
        "Tell me what you are designing and I'll drop a clean layout straight onto the canvas.",
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingDesign, setPendingDesign] = useState(null);
  const [selectedQuickStart, setSelectedQuickStart] = useState(null);

  const palette = useMemo(() => derivePalette(elements), [elements]);

  useEffect(() => {
    if (!isOpen) {
      setPrompt("");
      setIsGenerating(false);
      setSelectedQuickStart(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const appendMessage = (message) => {
    setConversation((prev) => [...prev, message]);
  };

  const handleGenerate = async (seedPrompt) => {
    const finalPrompt = (seedPrompt ?? prompt).trim();
    if (!finalPrompt) {
      toast.error("Describe what you want me to create.");
      return;
    }

    setPrompt("");
    setPendingDesign(null);
    setIsGenerating(true);
    appendMessage({ role: "user", content: finalPrompt });

    try {
      const payload = {
        prompt: finalPrompt,
        canvas: canvasSettings,
        existingElements: elements.slice(-20).map(summarizeElement),
        palette,
      };

      const { data } = await aiAPI.generateDesign(payload);

      if (!data?.elements?.length) {
        throw new Error("The assistant did not return any elements.");
      }

      setPendingDesign({
        elements: data.elements,
        insights: data.insights || [],
        rationale:
          data.rationale ||
          "Here is a structured layout that balances hierarchy and spacing.",
        usage: data.usage,
      });

      appendMessage({
        role: "assistant",
        content:
          data.rationale ||
          "Drafted a layout. Review the summary below and apply it when ready.",
      });

      if (data.insights?.length) {
        data.insights.forEach((insight) =>
          appendMessage({ role: "assistant", content: insight })
        );
      }
    } catch (error) {
      const message =
        error?.response?.data?.error || error.message || "Generation failed.";
      appendMessage({
        role: "assistant",
        content: `I ran into a problem: ${message}`,
      });
      toast.error(message);
    } finally {
      setIsGenerating(false);
      setSelectedQuickStart(null);
    }
  };

  const applyDesign = () => {
    if (!pendingDesign?.elements?.length) {
      toast.error("Nothing to apply yet.");
      return;
    }

    const preparedElements = pendingDesign.elements.map((element, index) => ({
      ...element,
      id: element.id || `ai_${Date.now()}_${index}`,
    }));

    const updatedElements = addElementsBatch(preparedElements);
    if (projectId) {
      socketService.emitElementsUpdate(projectId, updatedElements);
    }
    toast.success("AI layout merged into canvas.");
    setPendingDesign(null);
    appendMessage({
      role: "assistant",
      content:
        "Layout applied. Let me know if you need tweaks or another pass!",
    });
  };

  return (
    <div className="absolute bottom-6 right-6 z-30 w-full max-w-md">
      <div className="rounded-2xl border border-purple-500/30 bg-gray-900/95 backdrop-blur shadow-2xl flex flex-col h-[520px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-gradient-to-r from-gray-900 via-gray-900 to-purple-900/30">
          <div className="flex items-center gap-3 text-purple-100">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
                DESIGN Copilot
              </p>
              <p className="text-xs text-purple-200/80">
                Auto-generate clean layouts directly in the canvas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-purple-200 hover:text-white hover:bg-purple-500/20 transition"
            title="Close assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <section>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-purple-200/80 mb-2">
              <Wand2 className="w-3 h-3" />
              Quick Starters
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickStarts.map((item) => (
                <button
                  key={item.title}
                  onClick={() => {
                    setSelectedQuickStart(item.title);
                    handleGenerate(item.prompt);
                  }}
                  disabled={isGenerating}
                  className={`group text-left rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2 transition ${
                    selectedQuickStart === item.title
                      ? "border-purple-400 bg-purple-500/15"
                      : "hover:border-purple-400/60 hover:bg-purple-500/15"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-purple-300" />
                    <span className="text-sm font-medium text-purple-100">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/70 mt-1 leading-5">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-purple-200/80">
              <Lightbulb className="w-3 h-3" />
              Conversation
            </div>
            <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
              {conversation.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-xl px-3 py-2 text-xs leading-5 ${
                    message.role === "assistant"
                      ? "bg-purple-500/10 text-purple-100 border border-purple-400/30"
                      : "bg-gray-800/80 text-gray-100 border border-gray-700/40"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {isGenerating && (
                <div className="rounded-xl px-3 py-2 text-xs bg-purple-500/10 text-purple-100 border border-dashed border-purple-400/40 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Drafting layout...
                </div>
              )}
            </div>
          </section>

          {pendingDesign && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-purple-200/80">
                <Palette className="w-3 h-3" />
                Proposed Layout
              </div>
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-3 space-y-3">
                {pendingDesign.rationale && (
                  <p className="text-sm text-purple-100/90 leading-6">
                    {pendingDesign.rationale}
                  </p>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-purple-200/80 uppercase tracking-[0.2em]">
                    Elements
                  </p>
                  <ul className="space-y-1 max-h-24 overflow-y-auto pr-1 text-xs text-purple-100/90">
                    {pendingDesign.elements.map((element) => (
                      <li
                        key={element.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>{element.name || element.type}</span>
                        <span className="text-purple-200/60">
                          {Math.round(element.width)}×
                          {Math.round(element.height)} @ {Math.round(element.x)}
                          ,{Math.round(element.y)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {Array.isArray(pendingDesign.insights) &&
                  pendingDesign.insights.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-purple-200/80 uppercase tracking-[0.2em]">
                        Notes
                      </p>
                      <ul className="list-disc list-inside text-xs text-purple-200/80 space-y-1">
                        {pendingDesign.insights.map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                {pendingDesign.usage && (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-purple-300/70">
                    Tokens · in {pendingDesign.usage.inputTokens || "-"} / out{" "}
                    {pendingDesign.usage.outputTokens || "-"}
                  </p>
                )}
                <button
                  onClick={applyDesign}
                  className="w-full rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium py-2 transition"
                >
                  Apply Layout to Canvas
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="border-t border-purple-500/20 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder={
                'Describe a layout, e.g. "Two-column analytics dashboard"'
              }
              className="flex-1 rounded-lg border border-purple-500/30 bg-gray-900/80 px-3 py-2 text-sm text-purple-100 placeholder:text-purple-200/40 focus:outline-none focus:border-purple-400"
              disabled={isGenerating}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium transition disabled:opacity-60"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Generate"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;
