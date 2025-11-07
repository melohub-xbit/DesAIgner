import { useRef, useEffect, useState } from "react";
import { Application, Graphics, Text, Sprite, Texture } from "pixi.js";
import { useEditorStore } from "../../store/editorStore";
import socketService from "../../utils/socket";

const PixiCanvas = ({ projectId }) => {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const elementsMapRef = useRef(new Map());
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const activeToolRef = useRef("select");

  const {
    elements,
    selectedIds,
    activeTool,
    zoom,
    pan,
    canvasSettings,
    selectElement,
    clearSelection,
    updateElement,
    addElement,
    setZoom,
    setPan,
  } = useEditorStore();

  // Keep activeToolRef in sync with activeTool
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    initPixiApp();
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
      }
    };
  }, []);

  useEffect(() => {
    if (appRef.current) {
      renderElements();
    }
  }, [elements, selectedIds]);

  useEffect(() => {
    if (appRef.current && appRef.current.stage) {
      appRef.current.stage.scale.set(zoom);
      appRef.current.stage.position.set(pan.x, pan.y);
    }
  }, [zoom, pan]);

  const initPixiApp = async () => {
    // PixiJS v7 - direct initialization (no init() method)
    const app = new Application({
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
      backgroundColor: canvasSettings.backgroundColor || 0xffffff,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    canvasRef.current.appendChild(app.view);
    appRef.current = app;

    setupCanvasInteraction();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (canvasRef.current && app.renderer) {
        app.renderer.resize(
          canvasRef.current.clientWidth, 
          canvasRef.current.clientHeight
        );
      }
    });
    
    resizeObserver.observe(canvasRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  };

  const setupCanvasInteraction = () => {
    const stage = appRef.current.stage;

    // Enable interaction on stage
    stage.eventMode = "static";
    stage.hitArea = appRef.current.screen;

    // Mouse/touch events
    stage.on("pointerdown", handlePointerDown);
    stage.on("pointermove", handlePointerMove);
    stage.on("pointerup", handlePointerUp);

    // Wheel for zoom
    canvasRef.current.addEventListener("wheel", handleWheel, {
      passive: false,
    });
  };

  const handlePointerDown = (event) => {
    const pos = event.data.global;
    const currentTool = activeToolRef.current;

    if (currentTool === "select") {
      const clickedElement = findElementAtPosition(pos.x, pos.y);

      if (clickedElement) {
        selectElement(clickedElement.id, event.data.originalEvent.shiftKey);
        isDraggingRef.current = true;
        dragStartRef.current = { x: pos.x, y: pos.y };
      } else {
        clearSelection();
      }
    } else if (currentTool === "rectangle") {
      createRectangle(pos.x, pos.y);
    } else if (currentTool === "circle") {
      createCircle(pos.x, pos.y);
    } else if (currentTool === "text") {
      createText(pos.x, pos.y);
    }
  };

  const handlePointerMove = (event) => {
    const pos = event.data.global;

    // Emit cursor position for collaboration
    socketService.emitCursorMove(projectId, { x: pos.x, y: pos.y });

    // Handle dragging selected elements
    if (isDraggingRef.current && selectedIds.length > 0) {
      const dx = pos.x - dragStartRef.current.x;
      const dy = pos.y - dragStartRef.current.y;

      selectedIds.forEach((id) => {
        const element = elements.find((el) => el.id === id);
        if (element && !element.locked) {
          const updated = {
            ...element,
            x: element.x + dx / zoom,
            y: element.y + dy / zoom,
          };
          updateElement(id, updated);
          socketService.emitElementUpdate(projectId, updated);
        }
      });

      dragStartRef.current = { x: pos.x, y: pos.y };
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (event) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      // Zoom
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = zoom * delta;
      setZoom(newZoom);
    } else {
      // Pan
      setPan({
        x: pan.x - event.deltaX,
        y: pan.y - event.deltaY,
      });
    }
  };

  const findElementAtPosition = (x, y) => {
    // Simple bounds check - can be enhanced
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (!el.visible) continue;

      if (
        x >= el.x * zoom + pan.x &&
        x <= (el.x + el.width) * zoom + pan.x &&
        y >= el.y * zoom + pan.y &&
        y <= (el.y + el.height) * zoom + pan.y
      ) {
        return el;
      }
    }
    return null;
  };

  const createRectangle = (x, y) => {
    const element = {
      id: `rect_${Date.now()}`,
      type: "rectangle",
      x: (x - pan.x) / zoom,
      y: (y - pan.y) / zoom,
      width: 100,
      height: 100,
      fill: "#3b82f6",
      stroke: "#000000",
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: elements.length,
    };

    addElement(element);
    socketService.emitElementAdd(projectId, element);
  };

  const createCircle = (x, y) => {
    const element = {
      id: `circle_${Date.now()}`,
      type: "circle",
      x: (x - pan.x) / zoom,
      y: (y - pan.y) / zoom,
      width: 100,
      height: 100,
      fill: "#ef4444",
      stroke: "#000000",
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: elements.length,
    };

    addElement(element);
    socketService.emitElementAdd(projectId, element);
  };

  const createText = (x, y) => {
    const element = {
      id: `text_${Date.now()}`,
      type: "text",
      x: (x - pan.x) / zoom,
      y: (y - pan.y) / zoom,
      width: 200,
      height: 50,
      text: "Double click to edit",
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: elements.length,
    };

    addElement(element);
    socketService.emitElementAdd(projectId, element);
  };

  const renderElements = () => {
    if (!appRef.current) return;

    // Clear existing graphics
    appRef.current.stage.removeChildren();
    elementsMapRef.current.clear();

    // Render each element
    elements.forEach((element) => {
      if (!element.visible) return;

      let pixiObject;

      if (element.type === "rectangle") {
        pixiObject = new Graphics();
        // New PixiJS v7+ API - draw then fill/stroke
        const fillColor = element.fill ? parseInt(element.fill.replace('#', '0x')) : 0x000000;
        pixiObject.beginFill(fillColor);
        if (element.strokeWidth > 0) {
          const strokeColor = element.stroke ? parseInt(element.stroke.replace('#', '0x')) : 0x000000;
          pixiObject.lineStyle(element.strokeWidth, strokeColor);
        }
        pixiObject.drawRect(0, 0, element.width, element.height);
        pixiObject.endFill();
      } else if (element.type === "circle") {
        pixiObject = new Graphics();
        const radius = element.width / 2;
        const fillColor = element.fill ? parseInt(element.fill.replace('#', '0x')) : 0x000000;
        pixiObject.beginFill(fillColor);
        if (element.strokeWidth > 0) {
          const strokeColor = element.stroke ? parseInt(element.stroke.replace('#', '0x')) : 0x000000;
          pixiObject.lineStyle(element.strokeWidth, strokeColor);
        }
        pixiObject.drawCircle(radius, radius, radius);
        pixiObject.endFill();
      } else if (element.type === "text") {
        pixiObject = new Text(element.text || "Text", {
          fontSize: element.fontSize || 24,
          fontFamily: element.fontFamily || "Arial",
          fill: element.fill || "#000000",
        });
      } else if (element.type === "image") {
        // Handle image elements
        try {
          const texture = Texture.from(element.src);
          pixiObject = new Sprite(texture);
          pixiObject.width = element.width;
          pixiObject.height = element.height;
        } catch (error) {
          console.error("Failed to load image:", error);
          // Fallback to placeholder
          pixiObject = new Graphics();
          pixiObject.beginFill(0xcccccc);
          pixiObject.drawRect(0, 0, element.width, element.height);
          pixiObject.endFill();
        }
      }

      if (pixiObject) {
        pixiObject.position.set(element.x, element.y);
        pixiObject.rotation = element.rotation || 0;
        pixiObject.alpha = element.opacity || 1;
        pixiObject.eventMode = "static";
        pixiObject.cursor = "pointer";

        // Selection highlight
        if (selectedIds.includes(element.id)) {
          const bounds = new Graphics();
          bounds.lineStyle(2, 0x3b82f6);
          bounds.drawRect(-2, -2, element.width + 4, element.height + 4);
          pixiObject.addChild(bounds);
        }

        appRef.current.stage.addChild(pixiObject);
        elementsMapRef.current.set(element.id, pixiObject);
      }
    });
  };

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-gray-100 relative"
      style={{ cursor: activeTool === "select" ? "default" : "crosshair" }}
    />
  );
};

export default PixiCanvas;
