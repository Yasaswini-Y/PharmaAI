import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables: {
    primaryColor: '#e3f4fa',
    primaryTextColor: '#0f3342',
    primaryBorderColor: '#167a9b',
    lineColor: '#1a93b8',
    secondaryColor: '#f4fafc',
    tertiaryColor: '#deebf1',
    fontFamily: "'Inter', sans-serif",
    fontSize: '13px',
  },
});

export function MermaidDiagram({ definition, title }) {
  const ref = useRef(null);
  const containerRef = useRef(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!definition) {
      setError('');
      return undefined;
    }

    const render = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const result = await mermaid.render(id, definition);
        if (alive && ref.current) {
          ref.current.innerHTML = result.svg;
          // Ensure svg is responsive
          const svgEl = ref.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.transition = 'transform 0.2s ease';
          }
        }
      } catch (renderError) {
        if (alive) {
          setError(renderError.message || 'Diagram could not be rendered.');
        }
      }
    };

    render();
    return () => {
      alive = false;
    };
  }, [definition]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.4));
  const handleResetZoom = () => setZoom(1);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!definition) {
    return (
      <div className="state-panel" style={{ minHeight: 180, justifyContent: 'center' }}>
        <AlertCircle size={18} />
        <span>{title || 'No architecture diagram available yet.'}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-panel state-panel--error" style={{ minHeight: 180 }}>
        <AlertCircle size={18} />
        <div>
          <strong>Diagram rendering notice</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        padding: isFullscreen ? '40px 20px' : '16px 12px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Zoom and interactive controls toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: 2,
          boxShadow: 'var(--shadow-xs)',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          className="icon-btn"
          style={{ width: 28, height: 28 }}
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          className="icon-btn"
          style={{ width: 28, height: 28 }}
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          type="button"
          className="icon-btn"
          style={{ width: 28, height: 28 }}
          onClick={handleResetZoom}
          title="Reset Zoom (100%)"
        >
          <RotateCcw size={13} />
        </button>
        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', padding: '0 4px', color: 'var(--text-tertiary)' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          className="icon-btn"
          style={{ width: 28, height: 28 }}
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Diagram'}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      <div
        style={{
          overflow: 'auto',
          display: 'grid',
          placeItems: 'center',
          minHeight: isFullscreen ? '80vh' : 240,
          padding: '20px 10px',
        }}
      >
        <div
          ref={ref}
          aria-label={title || 'Architecture diagram'}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease',
            display: 'inline-block',
          }}
        />
      </div>
    </div>
  );
}
