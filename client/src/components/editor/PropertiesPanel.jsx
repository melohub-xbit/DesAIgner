import { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { Trash2, Lock, Unlock, Eye, EyeOff, ArrowUp, ArrowDown, Edit2 } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import socketService from "../../utils/socket";

const PropertiesPanel = ({ projectId }) => {
  const { elements, selectedIds, updateElement, deleteSelected, bringToFront, sendToBack } =
    useEditorStore();

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
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
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
      <div 
        ref={panelRef}
        className="bg-gray-800 border-l border-gray-700 p-4 relative shrink-0 overflow-y-auto h-full shadow-lg"
        style={{ width: `${width}px` }}
      >
        <p className="text-gray-500 text-sm">
          Select an element to edit properties
        </p>
        
        {/* Resize handle */}
        <div
          className="absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-20"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
          }}
          style={{ 
            background: isResizing ? '#3b82f6' : 'transparent',
          }}
        />
      </div>
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
    <div 
      ref={panelRef}
      className="bg-gray-800 border-l border-gray-700 overflow-y-auto relative shrink-0 flex flex-col h-full shadow-lg"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className="absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-20"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsResizing(true);
        }}
        style={{ 
          background: isResizing ? '#3b82f6' : 'transparent',
        }}
      />
      
      <div className="p-4 border-b border-gray-700 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-medium">Properties</h3>
          <button
            onClick={() => setIsRenaming(!isRenaming)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
            title="Rename"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        {isRenaming ? (
          <div className="flex items-center gap-2">
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
              className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              autoFocus
            />
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-sm capitalize">
              {selectedElement.type}
            </p>
            {selectedElement.name && (
              <p className="text-gray-500 text-xs mt-1">{selectedElement.name}</p>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Position & Size */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Position
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">X</label>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => handleUpdate({ x: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => handleUpdate({ y: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">Width</label>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) =>
                  handleUpdate({ width: Number(e.target.value) })
                }
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Height</label>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) =>
                  handleUpdate({ height: Number(e.target.value) })
                }
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
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
              const isNearSnap = Math.abs(degrees - snappedDegrees) < snapThreshold;
              const finalDegrees = isNearSnap ? snappedDegrees : degrees;
              
              handleUpdate({
                rotation: (finalDegrees * Math.PI) / 180,
              });
            }}
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            {Math.round(((selectedElement.rotation || 0) * 180) / Math.PI)}°
            {(() => {
              const degrees = Math.round(((selectedElement.rotation || 0) * 180) / Math.PI);
              const remainder = degrees % 45;
              if (Math.abs(remainder) < 2 || Math.abs(remainder - 45) < 2) {
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
            onChange={(e) => handleUpdate({ opacity: Number(e.target.value) })}
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
              <span className="text-sm font-medium text-gray-300">Blur</span>
              <p className="text-xs text-gray-500">
                Softens edges with a Gaussian blur.
              </p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-500"
              checked={!!effects.blur?.enabled}
              onChange={(e) => updateEffects("blur", { enabled: e.target.checked })}
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
                onChange={(e) => updateEffects("blur", { strength: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-400">{effects.blur?.strength ?? 4}px</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-300">Grayscale</span>
              <p className="text-xs text-gray-500">Convert colors to monochrome.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-500"
              checked={!!effects.grayscale?.enabled}
              onChange={(e) => updateEffects("grayscale", { enabled: e.target.checked })}
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
                onChange={(e) => updateEffects("grayscale", { amount: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
                {Math.round((effects.grayscale?.amount ?? 1) * 100)}% intensity
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-300">Cache as Texture</span>
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
        {["rectangle", "circle", "triangle", "arrow", "freehand"].includes(selectedElement.type) && (
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
                handleUpdate({ strokeWidth: Math.max(0, Number(e.target.value)) })
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
                  zIndex: Math.max(...elements.map((el) => el.zIndex || 0), -1) + 1,
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
                  zIndex: Math.min(...elements.map((el) => el.zIndex || 0), 0) - 1,
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
        <div className="pt-4 border-t border-gray-700 space-y-2">
          <button
            onClick={() => handleUpdate({ locked: !selectedElement.locked })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
          >
            {selectedElement.locked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            {selectedElement.locked ? "Unlock" : "Lock"}
          </button>

          <button
            onClick={() => handleUpdate({ visible: !selectedElement.visible })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
          >
            {selectedElement.visible ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            {selectedElement.visible ? "Hide" : "Show"}
          </button>

          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
