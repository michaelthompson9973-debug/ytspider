import { useState } from 'react';
import { Eye, Edit, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { LibraryComponent, componentCategories } from './types';

interface ComponentCardProps {
  component: LibraryComponent;
  onPreview: (component: LibraryComponent) => void;
  onEdit: (component: LibraryComponent) => void;
  onDelete: (id: string) => void;
}

export function ComponentCard({ component, onPreview, onEdit, onDelete }: ComponentCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const categoryLabel = componentCategories.find(c => c.value === component.category)?.label || component.category;
  const origin = window.location.origin;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(component.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preload" href="${origin}/fonts/hind-siliguri-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${origin}/fonts/hind-siliguri-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${origin}/fonts/hind-siliguri-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${origin}/fonts/anek-bangla-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${origin}/fonts/anek-bangla-500.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${origin}/fonts/anek-bangla-600.woff2" as="font" type="font/woff2" crossorigin>
<style>
@font-face { font-family: "Hind Siliguri"; font-weight: 400; font-display: swap; src: url("${origin}/fonts/hind-siliguri-400.woff2") format("woff2"); }
@font-face { font-family: "Hind Siliguri"; font-weight: 500; font-display: swap; src: url("${origin}/fonts/hind-siliguri-500.woff2") format("woff2"); }
@font-face { font-family: "Hind Siliguri"; font-weight: 600; font-display: swap; src: url("${origin}/fonts/hind-siliguri-600.woff2") format("woff2"); }
@font-face { font-family: "Hind Siliguri"; font-weight: 700; font-display: swap; src: url("${origin}/fonts/hind-siliguri-700.woff2") format("woff2"); }
@font-face { font-family: "Anek Bangla"; font-weight: 400; font-display: swap; src: url("${origin}/fonts/anek-bangla-400.woff2") format("woff2"); }
@font-face { font-family: "Anek Bangla"; font-weight: 500; font-display: swap; src: url("${origin}/fonts/anek-bangla-500.woff2") format("woff2"); }
@font-face { font-family: "Anek Bangla"; font-weight: 600; font-display: swap; src: url("${origin}/fonts/anek-bangla-600.woff2") format("woff2"); }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Anek Bangla", sans-serif !important; transform: scale(0.25); transform-origin: top left; width: 400%; height: 400%; overflow: hidden; }
h1, h2, h3, h4, h5, h6 { font-family: "Hind Siliguri", sans-serif !important; }
p, span, div, button, a, li, td, th, label, input, textarea { font-family: "Anek Bangla", sans-serif !important; }
</style>
</head>
<body>${component.html}</body>
</html>`;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium line-clamp-1">{component.name}</CardTitle>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {categoryLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="aspect-video bg-white rounded-md overflow-hidden border">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0 pointer-events-none"
              title={`Preview: ${component.name}`}
              sandbox="allow-scripts"
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => onPreview(component)}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            Preview
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(component)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{component.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(component.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
