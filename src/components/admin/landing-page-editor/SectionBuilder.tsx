import { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSections } from './useSections';
import { useTheme } from './useTheme';
import { SectionList } from './SectionList';
import { SectionEditor } from './SectionEditor';
import { ThemePanel } from './ThemePanel';
import { FullPagePreview } from './FullPagePreview';
import { MobileNavigation } from './MobileNavigation';
import { Section } from './types';
import { cn } from '@/lib/utils';

interface SectionBuilderProps {
  landingPageId: string;
  gtmId?: string;
  onBack: () => void;
}

type MobileTab = 'sections' | 'editor' | 'preview' | 'theme';

export function SectionBuilder({ landingPageId, gtmId, onBack }: SectionBuilderProps) {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [previewingSections, setPreviewingSections] = useState<Set<string>>(new Set());
  const [rightPanel, setRightPanel] = useState<'preview' | 'theme'>('preview');
  const [mobileTab, setMobileTab] = useState<MobileTab>('sections');

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

  // Sync activeSection with updated sections data
  useEffect(() => {
    if (activeSection && sections.length > 0) {
      const updatedSection = sections.find(s => s.id === activeSection.id);
      if (updatedSection && (updatedSection.name !== activeSection.name || updatedSection.html !== activeSection.html)) {
        setActiveSection(updatedSection);
      }
    }
  }, [sections, activeSection]);

  // Initialize all sections as previewing by default
  useEffect(() => {
    if (sections.length > 0 && previewingSections.size === 0) {
      setPreviewingSections(new Set(sections.map(s => s.id)));
    }
  }, [sections, previewingSections.size]);

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
    previewingSections.delete(id);
    setPreviewingSections(new Set(previewingSections));
    deleteSection(id);
  };

  const handleSelectSection = (section: Section) => {
    setActiveSection(section);
    // On mobile, switch to editor tab when selecting a section
    if (window.innerWidth < 1024) {
      setMobileTab('editor');
    }
  };

  // Get visible sections for preview
  const visibleSections = sections.filter(s => previewingSections.has(s.id));

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] flex flex-col pb-14 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold">Section Builder</h2>
        </div>
        
        {/* Desktop Panel Toggle */}
        <div className="hidden lg:flex gap-2">
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

      {/* Desktop Layout - 3 columns */}
      <div className="hidden lg:grid flex-1 grid-cols-12 gap-4 min-h-0">
        {/* Left: Section List */}
        <div className="col-span-3 border rounded-lg p-4 overflow-hidden flex flex-col">
          <SectionList
            sections={sections}
            activeSection={activeSection}
            previewingSections={previewingSections}
            onSelectSection={handleSelectSection}
            onTogglePreview={toggleSectionPreview}
            onAddSection={(name, html) => addSection({ name, html })}
            onDuplicateSection={duplicateSection}
            onDeleteSection={handleDeleteSection}
            onReorderSections={reorderSections}
            isAdding={isAdding}
          />
        </div>

        {/* Center: Editor */}
        <div className="col-span-5 border rounded-lg p-4 overflow-hidden">
          <SectionEditor
            section={activeSection}
            onSave={updateSection}
            isSaving={isUpdating}
          />
        </div>

        {/* Right: Preview or Theme */}
        <div className="col-span-4 border rounded-lg p-4 overflow-hidden">
          {rightPanel === 'theme' ? (
            <ThemePanel
              themeConfig={themeConfig}
              onSave={saveTheme}
              isSaving={isThemeSaving}
            />
          ) : (
            <FullPagePreview
              sections={visibleSections}
              themeConfig={themeConfig}
              gtmId={gtmId}
            />
          )}
        </div>
      </div>

      {/* Mobile Layout - Single panel with bottom navigation */}
      <div className="lg:hidden flex-1 min-h-0">
        <div className={cn(
          'h-full border rounded-lg p-4 overflow-hidden',
          mobileTab !== 'sections' && 'hidden'
        )}>
          <SectionList
            sections={sections}
            activeSection={activeSection}
            previewingSections={previewingSections}
            onSelectSection={handleSelectSection}
            onTogglePreview={toggleSectionPreview}
            onAddSection={(name, html) => addSection({ name, html })}
            onDuplicateSection={duplicateSection}
            onDeleteSection={handleDeleteSection}
            onReorderSections={reorderSections}
            isAdding={isAdding}
          />
        </div>

        <div className={cn(
          'h-full border rounded-lg p-4 overflow-hidden',
          mobileTab !== 'editor' && 'hidden'
        )}>
          <SectionEditor
            section={activeSection}
            onSave={updateSection}
            isSaving={isUpdating}
          />
        </div>

        <div className={cn(
          'h-full border rounded-lg p-4 overflow-hidden',
          mobileTab !== 'preview' && 'hidden'
        )}>
          <FullPagePreview
            sections={visibleSections}
            themeConfig={themeConfig}
            gtmId={gtmId}
          />
        </div>

        <div className={cn(
          'h-full border rounded-lg p-4 overflow-hidden',
          mobileTab !== 'theme' && 'hidden'
        )}>
          <ThemePanel
            themeConfig={themeConfig}
            onSave={saveTheme}
            isSaving={isThemeSaving}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        hasActiveSection={!!activeSection}
      />
    </div>
  );
}
