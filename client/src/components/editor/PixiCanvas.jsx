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
      width: window.innerWidth - 320, // Minus sidebars
      height: window.innerHeight - 60, // Minus toolbar
      backgroundColor: canvasSettings.backgroundColor || 0xffffff,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    canvasRef.current.appendChild(app.view);
    appRef.current = app;

    setupCanvasInteraction();

    // Handle resize
    const handleResize = () => {
      app.renderer.resize(window.innerWidth - 320, window.innerHeight - 60);
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
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

    if (activeTool === "select") {
      const clickedElement = findElementAtPosition(pos.x, pos.y);

      if (clickedElement) {
        selectElement(clickedElement.id, event.data.originalEvent.shiftKey);
        isDraggingRef.current = true;
        dragStartRef.current = { x: pos.x, y: pos.y };
      } else {
        clearSelection();
      }
    } else if (activeTool === "rectangle") {
      createRectangle(pos.x, pos.y);
    } else if (activeTool === "circle") {
      createCircle(pos.x, pos.y);
    } else if (activeTool === "text") {
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
      x: x / zoom - pan.x / zoom,
      y: y / zoom - pan.y / zoom,
      width: 100,
      height: 100,
      fill: "#3b82f6",
      stroke: "#000000",
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
      zIndex: elements.length,
    };

    addElement(element);
    socketService.emitElementAdd(projectId, element);
  };

  const createCircle = (x, y) => {
    const element = {
      id: `circle_${Date.now()}`,
      type: "circle",
      x: x / zoom - pan.x / zoom,
      y: y / zoom - pan.y / zoom,
      width: 100,
      height: 100,
      fill: "#ef4444",
      stroke: "#000000",
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
      zIndex: elements.length,
    };

    addElement(element);
    socketService.emitElementAdd(projectId, element);
  };

  const createText = (x, y) => {
    const element = {
      id: `text_${Date.now()}`,
      type: "text",
      x: x / zoom - pan.x / zoom,
      y: y / zoom - pan.y / zoom,
      width: 200,
      height: 50,
      text: "Double click to edit",
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
      rotation: 0,
      opacity: 1,
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
        pixiObject.rect(0, 0, element.width, element.height);
        pixiObject.fill(element.fill || 0x000000);
        if (element.strokeWidth > 0) {
          pixiObject.stroke({
            width: element.strokeWidth,
            color: element.stroke || 0x000000,
          });
        }
      } else if (element.type === "circle") {
        pixiObject = new Graphics();
        const radius = element.width / 2;
        pixiObject.circle(radius, radius, radius);
        pixiObject.fill(element.fill || 0x000000);
        if (element.strokeWidth > 0) {
          pixiObject.stroke({
            width: element.strokeWidth,
            color: element.stroke || 0x000000,
          });
        }
      } else if (element.type === "text") {
        pixiObject = new Text(element.text || "Text", {
          fontSize: element.fontSize || 24,
          fontFamily: element.fontFamily || "Arial",
          fill: element.fill || "#000000",
        });
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
          bounds.rect(-2, -2, element.width + 4, element.height + 4);
          bounds.stroke({ width: 2, color: 0x3b82f6 });
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
      className="w-full h-full bg-gray-100"
      style={{ cursor: activeTool === "select" ? "default" : "crosshair" }}
    />
  );
};

export default PixiCanvas;
