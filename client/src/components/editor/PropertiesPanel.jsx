import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Trash2, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import socketService from "../../utils/socket";

const PropertiesPanel = () => {
  const { elements, selectedIds, updateElement, deleteSelected } =
    useEditorStore();

  const selectedElement =
    selectedIds.length === 1
      ? elements.find((el) => el.id === selectedIds[0])
      : null;

  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!selectedElement) {
    return (
      <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
        <p className="text-gray-500 text-sm">
          Select an element to edit properties
        </p>
      </div>
    );
  }

  const handleUpdate = (updates) => {
    updateElement(selectedElement.id, updates);
    socketService.emitElementUpdate(selectedElement.id, {
      ...selectedElement,
      ...updates,
    });
  };

  const handleDelete = () => {
    deleteSelected();
    selectedIds.forEach((id) => {
      socketService.emitElementDelete(selectedElement.id, id);
    });
  };

  return (
    <div className="w-64 bg-gray-800 border-l border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-medium mb-2">Properties</h3>
        <p className="text-gray-400 text-sm capitalize">
          {selectedElement.type}
        </p>
      </div>

      <div className="p-4 space-y-4">
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
            value={Math.round(
              ((selectedElement.rotation || 0) * 180) / Math.PI
            )}
            onChange={(e) =>
              handleUpdate({
                rotation: (Number(e.target.value) * Math.PI) / 180,
              })
            }
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            {Math.round(((selectedElement.rotation || 0) * 180) / Math.PI)}°
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

        {/* Fill Color */}
        {selectedElement.fill && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fill Color
            </label>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full h-10 rounded border-2 border-gray-600"
                style={{ backgroundColor: selectedElement.fill }}
              />
              {showColorPicker && (
                <div className="absolute z-10 mt-2">
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowColorPicker(false)}
                  />
                  <HexColorPicker
                    color={selectedElement.fill}
                    onChange={(color) => handleUpdate({ fill: color })}
                  />
                </div>
              )}
            </div>
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
