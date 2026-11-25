export interface BstNode {
  info: number;
  izq: BstNode | null;
  der: BstNode | null;
}

export interface DijkstraStep {
  iter: number;
  fixedNode: number;
  fixedCost: number;
  costs: number[];
  relaxed: number[];
}

export interface BstSvgOptions {
  label: string;
  removedVal?: number | null;
  replacementVal?: number | null;
  promotedVal?: number | null;
}

interface PositionedBstNode {
  info: number;
  x: number;
  y: number;
  depth: number;
  leftIndex: number | null;
  rightIndex: number | null;
}

/** Escapes HTML special characters before interpolating strings into HTML markup. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return ch;
    }
  });
}

function countBstNodes(node: BstNode | null): number {
  if (!node) return 0;
  return 1 + countBstNodes(node.izq) + countBstNodes(node.der);
}

/** Renders a collision-free in-order SVG visualization of a binary search tree. */
export function renderBstSvg(rootNode: BstNode | null, options: BstSvgOptions): string {
  const safeLabel = escapeHtml(options.label);
  if (!rootNode) {
    return `<figure class="estudia-bst-figure"><figcaption>${safeLabel}</figcaption><div class="estudia-bst-empty">Árbol vacío (NULL)</div></figure>`;
  }

  const totalNodes = countBstNodes(rootNode);
  if (totalNodes > 31) {
    return `<figure class="estudia-bst-figure"><figcaption>${safeLabel}</figcaption><div class="estudia-bst-empty">Visualización SVG disponible hasta 31 nodos; recorridos y métricas calculados completos.</div></figure>`;
  }

  const padX = 28;
  const stepX = 44;
  const padY = 26;
  const stepY = 52;

  const nodes: PositionedBstNode[] = [];
  let colIndex = 0;
  let maxDepth = 0;

  function layout(node: BstNode | null, depth: number): number | null {
    if (!node) return null;
    const leftIdx = layout(node.izq, depth + 1);
    const currentIdx = nodes.length;
    const col = colIndex++;
    if (depth > maxDepth) maxDepth = depth;
    nodes.push({
      info: node.info,
      x: padX + col * stepX,
      y: padY + depth * stepY,
      depth,
      leftIndex: leftIdx,
      rightIndex: null
    });
    const rightIdx = layout(node.der, depth + 1);
    nodes[currentIdx].rightIndex = rightIdx;
    return currentIdx;
  }

  layout(rootNode, 0);

  const width = Math.max(220, padX * 2 + Math.max(0, totalNodes - 1) * stepX);
  const height = Math.max(92, padY * 2 + maxDepth * stepY);

  const edgesSvg: string[] = [];
  for (const node of nodes) {
    if (node.leftIndex !== null) {
      const child = nodes[node.leftIndex];
      edgesSvg.push(
        `<line x1="${node.x}" y1="${node.y}" x2="${child.x}" y2="${child.y}" stroke="#334155" stroke-width="1.6" />`
      );
    }
    if (node.rightIndex !== null) {
      const child = nodes[node.rightIndex];
      edgesSvg.push(
        `<line x1="${node.x}" y1="${node.y}" x2="${child.x}" y2="${child.y}" stroke="#334155" stroke-width="1.6" />`
      );
    }
  }

  const nodesSvg = nodes
    .map((node) => {
      const isRemoved = options.removedVal !== null && options.removedVal !== undefined && node.info === options.removedVal;
      const isReplacement =
        options.replacementVal !== null && options.replacementVal !== undefined && node.info === options.replacementVal;
      const isPromoted = options.promotedVal !== null && options.promotedVal !== undefined && node.info === options.promotedVal;

      let stroke = '#00D2FF';
      let fill = '#0F1420';
      let textFill = '#EBF1F5';

      if (isRemoved) {
        stroke = '#F87171';
        fill = 'rgba(248, 113, 113, 0.22)';
      } else if (isReplacement) {
        stroke = '#F59E0B';
        fill = 'rgba(245, 158, 11, 0.22)';
      } else if (isPromoted) {
        stroke = '#34D399';
        fill = 'rgba(52, 211, 153, 0.22)';
      }

      const rootRing =
        node.depth === 0 && !isRemoved && !isReplacement && !isPromoted
          ? `<circle cx="${node.x}" cy="${node.y}" r="18" fill="none" stroke="#818CF8" stroke-width="1.2" stroke-dasharray="3 2" />`
          : '';

      return `${rootRing}<circle cx="${node.x}" cy="${node.y}" r="15" fill="${fill}" stroke="${stroke}" stroke-width="1.75" /><text x="${node.x}" y="${node.y}" text-anchor="middle" dominant-baseline="central" fill="${textFill}" font-family="'Fira Code', monospace" font-size="11" font-weight="600">${node.info}</text>`;
    })
    .join('');

  const showLegend =
    (options.removedVal !== null && options.removedVal !== undefined) ||
    (options.promotedVal !== null && options.promotedVal !== undefined);

  const legendHtml = showLegend
    ? `<div class="estudia-bst-legend">${
        options.removedVal !== null && options.removedVal !== undefined
          ? '<span><i class="legend-dot legend-removed"></i>Eliminado</span>'
          : ''
      }${
        options.replacementVal !== null && options.replacementVal !== undefined
          ? '<span><i class="legend-dot legend-replacement"></i>Reemplazo F3/F4</span>'
          : ''
      }${
        options.promotedVal !== null && options.promotedVal !== undefined
          ? '<span><i class="legend-dot legend-promoted"></i>Promovido</span>'
          : ''
      }</div>`
    : '';

  return `<figure class="estudia-bst-figure"><figcaption>${safeLabel}</figcaption><div class="estudia-svg-scroll"><svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${safeLabel}">${edgesSvg.join('')}${nodesSvg}</svg></div>${legendHtml}</figure>`;
}

