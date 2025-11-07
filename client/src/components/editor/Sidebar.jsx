import { useState, useRef, useEffect } from "react";
import { Layers, Upload, Palette, Eye, EyeOff, Lock, Unlock, Image as ImageIcon } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { useDropzone } from "react-dropzone";
import { assetsAPI } from "../../utils/api";
import toast from "react-hot-toast";

const Sidebar = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState("layers");
  const { elements, selectElement, selectedIds, updateElement, addElement } = useEditorStore();
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [width, setWidth] = useState(256); // 64 * 4 = 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (activeTab === "assets") {
      loadAssets();
    }
  }, [activeTab, projectId]);

  const loadAssets = async () => {
    setLoadingAssets(true);
    try {
      const { data } = await assetsAPI.getAll(projectId);
      setAssets(data.assets || []);
    } catch (error) {
      toast.error("Failed to load assets");
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const newWidth = e.clientX;
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

  const onDrop = async (acceptedFiles) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);

        await assetsAPI.upload(formData);
        toast.success(`${file.name} uploaded!`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    // Reload assets after upload
    loadAssets();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"],
    },
    multiple: true,
  });

  const tabs = [
    { id: "layers", icon: Layers, label: "Layers" },
    { id: "assets", icon: Upload, label: "Assets" },
  ];

  return (
    <div 
      ref={sidebarRef}
      className="bg-gray-800 border-r border-gray-700 flex flex-col relative shrink-0 h-full shadow-lg"
      style={{ width: `${width}px` }}
    >
      {/* Tab buttons */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${
                activeTab === tab.id
                  ? "bg-gray-700 text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:bg-gray-750"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "layers" && (
          <div className="space-y-2">
            <h3 className="text-white font-medium mb-3">Layers</h3>
            {elements.length === 0 ? (
              <p className="text-gray-500 text-sm">No elements yet</p>
            ) : (
              <div className="space-y-1">
                {[...elements].reverse().map((element) => (
                  <div
                    key={element.id}
                    className={`p-2 rounded transition-colors ${
                      selectedIds.includes(element.id)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => selectElement(element.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm truncate">
                            {element.type === "text"
                              ? element.text || "Text"
                              : element.type.charAt(0).toUpperCase() +
                                element.type.slice(1)}
                          </span>
                          <span className="text-xs opacity-75">{element.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateElement(element.id, { visible: !element.visible });
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                          title={element.visible ? "Hide" : "Show"}
                        >
                          {element.visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateElement(element.id, { locked: !element.locked });
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                          title={element.locked ? "Unlock" : "Lock"}
                        >
                          {element.locked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "assets" && (
          <div className="space-y-4">
            <h3 className="text-white font-medium mb-3">Assets</h3>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-500 bg-opacity-10"
                  : "border-gray-600 hover:border-gray-500"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-400">
                {isDragActive
                  ? "Drop files here"
                  : "Drag & drop or click to upload"}
              </p>
              {uploading && (
                <p className="text-xs text-blue-400 mt-2">Uploading...</p>
              )}
            </div>

            {/* Assets List */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                Uploaded Assets ({assets.length})
              </h4>
              
              {loadingAssets ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : assets.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No assets uploaded yet
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {assets.map((asset) => (
                    <div
                      key={asset._id}
                      className="relative group cursor-pointer bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                      onClick={() => {
                        // Add image to canvas
                        const newElement = {
                          id: `image_${Date.now()}`,
                          type: "image",
                          x: 100,
                          y: 100,
                          width: asset.dimensions?.width || 200,
                          height: asset.dimensions?.height || 200,
                          src: asset.url,
                          rotation: 0,
                          opacity: 1,
                          visible: true,
                          locked: false,
                          zIndex: elements.length,
                        };
                        addElement(newElement);
                        toast.success("Image added to canvas");
                      }}
                      title={asset.name}
                    >
                      <div className="aspect-square bg-gray-800 flex items-center justify-center">
                        {asset.thumbnail ? (
                          <img
                            src={asset.thumbnail}
                            alt={asset.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-500" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 text-center">
                          Click to add
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-20"
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
};

export default Sidebar;
