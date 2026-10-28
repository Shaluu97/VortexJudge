/**
 * Algo Xorazmiy Platform - Monaco Editor Bridge
 * Provides VS Code experience (syntax highlighting, auto-indentation, auto-closing brackets)
 * with 100% offline support and CDN fallback.
 */

window.AlgoEditor = (function() {
  let editorInstance = null;
  let currentTheme = 'algo-dark';

  function getMonacoLang(lang) {
    if (!lang) return 'python';
    lang = String(lang).toLowerCase().trim();
    if (lang.includes('python') || lang === 'py' || lang === 'pypy') return 'python';
    if (lang.includes('cpp') || lang.includes('c++') || lang === 'c') return 'cpp';
    if (lang.includes('java')) return 'java';
    if (lang.includes('csharp') || lang === 'cs') return 'csharp';
    if (lang.includes('pascal') || lang === 'pas') return 'pascal';
    if (lang.includes('rust')) return 'rust';
    if (lang.includes('go')) return 'go';
    if (lang.includes('js') || lang.includes('javascript')) return 'javascript';
    return 'python';
  }

  function defineDarkTheme() {
    if (typeof monaco === 'undefined') return;
    monaco.editor.defineTheme('algo-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { background: '080e1d' },
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: '38bdf8' }
      ],
      colors: {
        'editor.background': '#080e1d',
        'editor.foreground': '#f3f4f6',
        'editor.lineHighlightBackground': '#0d162a',
        'editorLineNumber.foreground': '#4b5563',
        'editorLineNumber.activeForeground': '#93c5fd',
        'editorCursor.foreground': '#60a5fa',
        'editor.selectionBackground': '#3b82f640',
        'editor.inactiveSelectionBackground': '#3b82f620',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#3b82f6',
        'editorBracketMatch.background': '#3b82f630',
        'editorBracketMatch.border': '#60a5fa'
      }
    });
  }

  function init({ containerId, fallbackTextareaId, initialCode = '', initialLang = 'cpp', onChange }) {
    const container = document.getElementById(containerId);
    const textarea = fallbackTextareaId ? document.getElementById(fallbackTextareaId) : null;

    if (!container) {
      console.error('[AlgoEditor] Container not found:', containerId);
      return Promise.reject(new Error('Container not found'));
    }

    return new Promise((resolve) => {
      function createEditor() {
        try {
          defineDarkTheme();

          editorInstance = monaco.editor.create(container, {
            value: initialCode || (textarea ? textarea.value : ''),
            language: getMonacoLang(initialLang),
            theme: currentTheme,
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            tabSize: 4,
            insertSpaces: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoClosingOvertype: 'always',
            autoIndent: 'full',
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            minimap: { enabled: false },
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true
          });

          // Hide fallback textarea if Monaco initialized successfully
          if (textarea) {
            textarea.style.display = 'none';
          }

          editorInstance.onDidChangeModelContent(() => {
            const val = editorInstance.getValue();
            if (textarea) textarea.value = val;
            if (typeof onChange === 'function') onChange(val);
          });

          // Resize observer to ensure full height/width
          const ro = new ResizeObserver(() => {
            if (editorInstance) editorInstance.layout();
          });
          ro.observe(container);

          resolve(editorInstance);
        } catch (err) {
          console.error('[AlgoEditor] Monaco initialization error:', err);
          // Fallback to enhanced textarea
          if (textarea) {
            textarea.style.display = 'block';
          }
          resolve(null);
        }
      }

      // Check if Monaco is already loaded
      if (typeof monaco !== 'undefined') {
        createEditor();
        return;
      }

      // Load Monaco via AMD loader
      function loadViaRequire() {
        const vsPath = (window.location.origin.includes('localhost') || window.location.origin.includes('192.168.'))
          ? '/vendor/monaco-editor/vs'
          : 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs';

        window.require.config({ paths: { vs: vsPath } });
        window.require(['vs/editor/editor.main'], function() {
          createEditor();
        });
      }

      if (typeof window.require !== 'undefined' && window.require.config) {
        loadViaRequire();
      } else {
        // Dynamically inject loader if not present
        const loaderScript = document.createElement('script');
        loaderScript.src = '/vendor/monaco-editor/vs/loader.js';
        loaderScript.onload = () => loadViaRequire();
        loaderScript.onerror = () => {
          // CDN fallback
          const cdnScript = document.createElement('script');
          cdnScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
          cdnScript.onload = () => loadViaRequire();
          cdnScript.onerror = () => {
            console.warn('[AlgoEditor] Monaco loader failed, using textarea fallback');
            if (textarea) textarea.style.display = 'block';
            resolve(null);
          };
          document.head.appendChild(cdnScript);
        };
        document.head.appendChild(loaderScript);
      }
    });
  }

  function setLanguage(lang) {
    if (!editorInstance || typeof monaco === 'undefined') return;
    const model = editorInstance.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, getMonacoLang(lang));
    }
  }

  function setCode(code) {
    if (editorInstance) {
      editorInstance.setValue(code || '');
    }
  }

  function getCode() {
    if (editorInstance) {
      return editorInstance.getValue();
    }
    return '';
  }

  function setFontSize(size) {
    if (editorInstance) {
      editorInstance.updateOptions({ fontSize: size });
    }
  }

  function layout() {
    if (editorInstance) {
      editorInstance.layout();
    }
  }

  return {
    init,
    setLanguage,
    setCode,
    getCode,
    setFontSize,
    layout,
    getInstance: () => editorInstance,
    getMonacoLang
  };
})();
