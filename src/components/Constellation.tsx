/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';
import { nodes, links } from '../data/skills';
import '../styles/tokens.css'; // Just in case, though it's global

export default function Constellation() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNodeClick = (id: string) => {
    setActiveNode(prev => prev === id ? null : id);
  };

  const handleKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNodeClick(id);
    }
  };

  // SVG viewBox for simple 100x100 grid mapping
  return (
    <div className="constellation-wrapper" style={{ width: '100%', maxWidth: '600px', margin: '2rem auto', position: 'relative' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {/* Draw Links */}
        {links.map(link => {
          const sourceNode = nodes.find(n => n.id === link.source);
          const targetNode = nodes.find(n => n.id === link.target);
          if (!sourceNode || !targetNode) return null;

          const isHighlighted = activeNode && (activeNode === link.source || activeNode === link.target);
          const isDimmed = activeNode && !isHighlighted;
          
          return (
            <line
              key={`${link.source}-${link.target}`}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="var(--text-color)"
              strokeWidth={isHighlighted ? 0.8 : 0.2}
              opacity={isDimmed ? 0.25 : 1}
              style={{ transition: 'all 0.3s ease' }}
              className="constellation-link"
            />
          );
        })}

        {/* Draw Nodes */}
        {nodes.map(node => {
          const isActive = activeNode === node.id;
          const isConnected = activeNode && links.some(l => 
            (l.source === activeNode && l.target === node.id) || 
            (l.target === activeNode && l.source === node.id)
          );
          const isDimmed = activeNode && !isActive && !isConnected;

          return (
            <g 
              key={node.id} 
              transform={`translate(${node.x}, ${node.y})`}
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              opacity={isDimmed ? 0.25 : 1}
              onClick={() => handleNodeClick(node.id)}
              onKeyDown={(e) => handleKeyDown(e as any, node.id)}
              tabIndex={0}
              role="button"
              aria-pressed={isActive}
              aria-label={node.label}
              className="constellation-node"
            >
              <circle
                r={3}
                fill={isActive ? 'var(--text-color)' : 'var(--bg-color)'}
                stroke="var(--text-color)"
                strokeWidth={0.5}
              />
              <text
                x={0}
                y={6}
                fontSize={3}
                fill={isActive ? 'var(--text-color)' : 'var(--text-color)'}
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}