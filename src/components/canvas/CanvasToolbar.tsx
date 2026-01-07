import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Pen, 
  Eraser, 
  Undo2, 
  Redo2, 
  Trash2, 
  Save,
  CircleDot,
  Maximize,
  Minimize,
  Square,
  Circle,
  Minus,
  Triangle,
  Download,
  Paintbrush,
  FileImage,
  FileText,
  Shapes,
  PaintBucket
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DrawingTool = 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'triangle';

interface CanvasToolbarProps {
  tool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  strokeColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onWidthChange: (width: number) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  fillMode: boolean;
  onFillModeChange: (fill: boolean) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isSaving?: boolean;
}

const STROKE_COLORS = [
  '#ffffff', // White
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#000000', // Black
];

const BACKGROUND_COLORS = [
  '#1a1a2e', // Dark blue (default)
  '#0f0f0f', // Almost black
  '#1e1e1e', // Dark gray
  '#2d2d44', // Dark purple
  '#1a2e1a', // Dark green
  '#2e1a1a', // Dark red
  '#ffffff', // White
  '#f5f5f4', // Light gray
  '#fef3c7', // Light yellow
  '#dbeafe', // Light blue
];

export function CanvasToolbar({
  tool,
  onToolChange,
  strokeColor,
  onColorChange,
  strokeWidth,
  onWidthChange,
  backgroundColor,
  onBackgroundColorChange,
  fillMode,
  onFillModeChange,
  isFullscreen,
  onToggleFullscreen,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onExportPNG,
  onExportPDF,
  canUndo = true,
  canRedo = false,
  isSaving = false,
}: CanvasToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card/80 p-2 backdrop-blur-sm">
      {/* Drawing Tools */}
      <div className="flex items-center gap-1 border-r border-border/50 pr-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={tool === 'pen' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onToolChange('pen')}
              className="h-9 w-9"
            >
              <Pen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Caneta</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={tool === 'eraser' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onToolChange('eraser')}
              className="h-9 w-9"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Borracha</TooltipContent>
        </Tooltip>
      </div>

      {/* Shape Tools */}
      <div className="flex items-center gap-1 border-r border-border/50 pr-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={['line', 'rectangle', 'circle', 'triangle'].includes(tool) ? 'default' : 'ghost'} 
              size="icon" 
              className="h-9 w-9"
            >
              <Shapes className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === 'line' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => onToolChange('line')}
                    className="h-9 w-9"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Linha</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === 'rectangle' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => onToolChange('rectangle')}
                    className="h-9 w-9"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Retângulo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === 'circle' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => onToolChange('circle')}
                    className="h-9 w-9"
                  >
                    <Circle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Círculo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === 'triangle' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => onToolChange('triangle')}
                    className="h-9 w-9"
                  >
                    <Triangle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Triângulo</TooltipContent>
              </Tooltip>
              </div>

              {/* Fill Mode Toggle */}
              <div className="flex items-center justify-between border-t border-border/50 pt-2">
                <span className="text-xs text-muted-foreground">Preenchimento</span>
                <Button
                  variant={fillMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFillModeChange(!fillMode)}
                  className="h-7 gap-1"
                >
                  <PaintBucket className="h-3 w-3" />
                  {fillMode ? 'Cheio' : 'Vazado'}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Stroke Color Picker */}
      <div className="flex items-center gap-1 border-r border-border/50 pr-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <div
                className="h-5 w-5 rounded-full border-2 border-white/30"
                style={{ backgroundColor: strokeColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Cor do traço</div>
              <div className="grid grid-cols-5 gap-2">
                {STROKE_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                      strokeColor === color
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => onColorChange(color)}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Background Color Picker */}
      <div className="flex items-center gap-1 border-r border-border/50 pr-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Paintbrush className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Cor do fundo</div>
              <div className="grid grid-cols-5 gap-2">
                {BACKGROUND_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                      backgroundColor === color
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-border'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => onBackgroundColorChange(color)}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Stroke Width */}
      <div className="flex items-center gap-2 border-r border-border/50 pr-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <CircleDot className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-4" align="start">
            <div className="space-y-3">
              <div className="text-sm font-medium">Espessura: {strokeWidth}px</div>
              <Slider
                value={[strokeWidth]}
                onValueChange={(value) => onWidthChange(value[0])}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fino</span>
                <span>Grosso</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 border-r border-border/50 pr-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-9 w-9"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Desfazer</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-9 w-9"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refazer</TooltipContent>
        </Tooltip>
      </div>

      {/* Clear */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-9 w-9 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Limpar tudo</TooltipContent>
      </Tooltip>

      {/* Fullscreen Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className="h-9 w-9"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</TooltipContent>
      </Tooltip>

      {/* Export Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Download className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportPNG}>
            <FileImage className="mr-2 h-4 w-4" />
            Exportar PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Exportar PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="ml-auto h-9 gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Salvar desenho</TooltipContent>
      </Tooltip>
    </div>
  );
}