/** Renders a collapsible LCS dynamic programming matrix with highlighted reconstruction path. */
export function renderLcsDpTable(
  xStr: string,
  yStr: string,
  dp: readonly (readonly number[])[],
  pathCells: ReadonlySet<string>,
  matchCells: ReadonlySet<string>
): string {
  const m = xStr.length;
  const n = yStr.length;
  if (m > 18 || n > 18) {
    return '<p class="desc" style="margin-top:0.55rem;margin-bottom:0;">Matriz DP completa disponible hasta 18x18 caracteres.</p>';
  }

  const headCols = [
    '<th scope="col">DP</th>',
    '<th scope="col">∅</th>',
    ...Array.from(yStr, (ch) => `<th scope="col">${escapeHtml(ch)}</th>`)
  ].join('');

  const rowsHtml: string[] = [];
  for (let i = 0; i <= m; i++) {
    const rowHeader = i === 0 ? '∅' : escapeHtml(xStr[i - 1]);
    const cells: string[] = [`<th scope="row">${rowHeader}</th>`];
    for (let j = 0; j <= n; j++) {
      const key = `${i},${j}`;
      const isMatch = matchCells.has(key);
      const isPath = pathCells.has(key);
      const cls = isMatch ? ' class="dp-cell-match"' : isPath ? ' class="dp-cell-path"' : '';
      const prefix = isMatch ? '↖ ' : '';
      cells.push(`<td${cls}>${prefix}${dp[i][j]}</td>`);
    }
    rowsHtml.push(`<tr>${cells.join('')}</tr>`);
  }

  const openAttr = m <= 12 && n <= 12 ? ' open' : '';
  return `<details class="estudia-details"${openAttr}><summary>Matriz DP completa (${m + 1}x${n + 1}) y ruta de reconstrucción</summary><div class="estudia-table-scroll"><table class="dense-table dp-matrix-table"><thead><tr>${headCols}</tr></thead><tbody>${rowsHtml.join('')}</tbody></table></div></details>`;
}

/** Renders a collapsible step-by-step Dijkstra relaxation trace table. */
export function renderDijkstraTrace(
  steps: readonly DijkstraStep[],
  nodeCount: number,
  startNode: number,
  inf: number
): string {
  if (steps.length === 0) return '';

  const nodeCols = Array.from({ length: nodeCount }, (_, idx) => `<th scope="col">d[${idx}]</th>`).join('');
  const headerHtml = `<tr><th scope="col">Paso</th><th scope="col">Fija u</th>${nodeCols}<th scope="col">Relajados</th></tr>`;

  const bodyHtml = steps
    .map((step) => {
      const relaxedSet = new Set(step.relaxed);
      const costCells = step.costs
        .map((cost, idx) => {
          const formatted = cost >= inf ? '∞' : String(cost);
          const classes: string[] = [];
          if (idx === step.fixedNode) classes.push('trace-fixed');
          if (relaxedSet.has(idx)) classes.push('trace-relaxed');
          const clsAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
          return `<td${clsAttr}>${formatted}</td>`;
        })
        .join('');
      const relaxedText = step.relaxed.length > 0 ? step.relaxed.join(', ') : '-';
      const fixedCostText = step.fixedCost >= inf ? '∞' : String(step.fixedCost);
      return `<tr><td>${step.iter}</td><td><strong>${step.fixedNode}</strong> (${fixedCostText})</td>${costCells}<td><code>${relaxedText}</code></td></tr>`;
    })
    .join('');

  return `<details class="estudia-details"><summary>Traza de relajación Dijkstra (${steps.length} pasos desde nodo ${startNode})</summary><div class="estudia-table-scroll"><table class="dense-table trace-matrix-table"><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table></div></details>`;
}
