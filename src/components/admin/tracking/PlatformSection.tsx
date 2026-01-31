import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Field {
  key: string;
  label: string;
  placeholder: string;
  isSecret?: boolean;
  optional?: boolean;
}

interface PlatformSectionProps {
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  fields: Field[];
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  defaultOpen?: boolean;
}

export function PlatformSection({
  title,
  icon,
  enabled,
  onEnabledChange,
  fields,
  values,
  onValueChange,
  defaultOpen = false,
}: PlatformSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasValues = fields.some((field) => values[field.key]?.trim());

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors",
              isOpen && "border-b"
            )}
          >
            <div className="flex items-center gap-3">
              {icon}
              <span className="font-medium">{title}</span>
              {hasValues && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Configured
                </span>
              )}
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                id={`${title}-enabled`}
                checked={enabled}
                onCheckedChange={onEnabledChange}
              />
              <Label htmlFor={`${title}-enabled`}>Enable {title}</Label>
            </div>

            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.optional && (
                    <span className="text-muted-foreground text-xs ml-1">(optional)</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id={field.key}
                    type={field.isSecret && !showSecrets[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={values[field.key] || ''}
                    onChange={(e) => onValueChange(field.key, e.target.value)}
                    className={field.isSecret ? 'pr-10' : ''}
                  />
                  {field.isSecret && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => toggleSecret(field.key)}
                    >
                      {showSecrets[field.key] ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
