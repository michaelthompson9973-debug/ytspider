import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Settings, Eye, ShoppingCart, Package, Save, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSections } from './useSections';
import { useTheme } from './useTheme';
import { useCheckoutSettings } from './useCheckoutSettings';
import { SectionList } from './SectionList';
import { SectionEditor } from './SectionEditor';
import { CheckoutEditor } from './CheckoutEditor';
import { CheckoutSettingsPanel } from './CheckoutSettingsPanel';
import { ThemePanel } from './ThemePanel';
import { FullPagePreview } from './FullPagePreview';
import { MobileNavigation, MobileTab } from './MobileNavigation';
import { ProductsPanel } from './ProductsPanel';
import { Section, SectionType, CheckoutConfig } from './types';
import { cn } from '@/lib/utils';

interface SectionBuilderProps {
  landingPageId: string;
  gtmId?: string;
  slug?: string;
  onBack: () => void;
}

type RightPanel = 'preview' | 'theme' | 'checkout' | 'products';

export function SectionBuilder({ landingPageId, gtmId, slug, onBack }: SectionBuilderProps) {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [previewingSections, setPreviewingSections] = useState<Set<string>>(new Set());
  const [rightPanel, setRightPanel] = useState<RightPanel>('preview');
  const [mobileTab, setMobileTab] = useState<MobileTab>('sections');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const editorRef = useRef<{ triggerSave: () => void } | null>(null);

  const {
    sections,
    isLoading,
    addSection,
    addMultipleSections,
    updateSection,
    deleteSection,
    duplicateSection,
    reorderSections,
    isAdding,
    isUpdating,
  } = useSections(landingPageId);

  const { themeConfig, saveTheme, isSaving: isThemeSaving } = useTheme(landingPageId);
  
  // Checkout settings hook (separate from theme)
  const { checkoutSettings } = useCheckoutSettings(landingPageId);
  // Sync activeSection with updated sections data
  useEffect(() => {
    if (activeSection && sections.length > 0) {
      const updatedSection = sections.find(s => s.id === activeSection.id);
      if (updatedSection && (updatedSection.name !== activeSection.name || updatedSection.html !== activeSection.html)) {
        setActiveSection(updatedSection);
      }
    }
  }, [sections, activeSection]);

  // Auto-add new sections to previewingSections when sections array changes
  useEffect(() => {
    if (sections.length === 0) return;
    
    setPreviewingSections(prev => {
      const newSet = new Set(prev);
      let hasNewSections = false;
      
      // Add any new section IDs that aren't already in the set
      sections.forEach(s => {
        if (!prev.has(s.id)) {
          newSet.add(s.id);
          hasNewSections = true;
        }
      });
      
      // Only update state if there are new sections
      return hasNewSections ? newSet : prev;
    });
  }, [sections]);

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
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold">Section Builder</h2>
          {saveSuccess && (
            <span className="text-sm text-primary font-medium animate-in fade-in">
              ✓ Saved
            </span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Live Button */}
          {slug && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={`/p/${slug}?preview=true`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Preview</span>
              </a>
            </Button>
          )}
          
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
            <Button
              variant={rightPanel === 'products' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRightPanel('products')}
            >
              <Package className="h-4 w-4 mr-1" />
              Products
            </Button>
            <Button
              variant={rightPanel === 'checkout' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRightPanel('checkout')}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Checkout
            </Button>
          </div>
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
            onAddSection={(data: { name: string; html: string; type: SectionType; config: unknown }) => addSection(data)}
            onAddMultipleSections={addMultipleSections}
            onDuplicateSection={duplicateSection}
            onDeleteSection={handleDeleteSection}
            onReorderSections={reorderSections}
            isAdding={isAdding}
          />
        </div>

        {/* Center: Editor */}
        <div className="col-span-5 border rounded-lg p-4 overflow-hidden">
          {activeSection?.type === 'checkout' ? (
            <CheckoutEditor
              section={activeSection}
              themeConfig={themeConfig}
              landingPageId={landingPageId}
              onSave={(data) => updateSection({ id: data.id, name: data.name, config: data.config })}
              isSaving={isUpdating}
            />
          ) : (
            <SectionEditor
              section={activeSection}
              themeConfig={themeConfig}
              onSave={updateSection}
              isSaving={isUpdating}
            />
          )}
        </div>

        {/* Right: Preview, Theme, Products, or Checkout Settings */}
        <div className="col-span-4 border rounded-lg p-4 overflow-hidden">
          {rightPanel === 'theme' ? (
            <ThemePanel
              themeConfig={themeConfig}
              onSave={saveTheme}
              isSaving={isThemeSaving}
            />
          ) : rightPanel === 'products' ? (
            <ProductsPanel landingPageId={landingPageId} />
          ) : rightPanel === 'checkout' ? (
            <CheckoutSettingsPanel landingPageId={landingPageId} />
          ) : (
            <FullPagePreview
              sections={visibleSections}
              themeConfig={themeConfig}
              landingPageId={landingPageId}
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
            onAddSection={(data: { name: string; html: string; type: SectionType; config: unknown }) => addSection(data)}
            onAddMultipleSections={addMultipleSections}
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
          {activeSection?.type === 'checkout' ? (
            <CheckoutEditor
              section={activeSection}
              themeConfig={themeConfig}
              landingPageId={landingPageId}
              onSave={(data) => updateSection({ id: data.id, name: data.name, config: data.config })}
              isSaving={isUpdating}
            />
          ) : (
            <SectionEditor
              section={activeSection}
              themeConfig={themeConfig}
              onSave={updateSection}
              isSaving={isUpdating}
            />
          )}
        </div>

        <div className={cn(
          'h-full border rounded-lg p-4 overflow-hidden',
          mobileTab !== 'preview' && 'hidden'
        )}>
          <FullPagePreview
            sections={visibleSections}
            themeConfig={themeConfig}
            landingPageId={landingPageId}
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

        <div className={cn(
          'h-full border rounded-lg p-4 overflow-hidden',
          mobileTab !== 'checkout' && 'hidden'
        )}>
          <CheckoutSettingsPanel landingPageId={landingPageId} />
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
