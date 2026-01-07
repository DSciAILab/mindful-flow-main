import { useRef, useState, useCallback, useEffect } from 'react';
import { DrawingCanvas, DrawingCanvasRef } from './DrawingCanvas';
import { CanvasToolbar, DrawingTool } from './CanvasToolbar';
import { SketchGallery } from './SketchGallery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCanvas } from '@/hooks/useCanvas';
import { PenTool, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Sketch } from '@/types';

export function SketchPage() {
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { sketches, loading, addSketch, updateSketch, deleteSketch } = useCanvas();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingSketch, setEditingSketch] = useState<Sketch | null>(null);
  const [sketchTitle, setSketchTitle] = useState('');
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Drawing state
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e');
  const [fillMode, setFillMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Handle fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes (e.g., pressing Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrawing) return;

      // Escape to exit fullscreen or go back
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen();
        }
        return;
      }

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        canvasRef.current?.undo();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        canvasRef.current?.redo();
      }

      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, isFullscreen]);

  const handleNewSketch = useCallback(() => {
    setEditingSketch(null);
    setSketchTitle('');
    setIsDrawing(true);
    setHasChanges(false);
    // Reset to defaults
    setTool('pen');
    setStrokeColor('#ffffff');
    setStrokeWidth(3);
    setBackgroundColor('#1a1a2e');
    setFillMode(false);
  }, []);

  const handleEditSketch = useCallback((sketch: Sketch) => {
    setEditingSketch(sketch);
    setSketchTitle(sketch.title);
    setIsDrawing(true);
    setHasChanges(false);
    
    // Load canvas data after a short delay to ensure canvas is ready
    setTimeout(() => {
      if (canvasRef.current && sketch.canvas_data) {
        canvasRef.current.loadCanvasData(sketch.canvas_data);
      }
    }, 100);
  }, []);

  const handleSaveClick = useCallback(() => {
    setShowTitleDialog(true);
  }, []);

  const handleSaveConfirm = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsSaving(true);
    try {
      const canvasData = canvasRef.current.getCanvasData();
      const thumbnail = canvasRef.current.getThumbnail();
      const title = sketchTitle.trim() || `Desenho ${new Date().toLocaleDateString('pt-BR')}`;

      if (editingSketch) {
        await updateSketch(editingSketch.id, {
          title,
          canvas_data: canvasData,
          thumbnail,
        });
      } else {
        await addSketch({
          title,
          canvas_data: canvasData,
          thumbnail,
        });
      }

      setShowTitleDialog(false);
      setIsDrawing(false);
      setEditingSketch(null);
      setHasChanges(false);
      
      // Exit fullscreen when saving
      if (isFullscreen) {
        document.exitFullscreen();
      }
    } finally {
      setIsSaving(false);
    }
  }, [sketchTitle, editingSketch, addSketch, updateSketch, isFullscreen]);

  const handleBack = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen();
    }
    setIsDrawing(false);
    setEditingSketch(null);
    setSketchTitle('');
    setHasChanges(false);
  }, [isFullscreen]);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteConfirmId) {
      await deleteSketch(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteSketch]);

  const handleDrawingChange = useCallback(() => {
    setHasChanges(true);
  }, []);

  const handleExportPNG = useCallback(() => {
    canvasRef.current?.exportToPNG();
  }, []);

  const handleExportPDF = useCallback(() => {
    canvasRef.current?.exportToPDF();
  }, []);

  // Drawing mode view
  if (isDrawing) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          'flex flex-col gap-4',
          isFullscreen 
            ? 'fixed inset-0 z-50 bg-background p-4' 
            : 'h-[calc(100vh-8rem)]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h2 className="text-lg font-medium">
            {editingSketch ? 'Editando desenho' : 'Novo desenho'}
          </h2>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Toolbar */}
        <CanvasToolbar
          tool={tool}
          onToolChange={setTool}
          strokeColor={strokeColor}
          onColorChange={setStrokeColor}
          strokeWidth={strokeWidth}
          onWidthChange={setStrokeWidth}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={setBackgroundColor}
          fillMode={fillMode}
          onFillModeChange={setFillMode}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onUndo={() => canvasRef.current?.undo()}
          onRedo={() => canvasRef.current?.redo()}
          onClear={() => {
            canvasRef.current?.clear();
            setHasChanges(true);
          }}
          onSave={handleSaveClick}
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
          isSaving={isSaving}
        />

        {/* Canvas */}
        <div className="relative flex-1 overflow-hidden rounded-xl border border-border/50">
          <DrawingCanvas
            ref={canvasRef}
            tool={tool}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            backgroundColor={backgroundColor}
            fillMode={fillMode}
            onDrawingChange={handleDrawingChange}
            className="h-full w-full"
          />
        </div>

        {/* Title Dialog */}
        <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Desenho</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="sketch-title" className="text-sm font-medium">
                  Nome do desenho
                </label>
                <Input
                  id="sketch-title"
                  value={sketchTitle}
                  onChange={(e) => setSketchTitle(e.target.value)}
                  placeholder="Ex: Anotações da reunião"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTitleDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfirm} disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Gallery view
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <PenTool className="h-8 w-8 text-primary" />
          Canvas
        </h1>
        <p className="text-muted-foreground">
          Desenhe, faça anotações e esboços com Apple Pencil
        </p>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <SketchGallery
          sketches={sketches}
          loading={loading}
          onNewSketch={handleNewSketch}
          onEditSketch={handleEditSketch}
          onDeleteSketch={(id) => setDeleteConfirmId(id)}
        />
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir desenho?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O desenho será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
