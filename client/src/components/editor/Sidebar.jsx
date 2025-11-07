import { useState, useRef, useEffect } from "react";
import { Assets } from "pixi.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Image as ImageIcon,
  Pencil,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { useDropzone } from "react-dropzone";
import { assetsAPI } from "../../utils/api";
import toast from "react-hot-toast";

const Sidebar = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState("layers");
  const { elements, selectElement, selectedIds, updateElement, addElement } =
    useEditorStore();
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [width, setWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const [renamingAssetId, setRenamingAssetId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const renameInputRef = useRef(null);
  const preloadedAssetsRef = useRef(new Set());

  useEffect(() => {
    if (activeTab === "assets") {
      loadAssets();
    }
  }, [activeTab, projectId]);

  useEffect(() => {
    if (renamingAssetId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingAssetId]);

  useEffect(() => {
    if (activeTab !== "assets" || assets.length === 0) return;
    assets.forEach((asset) => {
      if (!asset.url || preloadedAssetsRef.current.has(asset.url)) return;
      preloadedAssetsRef.current.add(asset.url);
      Assets.backgroundLoad(asset.url).catch(() => {
        preloadedAssetsRef.current.delete(asset.url);
      });
    });
  }, [assets, activeTab]);

  const loadAssets = async () => {
    setLoadingAssets(true);
    try {
      const { data } = await assetsAPI.getAll(projectId);
      setAssets(data.assets || []);
      setRenamingAssetId(null);
      setRenameValue("");
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
    loadAssets();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"],
    },
    multiple: true,
  });

  const startRenaming = (asset) => {
    setRenamingAssetId(asset._id);
    setRenameValue(asset.name || "");
  };

  const cancelRenaming = () => {
    setRenamingAssetId(null);
    setRenameValue("");
    setRenameLoading(false);
  };

  const submitRename = async (assetId) => {
    if (!renameValue.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setRenameLoading(true);
    try {
      const { data } = await assetsAPI.update(assetId, {
        name: renameValue.trim(),
      });
      setAssets((prev) =>
        prev.map((asset) =>
          asset._id === assetId ? { ...asset, name: data.asset.name } : asset
        )
      );
      toast.success("Asset renamed");
      cancelRenaming();
    } catch (error) {
      toast.error("Failed to rename asset");
      setRenameLoading(false);
    }
  };

  const tabs = [
    { id: "layers", icon: Layers, label: "Layers" },
    { id: "assets", icon: Upload, label: "Assets" },
  ];

  return (
    <motion.div
      ref={sidebarRef}
      initial={{ x: -20, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isCollapsed ? "48px" : `${width}px`
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-black/90 backdrop-blur-xl border-r border-white/10 flex flex-col relative shrink-0 h-full shadow-2xl"
    >
      {/* Gradient overlay */}
      <motion.div 
        animate={{ opacity: isCollapsed ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-purple-950/20 pointer-events-none" 
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
              <Layers className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              <div className="writing-mode-vertical text-xs font-medium text-gray-400 group-hover:text-white transition-colors tracking-wider">
                LAYERS
              </div>
            </motion.div>
            
            <div className="w-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => {
                setIsCollapsed(false);
                setActiveTab("assets");
              }}
            >
              <Upload className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <div className="writing-mode-vertical text-xs font-medium text-gray-400 group-hover:text-white transition-colors tracking-wider">
                ASSETS
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Collapse/Expand Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: isCollapsed ? 0 : 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCollapsed(!isCollapsed)}
        animate={{ rotate: isCollapsed ? 0 : 0 }}
        className="absolute top-4 -right-3 z-30 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-full p-1.5 border-2 border-black shadow-lg shadow-purple-500/30 transition-all duration-300"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <motion.div
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full relative z-10"
          >
            {/* Tab buttons */}
            <div className="flex border-b border-white/10 bg-black/50">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex-1 flex items-center justify-center gap-2 py-3.5 transition-all duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-gray-400 hover:text-white hover:bg-black/50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-b-2 border-cyan-500"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="text-sm font-medium relative z-10">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === "layers" && (
                  <motion.div
                    key="layers"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-white font-semibold">Layers</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    
                    {elements.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="relative inline-block mb-4">
                          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-lg opacity-20" />
                          <Layers className="relative w-12 h-12 text-gray-600" />
                        </div>
                        <p className="text-gray-500 text-sm">No elements yet</p>
                        <p className="text-gray-600 text-xs mt-1">Start creating!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[...elements].reverse().map((element, index) => (
                          <motion.div
                            key={element.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            whileHover={{ x: 4 }}
                            className={`group relative p-3 rounded-xl transition-all duration-300 ${
                              selectedIds.includes(element.id)
                                ? "bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                                : "bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/20"
                            }`}
                          >
                            {selectedIds.includes(element.id) && (
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl blur" />
                            )}
                            
                            <div className="relative flex items-center justify-between gap-2">
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => selectElement(element.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm truncate font-medium ${
                                    selectedIds.includes(element.id) ? "text-white" : "text-gray-300"
                                  }`}>
                                    {element.name ||
                                      (element.type === "text"
                                        ? element.text || "Text"
                                        : element.type.charAt(0).toUpperCase() +
                                          element.type.slice(1))}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    selectedIds.includes(element.id)
                                      ? "bg-cyan-500/20 text-cyan-300"
                                      : "bg-black/60 text-gray-400"
                                  }`}>
                                    {element.type}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateElement(element.id, {
                                      visible: !element.visible,
                                    });
                                  }}
                                  className="p-1.5 hover:bg-black/70 rounded-lg transition-colors"
                                  title={element.visible ? "Hide" : "Show"}
                                >
                                  {element.visible ? (
                                    <Eye className="w-4 h-4 text-cyan-400" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-500" />
                                  )}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateElement(element.id, {
                                      locked: !element.locked,
                                    });
                                  }}
                                  className="p-1.5 hover:bg-black/70 rounded-lg transition-colors"
                                  title={element.locked ? "Unlock" : "Lock"}
                                >
                                  {element.locked ? (
                                    <Lock className="w-4 h-4 text-purple-400" />
                                  ) : (
                                    <Unlock className="w-4 h-4 text-gray-500" />
                                  )}
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "assets" && (
                  <motion.div
                    key="assets"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Upload className="w-5 h-5 text-purple-400" />
                      <h3 className="text-white font-semibold">Assets</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                    </div>

                    <div
                      {...getRootProps()}
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
                        isDragActive
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-white/20 hover:border-white/40 bg-black/30 hover:bg-black/50"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity" />
                      
                      <input {...getInputProps()} />
                      <motion.div
                        animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                        className="relative"
                      >
                        <div className="relative inline-block mb-3">
                          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-lg opacity-30" />
                          <Upload className="relative w-10 h-10 text-cyan-400" />
                        </div>
                        <p className={`text-sm font-medium ${
                          isDragActive ? "text-cyan-300" : "text-gray-300"
                        }`}>
                          {isDragActive
                            ? "Drop files here..."
                            : "Drag & drop or click"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, SVG, GIF, WEBP
                        </p>
                      </motion.div>
                      {uploading && (
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                          <p className="text-xs text-cyan-400">Uploading...</p>
                        </div>
                      )}
                    </div>

                    {/* Assets List */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Gallery
                        </h4>
                        <span className="text-xs text-gray-500 px-2 py-1 bg-black/60 rounded-full">
                          {assets.length} {assets.length === 1 ? "asset" : "assets"}
                        </span>
                      </div>

                      {loadingAssets ? (
                        <div className="text-center py-12">
                          <div className="relative inline-block">
                            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                            <div
                              className="absolute inset-0 w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"
                              style={{
                                animationDirection: "reverse",
                                animationDuration: "1.5s",
                              }}
                            />
                          </div>
                        </div>
                      ) : assets.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="relative inline-block mb-4">
                            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-20" />
                            <ImageIcon className="relative w-12 h-12 text-gray-600" />
                          </div>
                          <p className="text-gray-500 text-sm">No assets yet</p>
                          <p className="text-gray-600 text-xs mt-1">Upload your first image</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {assets.map((asset, index) => (
                            <motion.div
                              key={asset._id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 1.05, y: -4 }}
                              className="group relative bg-black/60 hover:bg-black/80 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 shadow-lg"
                            >
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity" />
                              
                              <div
                                className="relative aspect-square bg-gradient-to-br from-cyan-950/30 via-purple-950/30 to-pink-950/30 flex items-center justify-center cursor-pointer overflow-hidden"
                                onClick={() => {
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
                                    blendMode: "normal",
                                    effects: {},
                                  };
                                  addElement(newElement);
                                  toast.success("Image added to canvas");
                                }}
                                title={asset.name}
                              >
                                {asset.thumbnail ? (
                                  <img
                                    src={asset.thumbnail}
                                    alt={asset.name}
                                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                  />
                                ) : (
                                  <ImageIcon className="w-8 h-8 text-gray-500" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                  <p className="text-white text-xs font-medium px-2 text-center">
                                    Click to add
                                  </p>
                                </div>
                              </div>

                              <div className="relative border-t border-white/10 bg-black/30 px-2 py-2 flex items-center gap-2">
                                {renamingAssetId === asset._id ? (
                                  <form
                                    className="flex items-center gap-1.5 w-full"
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      submitRename(asset._id);
                                    }}
                                  >
                                    <input
                                      ref={renameInputRef}
                                      value={renameValue}
                                      onChange={(e) =>
                                        setRenameValue(e.target.value)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                          e.preventDefault();
                                          cancelRenaming();
                                        }
                                      }}
                                      className="flex-1 bg-black/50 text-white text-xs px-2 py-1 rounded-lg border border-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                                      disabled={renameLoading}
                                      placeholder="Asset name"
                                    />
                                    <button
                                      type="submit"
                                      className="p-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition-colors"
                                      disabled={renameLoading}
                                      title="Save name"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      className="p-1 rounded-lg bg-black/70 hover:bg-black/90 text-gray-300 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelRenaming();
                                      }}
                                      disabled={renameLoading}
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </form>
                                ) : (
                                  <>
                                    <div className="flex-1 min-w-0">
                                      <span
                                        className="block text-xs text-gray-300 truncate font-medium"
                                        title={asset.name}
                                      >
                                        {asset.name}
                                      </span>
                                      <span className="text-[10px] text-gray-500">
                                        {asset.dimensions?.width || 0} ×{" "}
                                        {asset.dimensions?.height || 0}
                                      </span>
                                    </div>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      type="button"
                                      className="p-1 rounded-lg hover:bg-black/70 text-gray-400 hover:text-white transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startRenaming(asset);
                                      }}
                                      title="Rename asset"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </motion.button>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Resize handle */}
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gradient-to-b hover:from-cyan-500 hover:to-purple-500 transition-all z-20 group"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsResizing(true);
              }}
              style={{
                background: isResizing
                  ? "linear-gradient(to bottom, rgb(6, 182, 212), rgb(147, 51, 234))"
                  : "transparent",
              }}
            >
              <div className="absolute inset-0 w-3 -left-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Sidebar;
