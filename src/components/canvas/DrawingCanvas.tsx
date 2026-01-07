import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import type { DrawingTool } from './CanvasToolbar';

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: DrawingTool;
  fillMode?: boolean;
  // For shape tools
  startPoint?: Point;
  endPoint?: Point;
}

export interface DrawingCanvasRef {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  getCanvasData: () => string;
  getThumbnail: () => string;
  loadCanvasData: (data: string) => void;
  exportToPNG: () => void;
  exportToPDF: () => void;
}

interface DrawingCanvasProps {
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  tool?: DrawingTool;
  fillMode?: boolean;
  onDrawingChange?: () => void;
}

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ className, strokeColor = '#ffffff', strokeWidth = 3, backgroundColor = '#1a1a2e', tool = 'pen', fillMode = false, onDrawingChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [redoStack, setRedoStack] = useState<Stroke[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    
    // Store loaded image as base layer
    const loadedImageRef = useRef<HTMLImageElement | null>(null);
    const [hasLoadedImage, setHasLoadedImage] = useState(false);

    // Initialize canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas size to match container
      const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        setCanvasSize({ width: rect.width, height: rect.height });
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          contextRef.current = ctx;
          
          // Redraw all strokes after resize
          redrawCanvas();
        }
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Redraw canvas with all strokes
    const redrawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;

      const rect = canvas.getBoundingClientRect();
      
      // Clear canvas with background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw loaded image as base layer if exists
      if (hasLoadedImage && loadedImageRef.current) {
        ctx.drawImage(loadedImageRef.current, 0, 0, rect.width, rect.height);
      }

      // Redraw all strokes
      strokes.forEach(stroke => {
        drawStroke(ctx, stroke, backgroundColor);
      });

      // Draw current stroke preview for shapes
      if (currentStroke && currentStroke.startPoint && currentStroke.endPoint) {
        drawStroke(ctx, currentStroke, backgroundColor);
      }
    }, [strokes, backgroundColor, currentStroke, hasLoadedImage]);

    useEffect(() => {
      redrawCanvas();
    }, [redrawCanvas]);

    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, bgColor: string) => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? bgColor : stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.width * (stroke.tool === 'eraser' ? 3 : 1);

      if (['line', 'rectangle', 'circle', 'triangle'].includes(stroke.tool)) {
        // Draw geometric shapes
        if (stroke.startPoint && stroke.endPoint) {
          const start = stroke.startPoint;
          const end = stroke.endPoint;
          const shouldFill = stroke.fillMode && stroke.tool !== 'line';

          switch (stroke.tool) {
            case 'line':
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.stroke();
              break;

            case 'rectangle':
              if (shouldFill) {
                ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
              }
              ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
              break;

            case 'circle':
              const radiusX = Math.abs(end.x - start.x) / 2;
              const radiusY = Math.abs(end.y - start.y) / 2;
              const centerX = start.x + (end.x - start.x) / 2;
              const centerY = start.y + (end.y - start.y) / 2;
              ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
              if (shouldFill) {
                ctx.fill();
              }
              ctx.stroke();
              break;

            case 'triangle':
              const midX = (start.x + end.x) / 2;
              ctx.moveTo(midX, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.lineTo(start.x, end.y);
              ctx.closePath();
              if (shouldFill) {
                ctx.fill();
              }
              ctx.stroke();
              break;
          }
        }
      } else {
        // Draw freehand strokes
        if (stroke.points.length < 2) return;

        for (let i = 0; i < stroke.points.length - 1; i++) {
          const p1 = stroke.points[i];
          const p2 = stroke.points[i + 1];
          
          // Pressure-sensitive width
          const pressure = (p1.pressure + p2.pressure) / 2;
          ctx.lineWidth = stroke.width * pressure * (stroke.tool === 'eraser' ? 3 : 1);

          if (i === 0) {
            ctx.moveTo(p1.x, p1.y);
          }

          // Smooth curve using quadratic bezier
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
        ctx.stroke();
      }
    };

    const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure > 0 ? e.pressure : 0.5,
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Capture pointer for smooth drawing
      canvas.setPointerCapture(e.pointerId);

      const point = getPointerPos(e);
      setIsDrawing(true);
      
      if (['line', 'rectangle', 'circle', 'triangle'].includes(tool)) {
        // Shape tools
        setCurrentStroke({
          points: [],
          color: strokeColor,
          width: strokeWidth,
          tool: tool,
          fillMode: fillMode,
          startPoint: point,
          endPoint: point,
        });
      } else {
        // Freehand tools
        setCurrentStroke({
          points: [point],
          color: strokeColor,
          width: strokeWidth,
          tool: tool,
        });
      }
      setRedoStack([]); // Clear redo stack on new stroke
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !currentStroke || !contextRef.current) return;

      const point = getPointerPos(e);

      if (['line', 'rectangle', 'circle', 'triangle'].includes(tool)) {
        // Update shape preview
        setCurrentStroke({
          ...currentStroke,
          endPoint: point,
        });
      } else {
        // Freehand drawing
        const updatedStroke = {
          ...currentStroke,
          points: [...currentStroke.points, point],
        };
        setCurrentStroke(updatedStroke);

        // Draw the current segment
        const ctx = contextRef.current;
        const points = updatedStroke.points;
        if (points.length >= 2) {
          const p1 = points[points.length - 2];
          const p2 = points[points.length - 1];
          
          ctx.beginPath();
          ctx.strokeStyle = tool === 'eraser' ? backgroundColor : strokeColor;
          const pressure = (p1.pressure + p2.pressure) / 2;
          ctx.lineWidth = strokeWidth * pressure * (tool === 'eraser' ? 3 : 1);
          ctx.moveTo(p1.x, p1.y);
          
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          ctx.stroke();
        }
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !currentStroke) return;

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }

      setIsDrawing(false);
      
      const isValidStroke = ['line', 'rectangle', 'circle', 'triangle'].includes(tool)
        ? currentStroke.startPoint && currentStroke.endPoint
        : currentStroke.points.length > 1;

      if (isValidStroke) {
        setStrokes([...strokes, currentStroke]);
        onDrawingChange?.();
      }
      setCurrentStroke(null);
    };

    // Export to PNG
    const exportToPNG = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `sketch_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }, []);

    // Export to PDF
    const exportToPDF = useCallback(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Create a simple PDF with the canvas image
      const imgData = canvas.toDataURL('image/png');
      
      // Create HTML content for PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Sketch Export</title>
              <style>
                @media print {
                  body { margin: 0; }
                  img { max-width: 100%; height: auto; }
                }
                body {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: #f5f5f5;
                }
                img {
                  max-width: 100%;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" alt="Sketch" />
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 250);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      clear: () => {
        setStrokes([]);
        setRedoStack([]);
        setCurrentStroke(null);
        loadedImageRef.current = null;
        setHasLoadedImage(false);
        onDrawingChange?.();
      },
      undo: () => {
        if (strokes.length > 0) {
          const lastStroke = strokes[strokes.length - 1];
          setStrokes(strokes.slice(0, -1));
          setRedoStack([...redoStack, lastStroke]);
          onDrawingChange?.();
        }
      },
      redo: () => {
        if (redoStack.length > 0) {
          const strokeToRedo = redoStack[redoStack.length - 1];
          setStrokes([...strokes, strokeToRedo]);
          setRedoStack(redoStack.slice(0, -1));
          onDrawingChange?.();
        }
      },
      getCanvasData: () => {
        const canvas = canvasRef.current;
        if (!canvas) return '';
        return canvas.toDataURL('image/png');
      },
      getThumbnail: () => {
        const canvas = canvasRef.current;
        if (!canvas) return '';
        
        // Create thumbnail canvas
        const thumbCanvas = document.createElement('canvas');
        const thumbSize = 200;
        thumbCanvas.width = thumbSize;
        thumbCanvas.height = thumbSize;
        
        const ctx = thumbCanvas.getContext('2d');
        if (!ctx) return '';
        
        // Scale and draw
        const scale = Math.min(thumbSize / canvas.width, thumbSize / canvas.height);
        const width = canvas.width * scale;
        const height = canvas.height * scale;
        const x = (thumbSize - width) / 2;
        const y = (thumbSize - height) / 2;
        
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, thumbSize, thumbSize);
        ctx.drawImage(canvas, x, y, width, height);
        
        return thumbCanvas.toDataURL('image/png', 0.7);
      },
      loadCanvasData: (data: string) => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx || !data) return;

        const img = new Image();
        img.onload = () => {
          // Store the loaded image as a base layer
          loadedImageRef.current = img;
          setHasLoadedImage(true);
          
          // Clear strokes since we're loading a complete image
          setStrokes([]);
          setRedoStack([]);
          
          // Draw immediately
          const rect = canvas.getBoundingClientRect();
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.onerror = () => {
          console.error('Failed to load canvas data');
        };
        img.src = data;
      },
      exportToPNG,
      exportToPDF,
    }));

    return (
      <canvas
        ref={canvasRef}
        className={cn(
          'touch-none cursor-crosshair rounded-xl',
          className
        )}
        style={{ 
          width: '100%', 
          height: '100%',
          touchAction: 'none',
          backgroundColor: backgroundColor,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
