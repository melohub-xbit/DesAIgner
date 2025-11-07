import { useRef, useEffect } from "react";
import {
  Application,
  Container,
  Graphics,
  Text,
  Sprite,
  Rectangle,
  Assets,
  BLEND_MODES,
  BlurFilter,
  ColorMatrixFilter,
  Point,
  Matrix,
} from "pixi.js";
import { useEditorStore } from "../../store/editorStore";
import socketService from "../../utils/socket";

const PixiCanvas = ({ projectId }) => {
  const GRID_MAJOR = 100;
  const GRID_MINOR = GRID_MAJOR / 4;
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const gridLayerRef = useRef(null);
  const worldLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);
  const elementsMapRef = useRef(new Map());
  const textureCacheRef = useRef(new Map());
  const textureLoadingRef = useRef(new Map());
  const selectionOverlaysRef = useRef(new Map());
  const resizeStateRef = useRef(null);
  const rotateStateRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragElementsRef = useRef(new Map()); // Store initial positions for each dragged element
  const panStateRef = useRef({
    active: false,
    pointerId: null,
    startGlobal: { x: 0, y: 0 },
    startCamera: { x: 0, y: 0 },
  });
  const panModifierRef = useRef(false);
  const activeToolRef = useRef("select");
  const drawingStateRef = useRef(null);
  const freeDrawPathRef = useRef(null);
  const handleConfigs = [
    { id: "nw", cursor: "nwse-resize", x: 0, y: 0 },
    { id: "n", cursor: "ns-resize", x: 0.5, y: 0 },
    { id: "ne", cursor: "nesw-resize", x: 1, y: 0 },
    { id: "w", cursor: "ew-resize", x: 0, y: 0.5 },
    { id: "e", cursor: "ew-resize", x: 1, y: 0.5 },
    { id: "sw", cursor: "nesw-resize", x: 0, y: 1 },
    { id: "s", cursor: "ns-resize", x: 0.5, y: 1 },
    { id: "se", cursor: "nwse-resize", x: 1, y: 1 },
  ];
  const MIN_ELEMENT_SIZE = 10;

  const {
    elements,
    selectedIds,
    activeTool,
    zoom,
    pan,
    canvasSettings,
    isFilled,
    selectElement,
    clearSelection,
    updateElement,
    addElement,
    setZoom,
    setPan,
    setActiveTool,
  } = useEditorStore();

  // Keep activeToolRef in sync with activeTool
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    let dispose;
    (async () => {
      dispose = await initPixiApp();
    })();
    return () => {
      dispose?.();
      textureCacheRef.current.forEach((texture, key) => {
        texture.destroy(true);
        Assets.unload(key).catch(() => {});
      });
      textureCacheRef.current.clear();
      textureLoadingRef.current.clear();
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
      }
    };
  }, []);

  useEffect(() => {
    renderElements();
  }, [elements, selectedIds, activeTool]);

  useEffect(() => {
    updateCamera();
    drawGrid();
  }, [zoom, pan]);

  useEffect(() => {
    drawGrid();
  }, [canvasSettings.gridEnabled]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" && !panModifierRef.current) {
        panModifierRef.current = true;
        if (!panStateRef.current.active && canvasRef.current) {
          canvasRef.current.style.cursor = "grab";
        }
        event.preventDefault();
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === "Space") {
        panModifierRef.current = false;
        if (!panStateRef.current.active && canvasRef.current) {
          const shouldGrab = activeToolRef.current === "pan";
          canvasRef.current.style.cursor = shouldGrab
            ? "grab"
            : activeToolRef.current === "select"
            ? "default"
            : "crosshair";
        }
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const parseColor = (value, fallback = 0x000000) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const sanitized = value.replace("#", "0x");
      const parsed = Number(sanitized);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return fallback;
  };

  const drawRectangleShape = (graphics, element) => {
    graphics.clear();
    if (element.fill) {
      graphics.beginFill(parseColor(element.fill, 0xffffff));
    }
    if (element.strokeWidth > 0) {
      graphics.lineStyle(
        element.strokeWidth,
        parseColor(element.stroke, 0x000000)
      );
    } else {
      graphics.lineStyle(0);
    }
    graphics.drawRect(0, 0, element.width, element.height);
    if (element.fill) {
      graphics.endFill();
    }
  };

  const drawFreehandShape = (graphics, element) => {
    graphics.clear();
    if (!element.points || element.points.length < 2) {
      // Draw a small dot if only one point
      if (element.points && element.points.length === 1) {
        const strokeWidth = element.strokeWidth || 3;
        const strokeColor = parseColor(element.stroke || "#000000", 0x000000);
        graphics.lineStyle(0);
        graphics.beginFill(strokeColor);
        graphics.drawCircle(
          element.points[0].x,
          element.points[0].y,
          strokeWidth / 2
        );
        graphics.endFill();
      }
      return;
    }

    const strokeWidth = element.strokeWidth || 3;
    const strokeColor = parseColor(element.stroke || "#000000", 0x000000);
    graphics.lineStyle(strokeWidth, strokeColor);

    graphics.moveTo(element.points[0].x, element.points[0].y);
    for (let i = 1; i < element.points.length; i++) {
      graphics.lineTo(element.points[i].x, element.points[i].y);
    }

    if (element.fill) {
      graphics.beginFill(parseColor(element.fill, 0xffffff));
      graphics.closePath();
      graphics.endFill();
    }
  };

  const drawEllipseShape = (graphics, element) => {
    graphics.clear();
    if (element.fill) {
      graphics.beginFill(parseColor(element.fill, 0xffffff));
    }
    if (element.strokeWidth > 0) {
      graphics.lineStyle(
        element.strokeWidth,
        parseColor(element.stroke, 0x000000)
      );
    } else {
      graphics.lineStyle(0);
    }
    graphics.drawEllipse(
      element.width / 2,
      element.height / 2,
      element.width / 2,
      element.height / 2
    );
    if (element.fill) {
      graphics.endFill();
    }
  };

  const drawTriangleShape = (graphics, element) => {
    graphics.clear();
    if (element.fill) {
      graphics.beginFill(parseColor(element.fill, 0xffffff));
    }
    if (element.strokeWidth > 0) {
      graphics.lineStyle(
        element.strokeWidth,
        parseColor(element.stroke, 0x000000)
      );
    } else {
      graphics.lineStyle(0);
    }
    graphics.moveTo(element.width / 2, 0);
    graphics.lineTo(element.width, element.height);
    graphics.lineTo(0, element.height);
    graphics.closePath();
    if (element.fill) {
      graphics.endFill();
    }
  };

  const drawArrowShape = (graphics, element) => {
    const shaftWidth = Math.max(element.height * 0.4, element.strokeWidth || 6);
    const headWidth = element.height;
    const bodyLength = Math.max(element.width - headWidth, shaftWidth);
    graphics.clear();
    if (element.fill) {
      graphics.beginFill(parseColor(element.fill, 0xffffff));
    }
    if (element.strokeWidth > 0) {
      graphics.lineStyle(
        element.strokeWidth,
        parseColor(element.stroke, 0x000000)
      );
    } else {
      graphics.lineStyle(0);
    }
    graphics.moveTo(0, (element.height - shaftWidth) / 2);
    graphics.lineTo(bodyLength, (element.height - shaftWidth) / 2);
    graphics.lineTo(bodyLength, 0);
    graphics.lineTo(element.width, element.height / 2);
    graphics.lineTo(bodyLength, element.height);
    graphics.lineTo(bodyLength, (element.height + shaftWidth) / 2);
    graphics.lineTo(0, (element.height + shaftWidth) / 2);
    graphics.closePath();
    if (element.fill) {
      graphics.endFill();
    }
  };

  const drawLineShape = (graphics, element) => {
    graphics.clear();
    const strokeWidth = element.strokeWidth ?? 4;
    graphics.lineStyle(
      strokeWidth,
      parseColor(element.stroke || element.fill || "#1f2937", 0x1f2937)
    );
    graphics.moveTo(0, 0);
    graphics.lineTo(element.width, element.height);
  };

  const redrawElementGraphics = (displayObject, element) => {
    switch (element.type) {
      case "rectangle":
        drawRectangleShape(displayObject, element);
        break;
      case "circle":
        drawEllipseShape(displayObject, element);
        break;
      case "triangle":
        drawTriangleShape(displayObject, element);
        break;
      case "arrow":
        drawArrowShape(displayObject, element);
        break;
      case "line":
        drawLineShape(displayObject, element);
        break;
      case "freehand":
        drawFreehandShape(displayObject, element);
        break;
      default:
        break;
    }
  };

  const applyLocalDeltaToWorld = (matrix, dx, dy) => {
    const origin = matrix.apply(new Point(0, 0), new Point());
    const target = matrix.apply(new Point(dx, dy), new Point());
    return { dx: target.x - origin.x, dy: target.y - origin.y };
  };

  const initPixiApp = async () => {
    const app = new Application({
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    canvasRef.current.appendChild(app.view);
    appRef.current = app;

    setupStageLayers();
    const cleanupInteraction = setupCanvasInteraction();
    updateCamera();
    drawGrid();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (canvasRef.current && app.renderer) {
        app.renderer.resize(
          canvasRef.current.clientWidth,
          canvasRef.current.clientHeight
        );
        updateCamera();
        drawGrid();
      }
    });

    resizeObserver.observe(canvasRef.current);

    return () => {
      resizeObserver.disconnect();
      cleanupInteraction?.();
    };
  };

  const setupStageLayers = () => {
    const stage = appRef.current.stage;
    stage.eventMode = "static";
    stage.hitArea = appRef.current.screen;
    stage.sortableChildren = true;

    const gridLayer = new Graphics();
    gridLayer.zIndex = 0;
    gridLayer.eventMode = "none";
    stage.addChild(gridLayer);
    gridLayerRef.current = gridLayer;

    const worldLayer = new Container();
    worldLayer.zIndex = 1;
    worldLayer.sortableChildren = true;
    worldLayer.eventMode = "static";
    stage.addChild(worldLayer);
    worldLayerRef.current = worldLayer;

    const overlayLayer = new Container();
    overlayLayer.zIndex = 2;
    overlayLayer.eventMode = "passive";
    overlayLayer.interactiveChildren = true;
    stage.addChild(overlayLayer);
    overlayLayerRef.current = overlayLayer;
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
    stage.on("pointerupoutside", handlePointerUp);
    stage.on("pointercancel", handlePointerUp);

    // Wheel for zoom
    const wheelTarget = canvasRef.current;
    const wheelHandler = (event) => handleWheel(event);
    wheelTarget?.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      stage.off("pointerdown", handlePointerDown);
      stage.off("pointermove", handlePointerMove);
      stage.off("pointerup", handlePointerUp);
      stage.off("pointerupoutside", handlePointerUp);
      stage.off("pointercancel", handlePointerUp);
      wheelTarget?.removeEventListener("wheel", wheelHandler);
    };
  };

  const handlePointerDown = (event) => {
    const pos = event.data.global;
    const worldPos = toWorldCoordinates(pos);
    const currentTool = activeToolRef.current;

    if (currentTool === "pan") {
      beginPan(event);
      return;
    }

    if (currentTool === "select") {
      if (panModifierRef.current) {
        beginPan(event);
        return;
      }
      const clickedElement = findElementAtPosition(worldPos.x, worldPos.y);

      if (clickedElement) {
        selectElement(clickedElement.id, event.data.originalEvent.shiftKey);
        isDraggingRef.current = true;
        dragStartRef.current = {
          x: worldPos.x,
          y: worldPos.y,
        };
        // Store initial positions for all selected elements
        dragElementsRef.current.clear();
        const currentState = useEditorStore.getState();
        const currentSelectedIds = currentState.selectedIds;
        const currentElements = currentState.elements;
        currentSelectedIds.forEach((id) => {
          const el = currentElements.find((e) => e.id === id);
          if (el) {
            dragElementsRef.current.set(id, { x: el.x, y: el.y });
          }
        });
      } else {
        clearSelection();
        beginPan(event);
      }
    } else if (currentTool === "freehand") {
      // Start freehand drawing
      freeDrawPathRef.current = {
        points: [{ x: worldPos.x, y: worldPos.y }],
        elementId: null,
      };
    } else if (
      ["rectangle", "circle", "triangle", "line", "arrow"].includes(currentTool)
    ) {
      // Start interactive drawing
      const startX = snapValue(worldPos.x);
      const startY = snapValue(worldPos.y);
      drawingStateRef.current = {
        tool: currentTool,
        startX,
        startY,
        elementId: null,
      };
    } else if (currentTool === "text") {
      createText(worldPos.x, worldPos.y);
    }
  };

  const handlePointerMove = (event) => {
    if (rotateStateRef.current) {
      handleRotateDrag(event);
      return;
    }

    if (resizeStateRef.current) {
      handleResizeDrag(event);
      return;
    }

    const pos = event.data.global;
    const worldPos = toWorldCoordinates(pos);
    const currentState = useEditorStore.getState();
    const currentSelectedIds = currentState.selectedIds;
    const currentElements = currentState.elements;
    const currentZoom = currentState.zoom;

    // Emit cursor position for collaboration
    socketService.emitCursorMove(projectId, { x: worldPos.x, y: worldPos.y });

    // Handle freehand drawing
    if (freeDrawPathRef.current) {
      freeDrawPathRef.current.points.push({ x: worldPos.x, y: worldPos.y });
      updateFreeDrawShape();
      return;
    }

    // Handle interactive shape drawing
    if (drawingStateRef.current) {
      const { tool, startX, startY, elementId } = drawingStateRef.current;
      const currentX = snapValue(worldPos.x);
      const currentY = snapValue(worldPos.y);

      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);

      if (elementId) {
        // Update existing element
        const updates = {
          x,
          y,
          width: Math.max(width, MIN_ELEMENT_SIZE),
          height: Math.max(height, MIN_ELEMENT_SIZE),
        };
        updateElement(elementId, updates);
      } else {
        // Create new element
        const element = createDrawingElement(
          tool,
          x,
          y,
          Math.max(width, MIN_ELEMENT_SIZE),
          Math.max(height, MIN_ELEMENT_SIZE)
        );
        drawingStateRef.current.elementId = element.id;
      }
      return;
    }

    // Handle dragging selected elements
    if (isDraggingRef.current && currentSelectedIds.length > 0) {
      const dx = worldPos.x - dragStartRef.current.x;
      const dy = worldPos.y - dragStartRef.current.y;

      currentSelectedIds.forEach((id) => {
        const element = currentElements.find((el) => el.id === id);
        if (element && !element.locked) {
          const initialPos = dragElementsRef.current.get(id);
          if (initialPos) {
            const newX = snapValue(initialPos.x + dx);
            const newY = snapValue(initialPos.y + dy);

            const updated = {
              ...element,
              x: newX,
              y: newY,
            };
            updateElement(id, updated);
            socketService.emitElementUpdate(projectId, updated);
          }
        }
      });
    } else if (panStateRef.current.active) {
      const { startGlobal, startCamera } = panStateRef.current;
      const dx = (startGlobal.x - pos.x) / currentZoom;
      const dy = (startGlobal.y - pos.y) / currentZoom;
      setPan({ x: startCamera.x + dx, y: startCamera.y + dy });
    }
  };

  const handlePointerUp = () => {
    if (rotateStateRef.current) {
      finalizeRotate();
    }

    if (resizeStateRef.current) {
      finalizeResize();
    }

    // Finalize freehand drawing
    if (freeDrawPathRef.current) {
      finalizeFreeDrawShape();
      freeDrawPathRef.current = null;
      // Auto-switch to select tool after freehand drawing
      if (activeToolRef.current === "freehand") {
        setActiveTool("select");
      }
    }

    // Finalize interactive drawing
    if (drawingStateRef.current) {
      if (drawingStateRef.current.elementId) {
        const element = useEditorStore
          .getState()
          .elements.find((el) => el.id === drawingStateRef.current.elementId);
        if (element) {
          socketService.emitElementAdd(projectId, element);
        }
      }
      drawingStateRef.current = null;
      // Auto-switch to select tool after drawing
      if (
        activeToolRef.current !== "select" &&
        activeToolRef.current !== "pan"
      ) {
        setActiveTool("select");
      }
    }

    isDraggingRef.current = false;
    dragElementsRef.current.clear();
    panStateRef.current.active = false;
    if (canvasRef.current) {
      const shouldGrab =
        panModifierRef.current || activeToolRef.current === "pan";
      canvasRef.current.style.cursor = shouldGrab
        ? "grab"
        : activeToolRef.current === "select"
        ? "default"
        : "crosshair";
    }
  };

  const handleWheel = (event) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      // Zoom
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = zoom * delta;
      const focus = toWorldCoordinates(getGlobalFromWheel(event));
      setZoom(newZoom);
      requestAnimationFrame(() => {
        const post = toWorldCoordinates(getGlobalFromWheel(event));
        const dx = post.x - focus.x;
        const dy = post.y - focus.y;
        setPan({ x: pan.x + dx, y: pan.y + dy });
      });
    } else {
      // Pan
      setPan({
        x: pan.x + event.deltaX / zoom,
        y: pan.y + event.deltaY / zoom,
      });
    }
  };

  const beginPan = (event) => {
    const currentPan = useEditorStore.getState().pan;
    panStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startGlobal: { x: event.data.global.x, y: event.data.global.y },
      startCamera: { x: currentPan.x, y: currentPan.y },
    };
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing";
    }
  };

  const createSelectionOverlay = (element, pixiObject, includeHandles) => {
    const overlayLayer = overlayLayerRef.current;
    if (!overlayLayer) return;

    const container = new Container();
    container.position.set(pixiObject.position.x, pixiObject.position.y);
    container.rotation = pixiObject.rotation || 0;
    container.pivot.copyFrom(pixiObject.pivot);
    container.zIndex = (pixiObject.zIndex ?? 0) + 1000;
    container.eventMode = includeHandles ? "passive" : "none";
    container.interactiveChildren = includeHandles;

    const outline = new Graphics();
    outline.lineStyle(2 / Math.max(zoom, 0.0001), 0x3b82f6, 1);
    outline.drawRect(0, 0, element.width, element.height);
    outline.eventMode = "none";
    container.addChild(outline);

    const handles = [];
    if (includeHandles) {
      const handleSize = 10 / Math.max(zoom, 0.0001);

      // Add rotation handle above the top-center
      const rotationHandle = new Graphics();
      rotationHandle.lineStyle(1.5 / Math.max(zoom, 0.0001), 0x22c55e, 1);
      rotationHandle.beginFill(0xffffff);
      const rotationHandleSize = handleSize * 1.2;
      rotationHandle.drawCircle(0, 0, rotationHandleSize / 2);
      rotationHandle.endFill();
      rotationHandle.position.set(element.width / 2, -rotationHandleSize * 1.5);
      rotationHandle.eventMode = "static";
      rotationHandle.cursor = "grab";
      rotationHandle.alpha = 0.95;
      rotationHandle.on("pointerdown", (ev) => beginRotate(ev, element));
      container.addChild(rotationHandle);
      handles.push(rotationHandle);

      handleConfigs.forEach((config) => {
        const handle = new Graphics();
        handle.lineStyle(1.5 / Math.max(zoom, 0.0001), 0x1d4ed8, 1);
        handle.beginFill(0xffffff);
        handle.drawRoundedRect(
          -handleSize / 2,
          -handleSize / 2,
          handleSize,
          handleSize,
          Math.max(handleSize / 4, 1 / Math.max(zoom, 0.0001))
        );
        handle.endFill();
        handle.position.set(
          config.x * element.width,
          config.y * element.height
        );
        handle.eventMode = "static";
        handle.cursor = config.cursor;
        handle.alpha = 0.95;
        handle.handleConfig = config;
        handle.on("pointerdown", (ev) => beginResize(ev, element, config));
        container.addChild(handle);
        handles.push(handle);
      });
    }

    overlayLayer.addChild(container);
    selectionOverlaysRef.current.set(element.id, {
      container,
      outline,
      handles,
      includeHandles,
    });
  };

  const beginResize = (event, element, handleConfig) => {
    event.stopPropagation();
    event.preventDefault?.();
    isDraggingRef.current = false;

    const displayObject = elementsMapRef.current.get(element.id);
    const overlay = selectionOverlaysRef.current.get(element.id);
    if (!displayObject || !overlay) return;

    const worldMatrix = displayObject.worldTransform.clone();
    const inverseMatrix = worldMatrix.clone().invert();
    const startGlobalPoint = new Point(
      event.data.global.x,
      event.data.global.y
    );
    const startLocalPoint = inverseMatrix.apply(startGlobalPoint.clone());

    resizeStateRef.current = {
      elementId: element.id,
      handleConfig,
      startElement: { ...element },
      startLocal: startLocalPoint,
      worldMatrix,
      inverseMatrix,
      overlay,
      displayObject,
      preview: { ...element },
    };

    if (canvasRef.current) {
      canvasRef.current.style.cursor = handleConfig.cursor;
    }
  };

  const calculateResizePreview = (state, deltaLocal) => {
    const { startElement, handleConfig, worldMatrix } = state;
    let newX = startElement.x;
    let newY = startElement.y;
    let newWidth = startElement.width;
    let newHeight = startElement.height;

    if (handleConfig.id.includes("e")) {
      newWidth = Math.max(MIN_ELEMENT_SIZE, startElement.width + deltaLocal.x);
    }

    if (handleConfig.id.includes("s")) {
      newHeight = Math.max(
        MIN_ELEMENT_SIZE,
        startElement.height + deltaLocal.y
      );
    }

    if (handleConfig.id.includes("w")) {
      const desiredWidth = Math.max(
        MIN_ELEMENT_SIZE,
        startElement.width - deltaLocal.x
      );
      const appliedDelta = startElement.width - desiredWidth;
      const worldOffset = applyLocalDeltaToWorld(worldMatrix, appliedDelta, 0);
      newWidth = desiredWidth;
      newX = startElement.x + worldOffset.dx;
      newY = startElement.y + worldOffset.dy;
    }

    if (handleConfig.id.includes("n")) {
      const desiredHeight = Math.max(
        MIN_ELEMENT_SIZE,
        startElement.height - deltaLocal.y
      );
      const appliedDelta = startElement.height - desiredHeight;
      const worldOffset = applyLocalDeltaToWorld(worldMatrix, 0, appliedDelta);
      newHeight = desiredHeight;
      newX += worldOffset.dx;
      newY += worldOffset.dy;
    }

    return {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };
  };

  const applyResizePreview = (state, preview) => {
    const { displayObject, overlay, startElement } = state;
    if (!displayObject || !overlay) return;
    const currentZoom = useEditorStore.getState().zoom;

    if (displayObject instanceof Graphics) {
      redrawElementGraphics(displayObject, { ...startElement, ...preview });
    } else if (displayObject instanceof Sprite) {
      displayObject.width = preview.width;
      displayObject.height = preview.height;
    } else if (displayObject instanceof Text) {
      displayObject.width = preview.width;
      displayObject.height = preview.height;
    }

    displayObject.position.set(preview.x, preview.y);

    overlay.container.position.set(preview.x, preview.y);
    overlay.outline.clear();
    overlay.outline.lineStyle(2 / Math.max(currentZoom, 0.0001), 0x3b82f6, 1);
    overlay.outline.drawRect(0, 0, preview.width, preview.height);

    if (overlay.includeHandles) {
      const handleSize = 10 / Math.max(currentZoom, 0.0001);
      overlay.handles.forEach((handle) => {
        const config = handle.handleConfig;
        handle.clear();
        handle.lineStyle(1.5 / Math.max(currentZoom, 0.0001), 0x1d4ed8, 1);
        handle.beginFill(0xffffff);
        handle.drawRoundedRect(
          -handleSize / 2,
          -handleSize / 2,
          handleSize,
          handleSize,
          Math.max(handleSize / 4, 1 / Math.max(currentZoom, 0.0001))
        );
        handle.endFill();
        handle.position.set(
          config.x * preview.width,
          config.y * preview.height
        );
      });
    }
  };

  const handleResizeDrag = (event) => {
    const state = resizeStateRef.current;
    if (!state) return;

    const globalPoint = new Point(event.data.global.x, event.data.global.y);
    const currentLocal = state.inverseMatrix.apply(globalPoint.clone());
    const deltaLocal = new Point(
      currentLocal.x - state.startLocal.x,
      currentLocal.y - state.startLocal.y
    );

    const preview = calculateResizePreview(state, deltaLocal);
    state.preview = preview;
    applyResizePreview(state, preview);
  };

  const finalizeResize = () => {
    const state = resizeStateRef.current;
    if (!state) return;

    const preview = state.preview || state.startElement;
    const { canvasSettings: currentCanvasSettings } = useEditorStore.getState();
    const snappedX = currentCanvasSettings.snapToGrid
      ? snapValue(preview.x)
      : preview.x;
    const snappedY = currentCanvasSettings.snapToGrid
      ? snapValue(preview.y)
      : preview.y;
    const updates = {
      x: snappedX,
      y: snappedY,
      width: Math.max(MIN_ELEMENT_SIZE, preview.width),
      height: Math.max(MIN_ELEMENT_SIZE, preview.height),
    };

    updateElement(state.elementId, updates);
    socketService.emitElementUpdate(projectId, {
      ...state.startElement,
      ...updates,
      id: state.elementId,
    });

    if (canvasRef.current) {
      const shouldGrab =
        panModifierRef.current || activeToolRef.current === "pan";
      canvasRef.current.style.cursor = shouldGrab
        ? "grab"
        : activeToolRef.current === "select"
        ? "default"
        : "crosshair";
    }

    resizeStateRef.current = null;
  };

  const beginRotate = (event, element) => {
    event.stopPropagation();
    event.preventDefault?.();
    isDraggingRef.current = false;

    const displayObject = elementsMapRef.current.get(element.id);
    const overlay = selectionOverlaysRef.current.get(element.id);
    if (!displayObject || !overlay) return;

    const worldPos = toWorldCoordinates(event.data.global);
    const elementCenter = {
      x: element.x + element.width / 2,
      y: element.y + element.height / 2,
    };

    const startAngle = Math.atan2(
      worldPos.y - elementCenter.y,
      worldPos.x - elementCenter.x
    );

    rotateStateRef.current = {
      elementId: element.id,
      startElement: { ...element },
      startAngle,
      elementCenter,
      overlay,
      displayObject,
    };

    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing";
    }
  };

  const handleRotateDrag = (event) => {
    const state = rotateStateRef.current;
    if (!state) return;

    const worldPos = toWorldCoordinates(event.data.global);
    const currentAngle = Math.atan2(
      worldPos.y - state.elementCenter.y,
      worldPos.x - state.elementCenter.x
    );

    let deltaAngle = currentAngle - state.startAngle;
    let newRotation = (state.startElement.rotation || 0) + deltaAngle;

    // Snap to 45-degree increments
    const degrees = (newRotation * 180) / Math.PI;
    const snapThreshold = 3; // degrees
    const snappedDegrees = Math.round(degrees / 45) * 45;
    const isNearSnap = Math.abs(degrees - snappedDegrees) < snapThreshold;
    const finalDegrees = isNearSnap ? snappedDegrees : degrees;
    newRotation = (finalDegrees * Math.PI) / 180;

    // Store the current rotation in state
    state.currentRotation = newRotation;

    // Update element rotation
    updateElement(state.elementId, { rotation: newRotation });

    // Update overlay rotation
    if (state.overlay && state.overlay.container) {
      state.overlay.container.rotation = newRotation;
    }

    // Update display object rotation
    if (state.displayObject) {
      state.displayObject.rotation = newRotation;
    }
  };

  const finalizeRotate = () => {
    const state = rotateStateRef.current;
    if (!state) return;

    // Use the current rotation from state, or get from element
    const { elements: currentElements } = useEditorStore.getState();
    const currentRotation =
      state.currentRotation !== undefined
        ? state.currentRotation
        : currentElements.find((el) => el.id === state.elementId)?.rotation ||
          0;

    // Snap final rotation to 45-degree increments
    const degrees = (currentRotation * 180) / Math.PI;
    const snappedDegrees = Math.round(degrees / 45) * 45;
    const finalRotation = (snappedDegrees * Math.PI) / 180;

    updateElement(state.elementId, { rotation: finalRotation });

    const element = currentElements.find((el) => el.id === state.elementId);
    if (element) {
      socketService.emitElementUpdate(projectId, {
        ...element,
        rotation: finalRotation,
        id: state.elementId,
      });
    }

    if (canvasRef.current) {
      const shouldGrab =
        panModifierRef.current || activeToolRef.current === "pan";
      canvasRef.current.style.cursor = shouldGrab
        ? "grab"
        : activeToolRef.current === "select"
        ? "default"
        : "crosshair";
    }

    rotateStateRef.current = null;
  };

  const findElementAtPosition = (x, y) => {
    const { elements: currentElements } = useEditorStore.getState();
    for (let i = currentElements.length - 1; i >= 0; i--) {
      const element = currentElements[i];
      if (!element.visible) continue;
      const displayObject = elementsMapRef.current.get(element.id);
      if (!displayObject) continue;
      const bounds = displayObject.getBounds();
      if (bounds.contains(x, y)) {
        return element;
      }
    }
    return null;
  };

  const createDrawingElement = (tool, x, y, width, height) => {
    const baseElement = {
      x: snapValue(x),
      y: snapValue(y),
      width: Math.max(width, MIN_ELEMENT_SIZE),
      height: Math.max(height, MIN_ELEMENT_SIZE),
      fill: isFilled ? "#3b82f6" : null,
      stroke: "#000000",
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: elements.length,
      blendMode: "normal",
      effects: {},
    };

    let element;
    switch (tool) {
      case "rectangle":
        element = {
          ...baseElement,
          id: `rect_${Date.now()}`,
          type: "rectangle",
          fill: isFilled ? "#3b82f6" : null,
        };
        break;
      case "circle":
        element = {
          ...baseElement,
          id: `circle_${Date.now()}`,
          type: "circle",
          fill: isFilled ? "#ef4444" : null,
        };
        break;
      case "triangle":
        element = {
          ...baseElement,
          id: `triangle_${Date.now()}`,
          type: "triangle",
          fill: isFilled ? "#f59e0b" : null,
        };
        break;
      case "line":
        element = {
          ...baseElement,
          id: `line_${Date.now()}`,
          type: "line",
          fill: null,
        };
        break;
      case "arrow":
        element = {
          ...baseElement,
          id: `arrow_${Date.now()}`,
          type: "arrow",
          fill: isFilled ? "#22c55e" : null,
        };
        break;
      default:
        return null;
    }

    addElement(element);
    return element;
  };

  const createRectangle = (x, y) => {
    const element = createDrawingElement("rectangle", x, y, 100, 100);
    if (element) {
      socketService.emitElementAdd(projectId, element);
    }
  };

  const createCircle = (x, y) => {
    const element = createDrawingElement("circle", x, y, 100, 100);
    if (element) {
      socketService.emitElementAdd(projectId, element);
    }
  };

  const createTriangle = (x, y) => {
    const element = createDrawingElement("triangle", x, y, 120, 100);
    if (element) {
      socketService.emitElementAdd(projectId, element);
    }
  };

  const createLine = (x, y) => {
    const element = createDrawingElement("line", x, y, 200, 0);
    if (element) {
      socketService.emitElementAdd(projectId, element);
    }
  };

  const createArrow = (x, y) => {
    const element = createDrawingElement("arrow", x, y, 160, 80);
    if (element) {
      socketService.emitElementAdd(projectId, element);
    }
  };

  const updateFreeDrawShape = () => {
    if (!freeDrawPathRef.current || freeDrawPathRef.current.points.length < 1)
      return;

    const points = freeDrawPathRef.current.points;
    // Ensure we have at least 2 points for proper bounds calculation
    if (points.length === 1) {
      // Add a second point very close to the first for bounds calculation
      const firstPoint = points[0];
      points.push({ x: firstPoint.x + 0.1, y: firstPoint.y + 0.1 });
    }

    const bounds = calculatePathBounds(points);
    // Ensure minimum size
    const minSize = 1;
    const finalBounds = {
      x: bounds.x,
      y: bounds.y,
      width: Math.max(bounds.width, minSize),
      height: Math.max(bounds.height, minSize),
    };

    if (!freeDrawPathRef.current.elementId) {
      const { elements: currentElements } = useEditorStore.getState();
      const element = {
        id: `freehand_${Date.now()}`,
        type: "freehand",
        x: finalBounds.x,
        y: finalBounds.y,
        width: finalBounds.width,
        height: finalBounds.height,
        points: points.map((p) => ({
          x: p.x - finalBounds.x,
          y: p.y - finalBounds.y,
        })),
        stroke: "#000000",
        strokeWidth: 3,
        fill: null,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: currentElements.length,
        blendMode: "normal",
        effects: {},
      };
      addElement(element);
      freeDrawPathRef.current.elementId = element.id;
    } else {
      const element = useEditorStore
        .getState()
        .elements.find((el) => el.id === freeDrawPathRef.current.elementId);
      if (element) {
        updateElement(freeDrawPathRef.current.elementId, {
          x: finalBounds.x,
          y: finalBounds.y,
          width: finalBounds.width,
          height: finalBounds.height,
          points: points.map((p) => ({
            x: p.x - finalBounds.x,
            y: p.y - finalBounds.y,
          })),
        });
      }
    }
  };

  const finalizeFreeDrawShape = () => {
    if (freeDrawPathRef.current && freeDrawPathRef.current.elementId) {
      const element = useEditorStore
        .getState()
        .elements.find((el) => el.id === freeDrawPathRef.current.elementId);
      if (element) {
        socketService.emitElementAdd(projectId, element);
      }
    }
  };

  const calculatePathBounds = (points) => {
    if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;

    points.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  const createText = (x, y) => {
    const element = {
      id: `text_${Date.now()}`,
      type: "text",
      x: snapValue(x),
      y: snapValue(y),
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
      blendMode: "normal",
      effects: {},
    };

    addElement(element);
    socketService.emitElementAdd(projectId, element);
  };

  const renderElements = () => {
    const worldLayer = worldLayerRef.current;
    const overlayLayer = overlayLayerRef.current;
    if (!worldLayer || !overlayLayer) return;

    worldLayer.removeChildren();
    overlayLayer.removeChildren();
    elementsMapRef.current.clear();
    selectionOverlaysRef.current.clear();

    const sorted = [...elements].sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );
    const usedTextureSources = new Set();

    sorted.forEach((element) => {
      if (!element.visible) return;

      let pixiObject;

      switch (element.type) {
        case "rectangle": {
          pixiObject = new Graphics();
          drawRectangleShape(pixiObject, element);
          break;
        }
        case "circle": {
          pixiObject = new Graphics();
          drawEllipseShape(pixiObject, element);
          break;
        }
        case "triangle": {
          pixiObject = new Graphics();
          drawTriangleShape(pixiObject, element);
          break;
        }
        case "arrow": {
          pixiObject = new Graphics();
          drawArrowShape(pixiObject, element);
          break;
        }
        case "line": {
          pixiObject = new Graphics();
          drawLineShape(pixiObject, element);
          break;
        }
        case "freehand": {
          pixiObject = new Graphics();
          drawFreehandShape(pixiObject, element);
          break;
        }
        case "text": {
          pixiObject = new Text(element.text || "Text", {
            fontSize: element.fontSize || 24,
            fontFamily: element.fontFamily || "Arial",
            fill: element.fill || "#000000",
            align: element.align || "left",
          });
          pixiObject.width = element.width;
          pixiObject.height = element.height;
          break;
        }
        case "image": {
          const cachedTexture = textureCacheRef.current.get(element.src);
          if (cachedTexture) {
            pixiObject = new Sprite(cachedTexture);
            pixiObject.width = element.width;
            pixiObject.height = element.height;
            usedTextureSources.add(element.src);
          } else {
            const pending = textureLoadingRef.current.get(element.src);
            if (!pending) {
              const promise = Assets.load(element.src)
                .then((texture) => {
                  textureCacheRef.current.set(element.src, texture);
                  textureLoadingRef.current.delete(element.src);
                  renderElements();
                  return texture;
                })
                .catch((error) => {
                  textureLoadingRef.current.delete(element.src);
                  console.error("Failed to load image asset:", error);
                });
              textureLoadingRef.current.set(element.src, promise);
            }
            pixiObject = new Graphics();
            pixiObject.lineStyle(1, 0x4b5563, 1);
            pixiObject.beginFill(0x1f2937, 0.9);
            pixiObject.drawRect(0, 0, element.width, element.height);
            pixiObject.moveTo(0, 0);
            pixiObject.lineTo(element.width, element.height);
            pixiObject.moveTo(element.width, 0);
            pixiObject.lineTo(0, element.height);
            pixiObject.endFill();
          }
          break;
        }
        default:
          break;
      }

      if (!pixiObject) {
        return;
      }

      pixiObject.position.set(element.x, element.y);
      pixiObject.rotation = element.rotation || 0;
      pixiObject.alpha = element.opacity || 1;
      pixiObject.eventMode = "static";
      pixiObject.cursor =
        activeTool === "select"
          ? "move"
          : activeTool === "pan"
          ? "grab"
          : "pointer";
      pixiObject.accessible = true;
      pixiObject.accessibleTitle =
        element.accessibleName || `${element.type} element`;
      pixiObject.accessibleHint =
        "Drag to move. Use toolbar actions for other transforms.";
      pixiObject.hitArea = new Rectangle(0, 0, element.width, element.height);
      pixiObject.name = element.id;
      pixiObject.zIndex = element.zIndex ?? 0;
      pixiObject.blendMode = getBlendMode(element.blendMode);
      applyEffects(pixiObject, element);

      // Add click handler for element selection and dragging
      pixiObject.off("pointerdown");
      pixiObject.on("pointerdown", (event) => {
        if (activeToolRef.current === "select" && !panModifierRef.current) {
          event.stopPropagation();
          const worldPos = toWorldCoordinates(event.data.global);
          selectElement(
            element.id,
            event.data.originalEvent?.shiftKey || false
          );

          // Get the element's current position for dragging
          isDraggingRef.current = true;
          dragStartRef.current = {
            x: worldPos.x,
            y: worldPos.y,
          };
          // Store initial positions for all selected elements using latest state
          dragElementsRef.current.clear();
          const currentState = useEditorStore.getState();
          const currentSelectedIds = currentState.selectedIds;
          const currentElements = currentState.elements;
          currentSelectedIds.forEach((id) => {
            const el = currentElements.find((e) => e.id === id);
            if (el) {
              dragElementsRef.current.set(id, { x: el.x, y: el.y });
            }
          });
        }
      });

      worldLayer.addChild(pixiObject);
      elementsMapRef.current.set(element.id, pixiObject);

      if (selectedIds.includes(element.id)) {
        const includeHandles =
          selectedIds.length === 1 &&
          selectedIds[0] === element.id &&
          !element.locked;
        createSelectionOverlay(element, pixiObject, includeHandles);
      }
    });

    textureCacheRef.current.forEach((texture, key) => {
      if (!usedTextureSources.has(key) && !textureLoadingRef.current.has(key)) {
        texture.destroy(true);
        textureCacheRef.current.delete(key);
        Assets.unload(key).catch(() => {});
      }
    });
  };

  const updateCamera = () => {
    const app = appRef.current;
    const worldLayer = worldLayerRef.current;
    const overlayLayer = overlayLayerRef.current;
    if (!app || !worldLayer || !overlayLayer) return;

    const { width, height } = app.renderer.screen;
    worldLayer.scale.set(zoom);
    overlayLayer.scale.set(zoom);

    const offsetX = width / 2 - pan.x * zoom;
    const offsetY = height / 2 - pan.y * zoom;
    worldLayer.position.set(offsetX, offsetY);
    overlayLayer.position.set(offsetX, offsetY);
  };

  const drawGrid = () => {
    const app = appRef.current;
    const gridLayer = gridLayerRef.current;
    if (!app || !gridLayer) return;

    if (!canvasSettings.gridEnabled) {
      gridLayer.clear();
      return;
    }

    const { width, height } = app.renderer.screen;
    const scaledMinor = GRID_MINOR * Math.max(zoom, 0.0001);
    const scaledMajor = GRID_MAJOR * Math.max(zoom, 0.0001);

    gridLayer.clear();
    gridLayer.lineStyle(1, 0x1f2937, 0.35);

    const offsetMinorX = (pan.x * zoom) % scaledMinor;
    const offsetMinorY = (pan.y * zoom) % scaledMinor;

    for (
      let x = -scaledMinor * 4;
      x <= width + scaledMinor * 4;
      x += scaledMinor
    ) {
      const posX = x - offsetMinorX;
      gridLayer.moveTo(posX, 0);
      gridLayer.lineTo(posX, height);
    }

    for (
      let y = -scaledMinor * 4;
      y <= height + scaledMinor * 4;
      y += scaledMinor
    ) {
      const posY = y - offsetMinorY;
      gridLayer.moveTo(0, posY);
      gridLayer.lineTo(width, posY);
    }

    gridLayer.lineStyle(1.5, 0x3b82f6, 0.4);
    const offsetMajorX = (pan.x * zoom) % scaledMajor;
    const offsetMajorY = (pan.y * zoom) % scaledMajor;

    for (
      let x = -scaledMajor * 4;
      x <= width + scaledMajor * 4;
      x += scaledMajor
    ) {
      const posX = x - offsetMajorX;
      gridLayer.moveTo(posX, 0);
      gridLayer.lineTo(posX, height);
    }

    for (
      let y = -scaledMajor * 4;
      y <= height + scaledMajor * 4;
      y += scaledMajor
    ) {
      const posY = y - offsetMajorY;
      gridLayer.moveTo(0, posY);
      gridLayer.lineTo(width, posY);
    }

    const originScreen = worldToScreen({ x: 0, y: 0 });
    if (originScreen) {
      gridLayer.lineStyle(2, 0xffffff, 0.15);
      gridLayer.drawRect(originScreen.x - 1, 0, 2, height);
      gridLayer.drawRect(0, originScreen.y - 1, width, 2);
    }
  };

  const toWorldCoordinates = (point) => {
    const worldLayer = worldLayerRef.current;
    if (!worldLayer) return { x: point.x, y: point.y };
    const local = worldLayer.toLocal(point);
    return { x: local.x, y: local.y };
  };

  const worldToScreen = (point) => {
    const worldLayer = worldLayerRef.current;
    if (!worldLayer) return null;
    const global = worldLayer.toGlobal(point);
    return { x: global.x, y: global.y };
  };

  const getGlobalFromWheel = (event) => {
    const app = appRef.current;
    if (!app) return { x: event.offsetX, y: event.offsetY };
    const rect = app.view.getBoundingClientRect();
    const scaleX = app.renderer.width / rect.width;
    const scaleY = app.renderer.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const snapValue = (value) => {
    if (!canvasSettings.snapToGrid) return value;
    return Math.round(value / GRID_MINOR) * GRID_MINOR;
  };

  const getBlendMode = (mode) => {
    if (!mode) return BLEND_MODES.NORMAL;
    const normalized = String(mode).toUpperCase();
    return BLEND_MODES[normalized] ?? BLEND_MODES.NORMAL;
  };

  const applyEffects = (displayObject, element) => {
    const effects = element.effects || {};
    const filters = [];

    if (effects.blur?.enabled) {
      const blurStrength = Math.max(
        0,
        Math.min(30, effects.blur.strength ?? 4)
      );
      filters.push(new BlurFilter(blurStrength));
    }

    if (effects.grayscale?.enabled) {
      const grayscaleAmount = Math.max(
        0,
        Math.min(1, effects.grayscale.amount ?? 1)
      );
      const colorMatrix = new ColorMatrixFilter();
      colorMatrix.greyscale(grayscaleAmount, false);
      filters.push(colorMatrix);
    }

    displayObject.filters = filters.length > 0 ? filters : null;
    displayObject.cacheAsBitmap = !!effects.cacheAsBitmap;
  };

  const currentCursor = (() => {
    if (resizeStateRef.current && resizeStateRef.current.handleConfig) {
      return resizeStateRef.current.handleConfig.cursor;
    }
    if (panStateRef.current.active) {
      return "grabbing";
    }
    if (panModifierRef.current || activeTool === "pan") {
      return "grab";
    }
    if (activeTool === "select") {
      return "default";
    }
    return "crosshair";
  })();

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative"
      style={{
        cursor: currentCursor,
        backgroundColor: canvasSettings.backgroundColor || "#0f172a",
      }}
    />
  );
};

export default PixiCanvas;
