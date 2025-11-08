import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Wand2,
  Loader2,
  Trash2,
  PenSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { aiAPI } from "../../utils/api";
import { useEditorStore } from "../../store/editorStore";
import socketService from "../../utils/socket";

const MAX_HISTORY_MESSAGES = 10;

const AssistantPanel = ({ projectId }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        'Hi! Describe the layout or diagram you need (e.g. "make a process flow diagram for onboarding") and I\'ll draft elements you can drop onto the canvas.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDesign, setPendingDesign] = useState(null);
  const chatEndRef = useRef(null);

  const { elements, canvasSettings, addElementsBatch } = useEditorStore(
    (state) => ({
      elements: state.elements,
      canvasSettings: state.canvasSettings,
      addElementsBatch: state.addElementsBatch,
    })
  );

  const existingSnapshot = useMemo(() => {
    if (!Array.isArray(elements) || elements.length === 0) {
      return [];
    }

    const recent = elements.slice(-20);
    return recent.map((element) => ({
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      text: element.text,
    }));
  }, [elements]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingDesign]);

  const handleSubmit = async (event) => {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const historyPayload = messages
      .slice(-MAX_HISTORY_MESSAGES)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await aiAPI.createDesign({
        prompt: trimmed,
        history: historyPayload,
        canvas: {
          width: canvasSettings?.width,
          height: canvasSettings?.height,
        },
        existingElements: existingSnapshot,
      });

      const assistantMessage = {
        role: "assistant",
        content:
          data.summary ||
          `Generated ${data.elements.length} element${
            data.elements.length === 1 ? "" : "s"
          } ready to review.`,
        timestamp: Date.now(),
        meta: {
          reasoning: data.reasoning,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setPendingDesign({
        prompt: trimmed,
        ...data,
      });
    } catch (error) {
      console.error("AI assistant error", error);
      const fallbackMessage =
        error?.response?.data?.error ||
        "Unable to generate a design right now.";
      toast.error(fallbackMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fallbackMessage,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDesign = () => {
    if (!pendingDesign?.elements?.length) {
      return;
    }

    const timestamp = Date.now();
    const prepared = pendingDesign.elements.map((element, index) => {
      const fallbackId = `${element.type || "element"}_${timestamp}_${index}`;
      const id =
        typeof element.id === "string" && element.id.trim()
          ? element.id
          : fallbackId;
      const zIndex = Number.isFinite(element.zIndex)
        ? element.zIndex
        : elements.length + index;

      return {
        ...element,
        id,
        zIndex,
        visible: element.visible === false ? false : true,
      };
    });

    addElementsBatch(prepared);
    prepared.forEach((element) => {
      socketService.emitElementAdd(projectId, element);
    });
    toast.success("Assistant design added to canvas");
    setPendingDesign(null);
  };

  const handleDiscard = () => {
    setPendingDesign(null);
  };

  const handleReusePrompt = () => {
    if (!pendingDesign?.prompt) {
      return;
    }
    setInput(pendingDesign.prompt);
  };

  return (
    <div className="flex h-full flex-col gap-4 text-sm text-gray-300">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <h3 className="text-white font-semibold">Assistant</h3>
        </div>
        <p className="text-xs text-gray-500">
          Ask for wireframes, flows, or layout blocks. I respond with
          ready-to-use elements you can drop onto the canvas.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          return (
            <div
              key={`${message.timestamp}-${index}`}
              className={`rounded-xl border p-3 leading-relaxed shadow-sm transition-colors ${
                isUser
                  ? "ml-auto max-w-[85%] border-cyan-600/40 bg-cyan-500/10 text-right"
                  : "max-w-[95%] border-purple-600/30 bg-purple-500/10"
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {isUser ? "You" : "Assistant"}
              </p>
              <p className="mt-1 text-sm text-gray-100 whitespace-pre-wrap">
                {message.content}
              </p>
              {message.meta?.reasoning && (
                <p className="mt-2 text-xs text-gray-400 whitespace-pre-wrap">
                  {message.meta.reasoning}
                </p>
              )}
            </div>
          );
        })}

        {pendingDesign?.elements?.length ? (
          <div className="rounded-xl border border-cyan-600/30 bg-cyan-500/10 p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold text-white">
                Proposed elements
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-400 whitespace-pre-wrap">
              {pendingDesign.summary}
            </p>
            {pendingDesign.reasoning && (
              <p className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">
                {pendingDesign.reasoning}
              </p>
            )}
            <ul className="mt-3 space-y-1 text-xs text-gray-300">
              {pendingDesign.elements.map((element, index) => (
                <li
                  key={`${element.type}-${index}`}
                  className="flex items-center gap-2"
                >
                  <PenSquare className="h-3.5 w-3.5 text-cyan-300" />
                  <span>
                    {index + 1}. {element.type}
                    {element.text ? ` — "${element.text.slice(0, 40)}"` : ""}
                    {Number.isFinite(element.width) &&
                    Number.isFinite(element.height)
                      ? ` · ${Math.round(element.width)}x${Math.round(
                          element.height
                        )}`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleApplyDesign}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/90 px-3 py-2 text-xs font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400/90"
              >
                <Wand2 className="h-4 w-4" />
                Apply to canvas
              </button>
              <button
                type="button"
                onClick={handleReusePrompt}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-white/20 hover:text-white"
              >
                <Sparkles className="h-4 w-4" />
                Tweak prompt
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs text-gray-400 hover:border-red-500/40 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="e.g. Create a 4-step onboarding flow with arrows"
            rows={3}
            className="resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-gray-100 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
          {isLoading && (
            <Loader2 className="absolute bottom-3 right-3 h-4 w-4 animate-spin text-cyan-300" />
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Try prompts like "make a dashboard wireframe" or "diagram a support
            escalation flow".
          </p>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-500/80 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-purple-400/80"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssistantPanel;
