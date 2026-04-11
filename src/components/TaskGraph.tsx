import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { SubTask } from '@/store/agentStore';

interface TaskGraphProps {
  subtasks: SubTask[];
}

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  status: SubTask['status'];
  index_num: number;
  priority: number;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
}

const STATUS_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
  pending: { fill: 'transparent', stroke: '#4b5563', glow: 'none' },
  running: { fill: 'rgba(139, 92, 246, 0.3)', stroke: '#8b5cf6', glow: '0 0 16px rgba(139, 92, 246, 0.5)' },
  completed: { fill: 'rgba(34, 197, 94, 0.4)', stroke: '#22c55e', glow: '0 0 12px rgba(34, 197, 94, 0.4)' },
  failed: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444', glow: '0 0 12px rgba(239, 68, 68, 0.4)' },
  adapting: { fill: 'rgba(245, 158, 11, 0.3)', stroke: '#f59e0b', glow: '0 0 12px rgba(245, 158, 11, 0.4)' },
};

export function TaskGraph({ subtasks }: TaskGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null);

  const renderGraph = useCallback(() => {
    if (!svgRef.current || subtasks.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    filter.append('feMerge').selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter().append('feMergeNode')
      .attr('in', (d) => d);

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 38)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#4b5563');

    const nodes: NodeDatum[] = subtasks.map((t, i) => ({
      id: t.id,
      title: t.title.length > 14 ? t.title.slice(0, 12) + '…' : t.title,
      status: t.status,
      index_num: i,
      priority: Math.max(1, 3 - i * 0.3),
    }));

    // Create sequential dependency edges
    const links: LinkDatum[] = [];
    for (let i = 1; i < nodes.length; i++) {
      links.push({ source: nodes[i - 1].id, target: nodes[i].id });
    }

    const simulation = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id(d => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(55));

    simRef.current = simulation;

    const g = svg.append('g');

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#374151')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('marker-end', 'url(#arrowhead)');

    // Node groups
    const node = g.append('g')
      .selectAll<SVGGElement, NodeDatum>('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', (d) => d.status === 'running' ? 'node-pulse' : '')
      .call(d3.drag<SVGGElement, NodeDatum>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles — bigger radius
    node.append('circle')
      .attr('r', (d) => 28 + d.priority * 3)
      .attr('fill', (d) => STATUS_COLORS[d.status]?.fill || 'transparent')
      .attr('stroke', (d) => STATUS_COLORS[d.status]?.stroke || '#4b5563')
      .attr('stroke-width', 2)
      .attr('filter', (d) => d.status === 'completed' || d.status === 'running' ? 'url(#glow)' : 'none')
      .style('box-shadow', (d) => STATUS_COLORS[d.status]?.glow || 'none');

    // Task index
    node.append('text')
      .text((d) => `T${d.index_num + 1}`)
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '13px')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--font-mono)');

    // Title (below index) — smaller font, clipped
    node.append('text')
      .text((d) => d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('fill', '#9ca3af')
      .attr('font-size', '8px')
      .attr('font-family', 'var(--font-sans)');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom);
  }, [subtasks]);

  useEffect(() => {
    renderGraph();
    return () => { simRef.current?.stop(); };
  }, [renderGraph]);

  useEffect(() => {
    const handleResize = () => renderGraph();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderGraph]);

  if (subtasks.length === 0) return null;

  const completed = subtasks.filter(t => t.status === 'completed').length;
  const progress = (completed / subtasks.length) * 100;

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Task Graph
          <span className="text-muted-foreground font-normal ml-2">{completed}/{subtasks.length}</span>
        </h3>
        <span className="text-xs font-mono text-primary font-semibold">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, hsl(162 72% 46%), hsl(180 70% 40%))' }}
        />
      </div>
      <div className="border border-border rounded-lg bg-card/40 overflow-hidden" style={{ height: '320px' }}>
        <svg ref={svgRef} width="100%" height="100%" />
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        {[
          { label: 'Pending', color: '#4b5563' },
          { label: 'Running', color: '#8b5cf6' },
          { label: 'Complete', color: '#22c55e' },
          { label: 'Failed', color: '#ef4444' },
          { label: 'Adapting', color: '#f59e0b' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
