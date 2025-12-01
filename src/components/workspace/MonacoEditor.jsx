import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Monaco Editor language mappings
const LANGUAGE_MAP = {
  'html': 'html',
  'css': 'css',
  'javascript': 'javascript',
  'typescript': 'typescript',
  'jsx': 'javascript',
  'tsx': 'typescript',
  'python': 'python',
  'java': 'java',
  'json': 'json',
  'xml': 'xml',
  'markdown': 'markdown',
  'sql': 'sql',
  'php': 'php',
  'ruby': 'ruby',
  'go': 'go',
  'rust': 'rust',
  'c': 'c',
  'cpp': 'cpp',
  'csharp': 'csharp',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'yaml': 'yaml',
  'shell': 'shell',
  'bash': 'shell'
};

let monacoLoadPromise = null;

const loadMonaco = () => {
  if (monacoLoadPromise) return monacoLoadPromise;
  
  monacoLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.monaco) {
      resolve(window.monaco);
      return;
    }

    // Load Monaco from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
    script.async = true;
    
    script.onload = () => {
      window.require.config({
        paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
      });
      
      window.require(['vs/editor/editor.main'], () => {
        // Configure Monaco defaults
        if (window.monaco) {
          // JavaScript/TypeScript settings
          window.monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
          });
          
          window.monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: window.monaco.languages.typescript.ScriptTarget.ESNext,
            allowNonTsExtensions: true,
            moduleResolution: window.monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: window.monaco.languages.typescript.ModuleKind.ESNext,
            jsx: window.monaco.languages.typescript.JsxEmit.React,
            allowJs: true,
            checkJs: true
          });
          
          window.monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
          });
          
          // Add custom theme
          window.monaco.editor.defineTheme('customLight', {
            base: 'vs',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
              { token: 'keyword', foreground: '0000FF' },
              { token: 'string', foreground: 'A31515' },
              { token: 'number', foreground: '098658' },
              { token: 'tag', foreground: '800000' },
              { token: 'attribute.name', foreground: 'FF0000' },
              { token: 'attribute.value', foreground: '0000FF' }
            ],
            colors: {
              'editor.background': '#FFFFFF',
              'editor.lineHighlightBackground': '#F5F5F5',
              'editorLineNumber.foreground': '#999999',
              'editorCursor.foreground': '#000000',
              'editor.selectionBackground': '#ADD6FF'
            }
          });
        }
        
        resolve(window.monaco);
      });
    };
    
    script.onerror = reject;
    document.head.appendChild(script);
  });
  
  return monacoLoadPromise;
};

export default function MonacoEditor({
  value,
  language = 'javascript',
  onChange,
  readOnly = false,
  height = '100%',
  onCursorChange,
  remoteCursors = [],
  fileId
}) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const decorationsRef = useRef([]);

  useEffect(() => {
    let mounted = true;
    let editor = null;

    const initEditor = async () => {
      try {
        const monaco = await loadMonaco();
        
        if (!mounted || !containerRef.current) return;

        // Create editor
        editor = monaco.editor.create(containerRef.current, {
          value: value || '',
          language: LANGUAGE_MAP[language] || language,
          theme: 'customLight',
          readOnly,
          automaticLayout: true,
          minimap: { enabled: true, scale: 0.8 },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          folding: true,
          foldingStrategy: 'indentation',
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: 'full',
          tabSize: 2,
          insertSpaces: true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          snippetSuggestions: 'top',
          parameterHints: { enabled: true },
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          }
        });

        editorRef.current = editor;
        setIsLoading(false);

        // Handle content changes
        editor.onDidChangeModelContent(() => {
          if (onChange && !readOnly) {
            onChange(editor.getValue());
          }
        });

        // Handle cursor position changes
        editor.onDidChangeCursorPosition((e) => {
          if (onCursorChange) {
            onCursorChange({
              fileId,
              line: e.position.lineNumber,
              column: e.position.column
            });
          }
        });

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          // Trigger save - can be handled by parent
          const event = new CustomEvent('monaco-save', { detail: { value: editor.getValue() } });
          window.dispatchEvent(event);
        });

        // Format document shortcut
        editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
          editor.getAction('editor.action.formatDocument').run();
        });

      } catch (err) {
        console.error('Failed to load Monaco Editor:', err);
        setError('Failed to load code editor');
        setIsLoading(false);
      }
    };

    initEditor();

    return () => {
      mounted = false;
      if (editor) {
        editor.dispose();
      }
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(value);
        if (position) {
          editorRef.current.setPosition(position);
        }
      }
    }
  }, [value]);

  // Update language when prop changes
  useEffect(() => {
    if (editorRef.current && window.monaco) {
      const model = editorRef.current.getModel();
      if (model) {
        window.monaco.editor.setModelLanguage(model, LANGUAGE_MAP[language] || language);
      }
    }
  }, [language]);

  // Update read-only state
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

  // Handle remote cursors
  useEffect(() => {
    if (!editorRef.current || !window.monaco) return;

    const editor = editorRef.current;
    const monaco = window.monaco;

    // Clear previous decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

    // Add new cursor decorations
    const decorations = remoteCursors
      .filter(cursor => cursor.fileId === fileId)
      .map(cursor => ({
        range: new monaco.Range(cursor.line, cursor.column, cursor.line, cursor.column + 1),
        options: {
          className: `remote-cursor-${cursor.email?.replace(/[^a-zA-Z]/g, '')}`,
          hoverMessage: { value: cursor.name || cursor.email },
          beforeContentClassName: 'remote-cursor-line',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
      }));

    decorationsRef.current = editor.deltaDecorations([], decorations);
  }, [remoteCursors, fileId]);

  // Format document function exposed via ref
  const formatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading editor...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      <style>{`
        .remote-cursor-line {
          border-left: 2px solid;
          margin-left: 2px;
        }
      `}</style>
    </div>
  );
}

// Export format function for external use
export const formatMonacoDocument = () => {
  const event = new CustomEvent('monaco-format');
  window.dispatchEvent(event);
};