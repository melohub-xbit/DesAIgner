import { useState, useEffect, useRef } from "react";
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
  const [width, setWidth] = useState(256); // 64 * 4 = 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
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
        <h3 className="text-white font-medium mb-2">Properties</h3>
        <p className="text-gray-400 text-sm capitalize">
          {selectedElement.type}
        </p>
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
          <div className="relative">
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
                <div className="relative mt-2 z-10">
                  <div
                    className="absolute inset-0 -z-10"
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
