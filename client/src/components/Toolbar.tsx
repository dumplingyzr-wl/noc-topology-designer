/*
 * Toolbar Component - Tool selection and actions
 * Design: Dark Professional
 */

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ToolMode, CanvasSettings, RoutingMode } from '@/types/noc';
import {
  MousePointer2,
  Hand,
  Cable,
  Plus,
  Undo2,
  Redo2,
  Trash2,
  Grid3X3,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutGrid,
  Spline,
  CornerDownRight,
  Minus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface ToolbarProps {
  toolMode: ToolMode;
  settings: CanvasSettings;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  onToolModeChange: (mode: ToolMode) => void;
  onSettingsChange: (settings: Partial<CanvasSettings>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onExport: () => void;
  onImport: () => void;
  onGenerateMesh: () => void;
  onGenerateButterfly: () => void;
  onClearAll: () => void;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, shortcut, active, disabled, onClick }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'default' : 'ghost'}
          size="icon"
          className={cn(
            "h-9 w-9",
            active && "bg-primary text-primary-foreground"
          )}
          disabled={disabled}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{label}</span>
        {shortcut && (
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">{shortcut}</kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar({
  toolMode,
  settings,
  canUndo,
  canRedo,
  hasSelection,
  onToolModeChange,
  onSettingsChange,
  onUndo,
  onRedo,
  onDelete,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onExport,
  onImport,
  onGenerateMesh,
  onGenerateButterfly,
  onClearAll,
}: ToolbarProps) {
  const routingModeIcons: Record<RoutingMode, React.ReactNode> = {
    bezier: <Spline className="h-4 w-4" />,
    orthogonal: <CornerDownRight className="h-4 w-4" />,
    straight: <Minus className="h-4 w-4" />,
  };

  return (
    <div className="flex items-center gap-1 p-2 bg-card border-b border-border">
      {/* Tool selection */}
      <div className="flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5">
        <ToolButton
          icon={<MousePointer2 className="h-4 w-4" />}
          label="Select"
          shortcut="V"
          active={toolMode === 'select'}
          onClick={() => onToolModeChange('select')}
        />
        <ToolButton
          icon={<Hand className="h-4 w-4" />}
          label="Pan"
          shortcut="H"
          active={toolMode === 'pan'}
          onClick={() => onToolModeChange('pan')}
        />
        <ToolButton
          icon={<Plus className="h-4 w-4" />}
          label="Add Router"
          shortcut="R"
          active={toolMode === 'add-router'}
          onClick={() => onToolModeChange('add-router')}
        />
        <ToolButton
          icon={<Cable className="h-4 w-4" />}
          label="Connect"
          shortcut="C"
          active={toolMode === 'connect'}
          onClick={() => onToolModeChange('connect')}
        />
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* History */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          icon={<Undo2 className="h-4 w-4" />}
          label="Undo"
          shortcut="Ctrl+Z"
          disabled={!canUndo}
          onClick={onUndo}
        />
        <ToolButton
          icon={<Redo2 className="h-4 w-4" />}
          label="Redo"
          shortcut="Ctrl+Y"
          disabled={!canRedo}
          onClick={onRedo}
        />
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Delete */}
      <ToolButton
        icon={<Trash2 className="h-4 w-4" />}
        label="Delete Selected"
        shortcut="Del"
        disabled={!hasSelection}
        onClick={onDelete}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          icon={<ZoomOut className="h-4 w-4" />}
          label="Zoom Out"
          shortcut="-"
          onClick={onZoomOut}
        />
        <ToolButton
          icon={<ZoomIn className="h-4 w-4" />}
          label="Zoom In"
          shortcut="+"
          onClick={onZoomIn}
        />
        <ToolButton
          icon={<Maximize2 className="h-4 w-4" />}
          label="Fit to View"
          shortcut="F"
          onClick={onZoomFit}
        />
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* View settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 gap-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="text-xs">View</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Grid</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onSettingsChange({ showGrid: !settings.showGrid })}>
            {settings.showGrid ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {settings.showGrid ? 'Hide Grid' : 'Show Grid'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSettingsChange({ snapToGrid: !settings.snapToGrid })}>
            <Grid3X3 className="h-4 w-4 mr-2" />
            Snap to Grid: {settings.snapToGrid ? 'On' : 'Off'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Labels</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onSettingsChange({ showPortLabels: !settings.showPortLabels })}>
            {settings.showPortLabels ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            Port Labels: {settings.showPortLabels ? 'On' : 'Off'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Connection Routing</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onSettingsChange({ routingMode: 'bezier' })}>
            <Spline className="h-4 w-4 mr-2" />
            Bezier Curves {settings.routingMode === 'bezier' && '✓'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSettingsChange({ routingMode: 'orthogonal' })}>
            <CornerDownRight className="h-4 w-4 mr-2" />
            Orthogonal {settings.routingMode === 'orthogonal' && '✓'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSettingsChange({ routingMode: 'straight' })}>
            <Minus className="h-4 w-4 mr-2" />
            Straight Lines {settings.routingMode === 'straight' && '✓'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      {/* Generate */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="text-xs">Generate</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onGenerateMesh}>
            <LayoutGrid className="h-4 w-4 mr-2" />
            Mesh Topology...
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onGenerateButterfly}>
            <Cable className="h-4 w-4 mr-2" />
            Butterfly / Clos...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* File operations */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 gap-2">
            <Download className="h-4 w-4" />
            <span className="text-xs">File</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onClearAll} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
