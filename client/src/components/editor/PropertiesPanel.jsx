import { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import socketService from "../../utils/socket";

const PropertiesPanel = ({ projectId }) => {
  const {
    elements,
    selectedIds,
    updateElement,
    deleteSelected,
    bringToFront,
    sendToBack,
  } = useEditorStore();

  const selectedElement =
    selectedIds.length === 1
      ? elements.find((el) => el.id === selectedIds[0])
      : null;

  const effects = selectedElement?.effects || {};
  const blendModeOptions = [
    { value: "normal", label: "Normal" },
    { value: "add", label: "Add" },
    { value: "multiply", label: "Multiply" },
    { value: "screen", label: "Screen" },
    { value: "overlay", label: "Overlay" },
    { value: "difference", label: "Difference" },
    { value: "hard_light", label: "Hard Light" },
    { value: "lighten", label: "Lighten" },
    { value: "darken", label: "Darken" },
  ];

  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [width, setWidth] = useState(256); // 64 * 4 = 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [elementName, setElementName] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      e.preventDefault();
      e.stopPropagation();

      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    if (isResizing) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  useEffect(() => {
    setShowFillPicker(false);
    setShowStrokePicker(false);
    setIsRenaming(false);
    if (selectedElement) {
      setElementName(selectedElement.name || "");
    }
  }, [selectedElement?.id]);

  if (!selectedElement) {
    return (
      <motion.div
        ref={panelRef}
        initial={{ x: 20, opacity: 0 }}
        animate={{
          x: 0,
          opacity: 1,
          width: isCollapsed ? "48px" : `${width}px`,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-black/90 backdrop-blur-xl border-l border-white/10 p-6 relative shrink-0 h-full shadow-2xl flex flex-col items-center justify-center"
      >
        {/* Gradient overlay */}
        <motion.div
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gradient-to-bl from-purple-950/20 via-transparent to-cyan-950/20 pointer-events-none"
        />

        {/* Collapsed state vertical text */}
        <AnimatePresence>
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => setIsCollapsed(false)}
              >
                <Sliders className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                <div className="writing-mode-vertical text-xs font-medium text-gray-400 group-hover:text-white transition-colors tracking-wider">
                  PROPERTIES
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse/Expand Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: isCollapsed ? 0 : -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 -left-3 z-30 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full p-1.5 border-2 border-black shadow-lg shadow-pink-500/30 transition-all duration-300"
          title={isCollapsed ? "Expand properties" : "Collapse properties"}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </motion.button>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="text-center relative z-10"
            >
              <div className="relative inline-block mb-4">
                <div className="absolute -inset-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-20" />
                <Sliders className="relative w-16 h-16 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                No Selection
              </h3>
              <p className="text-gray-500 text-sm max-w-[200px]">
                Select an element to edit its properties
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resize handle */}
        {!isCollapsed && (
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-gradient-to-b hover:from-purple-500 hover:to-pink-500 transition-all z-20"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsResizing(true);
            }}
            style={{
              background: isResizing
                ? "linear-gradient(to bottom, rgb(147, 51, 234), rgb(236, 72, 153))"
                : "transparent",
            }}
          >
            <div className="absolute inset-0 w-3 -right-1" />
          </div>
        )}
      </motion.div>
    );
  }

  const handleUpdate = (updates) => {
    updateElement(selectedElement.id, updates);
    if (projectId) {
      socketService.emitElementUpdate(projectId, {
        ...selectedElement,
        ...updates,
      });
    }
  };

  const updateEffects = (key, partial) => {
    handleUpdate({
      effects: {
        ...effects,
        [key]: {
          ...(effects[key] || {}),
          ...partial,
        },
      },
    });
  };

  const toggleCacheAsBitmap = (value) => {
    handleUpdate({
      effects: {
        ...effects,
        cacheAsBitmap: value,
      },
    });
  };

  const handleDelete = () => {
    deleteSelected();
    if (projectId) {
      selectedIds.forEach((id) => {
        socketService.emitElementDelete(projectId, id);
      });
    }
  };

  return (
    <motion.div
      ref={panelRef}
      initial={{ x: 20, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        width: isCollapsed ? "48px" : `${width}px`,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-black/90 backdrop-blur-xl border-l border-white/10 relative shrink-0 flex flex-col h-full shadow-2xl"
    >
      {/* Gradient overlay */}
      <motion.div
        animate={{ opacity: isCollapsed ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-gradient-to-bl from-purple-950/20 via-transparent to-pink-950/20 pointer-events-none"
      />

      {/* Collapsed state vertical text */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => setIsCollapsed(false)}
            >
              <Sparkles className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <div className="writing-mode-vertical text-xs font-medium text-gray-400 group-hover:text-white transition-colors tracking-wider">
                PROPERTIES
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse/Expand Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: isCollapsed ? 0 : -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-4 -left-3 z-30 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full p-1.5 border-2 border-black shadow-lg shadow-pink-500/30 transition-all duration-300"
        title={isCollapsed ? "Expand properties" : "Collapse properties"}
      >
        <motion.div
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Resize handle */}
      {!isCollapsed && (
        <div
          className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-gradient-to-b hover:from-purple-500 hover:to-pink-500 transition-all z-20"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
          }}
          style={{
            background: isResizing
              ? "linear-gradient(to bottom, rgb(147, 51, 234), rgb(236, 72, 153))"
              : "transparent",
          }}
        >
          <div className="absolute inset-0 w-3 -right-1" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full relative z-10 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 shrink-0 bg-black/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Properties</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsRenaming(!isRenaming)}
                  className="p-1.5 hover:bg-black/70 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Rename"
                >
                  <Edit2 className="w-4 h-4" />
                </motion.button>
              </div>
              {isRenaming ? (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={elementName}
                    onChange={(e) => setElementName(e.target.value)}
                    onBlur={() => {
                      handleUpdate({ name: elementName });
                      setIsRenaming(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdate({ name: elementName });
                        setIsRenaming(false);
                      } else if (e.key === "Escape") {
                        setElementName(selectedElement.name || "");
                        setIsRenaming(false);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-black/50 border border-white/20 focus:border-purple-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    autoFocus
                  />
                </motion.div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300 font-medium capitalize">
                      {selectedElement.type}
                    </span>
                  </div>
                  {selectedElement.name && (
                    <p className="text-gray-400 text-sm mt-2 truncate">
                      {selectedElement.name}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* Position & Size */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full" />
                  <label className="block text-sm font-semibold text-white">
                    Position
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">
                      X
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) =>
                        handleUpdate({ x: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-black/50 border border-white/20 focus:border-cyan-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">
                      Y
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) =>
                        handleUpdate({ y: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-black/50 border border-white/20 focus:border-cyan-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                  <label className="block text-sm font-semibold text-white">
                    Size
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">
                      Width
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.width)}
                      onChange={(e) =>
                        handleUpdate({ width: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-black/50 border border-white/20 focus:border-purple-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">
                      Height
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.height)}
                      onChange={(e) =>
                        handleUpdate({ height: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-black/50 border border-white/20 focus:border-purple-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rotation
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={Math.round(
                    ((selectedElement.rotation || 0) * 180) / Math.PI
                  )}
                  onChange={(e) => {
                    const degrees = Number(e.target.value);
                    // Snap to 45-degree increments
                    const snapThreshold = 2; // degrees
                    const snappedDegrees = Math.round(degrees / 45) * 45;
                    const isNearSnap =
                      Math.abs(degrees - snappedDegrees) < snapThreshold;
                    const finalDegrees = isNearSnap ? snappedDegrees : degrees;

                    handleUpdate({
                      rotation: (finalDegrees * Math.PI) / 180,
                    });
                  }}
                  className="w-full"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {Math.round(
                    ((selectedElement.rotation || 0) * 180) / Math.PI
                  )}
                  °
                  {(() => {
                    const degrees = Math.round(
                      ((selectedElement.rotation || 0) * 180) / Math.PI
                    );
                    const remainder = degrees % 45;
                    if (
                      Math.abs(remainder) < 2 ||
                      Math.abs(remainder - 45) < 2
                    ) {
                      return " (snapped)";
                    }
                    return "";
                  })()}
                </p>
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Opacity
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedElement.opacity || 1}
                  onChange={(e) =>
                    handleUpdate({ opacity: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {Math.round((selectedElement.opacity || 1) * 100)}%
                </p>
              </div>

              {/* Blend Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Blend Mode
                </label>
                <select
                  value={selectedElement.blendMode || "normal"}
                  onChange={(e) => handleUpdate({ blendMode: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded text-white text-sm px-2 py-1"
                >
                  {blendModeOptions.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Effects */}
              <div className="space-y-3 border border-gray-700 rounded-lg p-3 bg-gray-800/60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-300">
                      Blur
                    </span>
                    <p className="text-xs text-gray-500">
                      Softens edges with a Gaussian blur.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-500"
                    checked={!!effects.blur?.enabled}
                    onChange={(e) =>
                      updateEffects("blur", { enabled: e.target.checked })
                    }
                  />
                </div>
                {effects.blur?.enabled && (
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={effects.blur?.strength ?? 4}
                      onChange={(e) =>
                        updateEffects("blur", {
                          strength: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-gray-400">
                      {effects.blur?.strength ?? 4}px
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-300">
                      Grayscale
                    </span>
                    <p className="text-xs text-gray-500">
                      Convert colors to monochrome.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-500"
                    checked={!!effects.grayscale?.enabled}
                    onChange={(e) =>
                      updateEffects("grayscale", { enabled: e.target.checked })
                    }
                  />
                </div>
                {effects.grayscale?.enabled && (
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={effects.grayscale?.amount ?? 1}
                      onChange={(e) =>
                        updateEffects("grayscale", {
                          amount: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-gray-400">
                      {Math.round((effects.grayscale?.amount ?? 1) * 100)}%
                      intensity
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-300">
                      Cache as Texture
                    </span>
                    <p className="text-xs text-gray-500">
                      Boost rendering speed for static elements.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-500"
                    checked={!!effects.cacheAsBitmap}
                    onChange={(e) => toggleCacheAsBitmap(e.target.checked)}
                  />
                </div>
              </div>

              {/* Fill Color */}
              {[
                "rectangle",
                "circle",
                "triangle",
                "arrow",
                "freehand",
              ].includes(selectedElement.type) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-300">
                      Fill Color
                    </label>
                    {selectedElement.fill === null && (
                      <button
                        onClick={() => handleUpdate({ fill: "#3b82f6" })}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Add Fill
                      </button>
                    )}
                    {selectedElement.fill !== null && (
                      <button
                        onClick={() => handleUpdate({ fill: null })}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove Fill
                      </button>
                    )}
                  </div>
                  {selectedElement.fill !== null ? (
                    <>
                      <button
                        onClick={() => setShowFillPicker(!showFillPicker)}
                        className="w-full h-10 rounded border-2 border-gray-600"
                        style={{ backgroundColor: selectedElement.fill }}
                      />
                      {showFillPicker && (
                        <div className="mt-2 p-3 border border-gray-700 rounded-lg bg-gray-800/80">
                          <HexColorPicker
                            color={selectedElement.fill}
                            onChange={(color) => handleUpdate({ fill: color })}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-10 rounded border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-sm">
                      No Fill
                    </div>
                  )}
                </div>
              )}

              {/* Stroke Color */}
              {typeof selectedElement.stroke === "string" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Stroke Color
                  </label>
                  <button
                    onClick={() => setShowStrokePicker(!showStrokePicker)}
                    className="w-full h-10 rounded border-2 border-gray-600"
                    style={{ backgroundColor: selectedElement.stroke }}
                  />
                  {showStrokePicker && (
                    <div className="mt-2 p-3 border border-gray-700 rounded-lg bg-gray-800/80">
                      <HexColorPicker
                        color={selectedElement.stroke}
                        onChange={(color) => handleUpdate({ stroke: color })}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Stroke Width */}
              {typeof selectedElement.strokeWidth === "number" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stroke Width
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={selectedElement.strokeWidth}
                    onChange={(e) =>
                      handleUpdate({
                        strokeWidth: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              )}

              {/* Text properties */}
              {selectedElement.type === "text" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Text
                    </label>
                    <textarea
                      value={selectedElement.text || ""}
                      onChange={(e) => handleUpdate({ text: e.target.value })}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={selectedElement.fontSize || 16}
                      onChange={(e) =>
                        handleUpdate({ fontSize: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                </>
              )}

              {/* Z-Index Controls */}
              <div className="pt-4 border-t border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Layer Order
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      bringToFront(selectedElement.id);
                      socketService.emitElementUpdate(projectId, {
                        ...selectedElement,
                        zIndex:
                          Math.max(
                            ...elements.map((el) => el.zIndex || 0),
                            -1
                          ) + 1,
                      });
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
                    title="Bring to Front"
                  >
                    <ArrowUp className="w-4 h-4" />
                    Front
                  </button>
                  <button
                    onClick={() => {
                      sendToBack(selectedElement.id);
                      socketService.emitElementUpdate(projectId, {
                        ...selectedElement,
                        zIndex:
                          Math.min(...elements.map((el) => el.zIndex || 0), 0) -
                          1,
                      });
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
                    title="Send to Back"
                  >
                    <ArrowDown className="w-4 h-4" />
                    Back
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-red-500 rounded-full" />
                  <label className="block text-sm font-semibold text-white">
                    Actions
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    handleUpdate({ locked: !selectedElement.locked })
                  }
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedElement.locked
                      ? "bg-gradient-to-r from-amber-600/30 to-orange-600/30 border border-amber-500/50 text-amber-300 hover:from-amber-600/40 hover:to-orange-600/40"
                      : "bg-black/50 hover:bg-black/70 border border-white/20 hover:border-white/30 text-white"
                  }`}
                >
                  {selectedElement.locked ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Locked
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      Unlocked
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    handleUpdate({ visible: !selectedElement.visible })
                  }
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    !selectedElement.visible
                      ? "bg-gradient-to-r from-gray-600/30 to-slate-600/30 border border-gray-500/50 text-gray-300 hover:from-gray-600/40 hover:to-slate-600/40"
                      : "bg-black/50 hover:bg-black/70 border border-white/20 hover:border-white/30 text-white"
                  }`}
                >
                  {selectedElement.visible ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hidden
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-xl text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-red-500/20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 blur opacity-30 group-hover:opacity-50 transition-opacity" />
                  <Trash2 className="w-4 h-4 relative" />
                  <span className="relative">Delete</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PropertiesPanel;
