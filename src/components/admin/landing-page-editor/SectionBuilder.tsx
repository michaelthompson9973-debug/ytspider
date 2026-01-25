import { useState } from 'react';
import { ArrowLeft, Settings, Layers, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSections } from './useSections';
import { useTheme } from './useTheme';
import { SectionList } from './SectionList';
import { SectionEditor } from './SectionEditor';
import { ThemePanel } from './ThemePanel';
import { FullPagePreview } from './FullPagePreview';
import { SectionPreview } from './SectionPreview';
import { Section } from './types';

interface SectionBuilderProps {
  landingPageId: string;
  gtmId?: string;
  onBack: () => void;
}

export function SectionBuilder({ landingPageId, gtmId, onBack }: SectionBuilderProps) {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [previewingSections, setPreviewingSections] = useState<Set<string>>(new Set());
  const [rightPanel, setRightPanel] = useState<'preview' | 'theme'>('preview');

  const {
    sections,
    isLoading,
    addSection,
    updateSection,
    deleteSection,
    duplicateSection,
    reorderSections,
    isAdding,
    isUpdating,
  } = useSections(landingPageId);

  const { themeConfig, saveTheme, isSaving: isThemeSaving } = useTheme(landingPageId);

  const toggleSectionPreview = (sectionId: string) => {
    setPreviewingSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleDeleteSection = (id: string) => {
    if (activeSection?.id === id) {
      setActiveSection(null);
    }
    deleteSection(id);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        Loading sections...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold">Section Builder</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={rightPanel === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRightPanel('preview')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant={rightPanel === 'theme' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRightPanel('theme')}
          >
            <Settings className="h-4 w-4 mr-1" />
            Theme
          </Button>
        </div>
      </div>

      {/* Main Layout - 3 columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left: Section List */}
        <div className="lg:col-span-3 border rounded-lg p-4 overflow-hidden">
          <SectionList
            sections={sections}
            activeSection={activeSection}
            previewingSections={previewingSections}
            onSelectSection={setActiveSection}
            onTogglePreview={toggleSectionPreview}
            onAddSection={(name, html) => addSection({ name, html })}
            onDuplicateSection={duplicateSection}
            onDeleteSection={handleDeleteSection}
            onReorderSections={reorderSections}
            isAdding={isAdding}
          />
        </div>

        {/* Center: Editor */}
        <div className="lg:col-span-5 border rounded-lg p-4 overflow-hidden">
          <SectionEditor
            section={activeSection}
            onSave={updateSection}
            isSaving={isUpdating}
          />
        </div>

        {/* Right: Preview or Theme */}
        <div className="lg:col-span-4 border rounded-lg p-4 overflow-hidden">
          {rightPanel === 'theme' ? (
            <ThemePanel
              themeConfig={themeConfig}
              onSave={saveTheme}
              isSaving={isThemeSaving}
            />
          ) : (
            <Tabs defaultValue="full" className="h-full flex flex-col">
              <TabsList className="mb-2">
                <TabsTrigger value="full">Full Page</TabsTrigger>
                <TabsTrigger value="sections">Sections</TabsTrigger>
              </TabsList>
              <TabsContent value="full" className="flex-1 mt-0">
                <FullPagePreview
                  sections={sections}
                  themeConfig={themeConfig}
                  gtmId={gtmId}
                />
              </TabsContent>
              <TabsContent value="sections" className="flex-1 mt-0">
                <SectionPreview
                  sections={sections}
                  previewingSections={previewingSections}
                  themeConfig={themeConfig}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
