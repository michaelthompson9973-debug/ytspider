import { useRef, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface SmartCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'html' | 'css' | 'javascript';
  theme?: 'vs-dark' | 'light';
  height?: string;
  placeholder?: string;
  className?: string;
}

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  wordWrap: 'on',
  lineNumbers: 'on',
  renderLineHighlight: 'all',
  bracketPairColorization: { enabled: true },
  formatOnPaste: true,
  autoClosingBrackets: 'always',
  tabSize: 2,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 12, bottom: 12 },
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  folding: true,
  foldingHighlight: true,
  showFoldingControls: 'mouseover',
  matchBrackets: 'always',
  renderWhitespace: 'selection',
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
};

export function SmartCodeEditor({
  value,
  onChange,
  language = 'html',
  theme = 'vs-dark',
  height = '100%',
  placeholder,
  className,
}: SmartCodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    
    // Focus editor on mount
    editor.focus();
    
    // Add custom key bindings
    editor.addCommand(
      // Ctrl+S to trigger parent save (bubble up)
      2048 + 49, // KeyMod.CtrlCmd | KeyCode.KeyS
      () => {
        // Dispatch custom event for parent to handle save
        window.dispatchEvent(new CustomEvent('editor-save'));
      }
    );
  }, []);

  const handleChange: OnChange = useCallback((newValue) => {
    onChange(newValue || '');
  }, [onChange]);

  return (
    <div className={className} style={{ height }}>
      <Editor
        height="100%"
        language={language}
        theme={theme}
        value={value}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={editorOptions}
        loading={
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
