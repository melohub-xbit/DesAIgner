import { useState } from "react";
import { Layers, Upload, Palette } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { useDropzone } from "react-dropzone";
import { assetsAPI } from "../../utils/api";
import toast from "react-hot-toast";

const Sidebar = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState("layers");
  const { elements, selectElement, selectedIds } = useEditorStore();
  const [uploading, setUploading] = useState(false);

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
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
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
                    onClick={() => selectElement(element.id)}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedIds.includes(element.id)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
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
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "assets" && (
          <div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
