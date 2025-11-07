import { create } from "zustand";

export const useEditorStore = create((set, get) => ({
  // Canvas state
  elements: [],
  selectedIds: [],
  canvasSettings: {
    width: 1920,
    height: 1080,
    backgroundColor: "#ffffff",
    gridEnabled: true,
    snapToGrid: false,
  },

  // Tools
  activeTool: "select",
  zoom: 1,
  pan: { x: 0, y: 0 },
  isFilled: true,

  // History
  history: [],
  historyIndex: -1,

  // Collaboration
  activeUsers: [],
  userCursors: new Map(),

  // Actions
  setElements: (elements) => set({ elements }),

  addElement: (element) => {
    const { elements } = get();
    set({ elements: [...elements, element] });
    get().saveHistory();
  },

  updateElement: (id, updates) => {
    const { elements } = get();
    set({
      elements: elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    });
    get().saveHistory();
  },

  deleteElement: (id) => {
    const { elements, selectedIds } = get();
    set({
      elements: elements.filter((el) => el.id !== id),
      selectedIds: selectedIds.filter((sid) => sid !== id),
    });
    get().saveHistory();
  },

  deleteSelected: () => {
    const { elements, selectedIds } = get();
    set({
      elements: elements.filter((el) => !selectedIds.includes(el.id)),
      selectedIds: [],
    });
    get().saveHistory();
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  selectElement: (id, multi = false) => {
    const { selectedIds } = get();
    if (multi) {
      set({
        selectedIds: selectedIds.includes(id)
          ? selectedIds.filter((sid) => sid !== id)
          : [...selectedIds, id],
      });
    } else {
      set({ selectedIds: [id] });
    }
  },

  clearSelection: () => set({ selectedIds: [] }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setIsFilled: (filled) => set({ isFilled: filled }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  setPan: (pan) => set({ pan }),

  setCanvasSettings: (settings) =>
    set({
      canvasSettings: { ...get().canvasSettings, ...settings },
    }),

  // History management
  saveHistory: () => {
    const { elements, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(elements)));
    set({
      history: newHistory.slice(-50), // Keep last 50 states
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        historyIndex: historyIndex - 1,
        elements: JSON.parse(JSON.stringify(history[historyIndex - 1])),
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        historyIndex: historyIndex + 1,
        elements: JSON.parse(JSON.stringify(history[historyIndex + 1])),
      });
    }
  },

  // Collaboration
  setActiveUsers: (users) =>
    set((state) => {
      const activeSocketIds = new Set(
        users.filter((u) => u?.socketId).map((u) => u.socketId)
      );
      const prunedCursors = new Map();
      state.userCursors.forEach((value, key) => {
        if (activeSocketIds.has(key)) {
          prunedCursors.set(key, value);
        }
      });

      return {
        activeUsers: users,
        userCursors: prunedCursors,
      };
    }),

  updateUserCursor: (socketId, user, position) => {
    const { userCursors } = get();
    const newCursors = new Map(userCursors);
    newCursors.set(socketId, { user, position });
    set({ userCursors: newCursors });
  },

  removeUserCursor: (socketId) => {
    const { userCursors } = get();
    const newCursors = new Map(userCursors);
    newCursors.delete(socketId);
    set({ userCursors: newCursors });
  },

  // Z-index management
  bringToFront: (id) => {
    const { elements } = get();
    const maxZIndex = Math.max(...elements.map((el) => el.zIndex || 0), -1);
    const element = elements.find((el) => el.id === id);
    if (element) {
      get().updateElement(id, { zIndex: maxZIndex + 1 });
    }
  },

  sendToBack: (id) => {
    const { elements } = get();
    const minZIndex = Math.min(...elements.map((el) => el.zIndex || 0), 0);
    const element = elements.find((el) => el.id === id);
    if (element) {
      get().updateElement(id, { zIndex: minZIndex - 1 });
    }
  },
}));
