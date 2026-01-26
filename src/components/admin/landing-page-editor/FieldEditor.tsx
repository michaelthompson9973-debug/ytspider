import { useState } from 'react';
import { ChevronDown, Trash2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckoutField } from './types';
import { cn } from '@/lib/utils';

interface FieldEditorProps {
  field: CheckoutField;
  onChange: (field: CheckoutField) => void;
  onRemove?: () => void;
  isDefault?: boolean;
}

export function FieldEditor({ field, onChange, onRemove, isDefault = false }: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn(
      "border rounded-lg transition-all",
      isExpanded ? "bg-muted/30" : "bg-background"
    )}>
      {/* Collapsed View */}
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
        
        <Switch
          checked={field.enabled}
          onCheckedChange={(enabled) => onChange({ ...field, enabled })}
          className="scale-90"
        />
        
        <span className={cn(
          "flex-1 text-sm truncate",
          !field.enabled && "text-muted-foreground line-through"
        )}>
          {field.label}
        </span>
        
        {field.required && field.enabled && (
          <span className="text-xs text-destructive">*</span>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isExpanded && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Label</Label>
              <Input
                value={field.label}
                onChange={(e) => onChange({ ...field, label: e.target.value })}
                className="h-8 text-sm"
                placeholder="Field label"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Placeholder</Label>
              <Input
                value={field.placeholder}
                onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
                className="h-8 text-sm"
                placeholder="Placeholder text"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={field.type}
                onValueChange={(type: CheckoutField['type']) => onChange({ ...field, type })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="tel">Phone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2 pb-1">
              <div className="flex items-center gap-2">
                <Switch
                  id={`required-${field.id}`}
                  checked={field.required}
                  onCheckedChange={(required) => onChange({ ...field, required })}
                  className="scale-90"
                />
                <Label htmlFor={`required-${field.id}`} className="text-xs">
                  Required
                </Label>
              </div>
            </div>
          </div>

          {!isDefault && onRemove && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remove Field
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
