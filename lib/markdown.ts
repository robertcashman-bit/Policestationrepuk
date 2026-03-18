/**
 * Lightweight markdown-to-HTML converter.
 * Handles headings, bold, italic, links, lists, blockquotes, tables,
 * code blocks, inline code, horizontal rules, and footnotes.
 */
export function markdownToHtml(md: string): string {
  let html = md;

  // Fenced code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const escaped = escapeHtml(code.trimEnd());
    const cls = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${cls}>${escaped}</code></pre>`;
  });

  // Split into lines for block-level processing
  const lines = html.split('\n');
  const out: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let inBlockquote = false;
  let inTable = false;
  let tableHeaderDone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip lines inside <pre> blocks (already handled)
    if (line.startsWith('<pre>') || line.includes('<pre>')) {
      // Pass through pre blocks intact
      out.push(line);
      if (!line.includes('</pre>')) {
        while (i + 1 < lines.length && !lines[i + 1].includes('</pre>')) {
          i++;
          out.push(lines[i]);
        }
        if (i + 1 < lines.length) {
          i++;
          out.push(lines[i]);
        }
      }
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
      closeList();
      closeBlockquote();
      closeTable();
      out.push('<hr />');
      continue;
    }

    // Table rows
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      closeList();
      closeBlockquote();
      const cells = line.trim().slice(1, -1).split('|').map((c) => c.trim());

      // Check if next line is separator (|---|---|)
      if (!inTable) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && /^\|[\s:|-]+\|$/.test(nextLine)) {
          inTable = true;
          tableHeaderDone = false;
          out.push('<table>');
          out.push('<thead><tr>');
          for (const cell of cells) {
            out.push(`<th>${inlineFormat(cell)}</th>`);
          }
          out.push('</tr></thead>');
          out.push('<tbody>');
          tableHeaderDone = true;
          i++; // skip separator line
          continue;
        }
        // No header separator — treat as body-only table
        inTable = true;
        tableHeaderDone = true;
        out.push('<table><tbody>');
      }

      // Skip separator rows
      if (/^[\s:|-]+$/.test(cells.join(''))) continue;

      out.push('<tr>');
      for (const cell of cells) {
        out.push(`<td>${inlineFormat(cell)}</td>`);
      }
      out.push('</tr>');
      continue;
    } else {
      closeTable();
    }

    // Blockquote
    if (line.startsWith('> ')) {
      closeList();
      if (!inBlockquote) {
        inBlockquote = true;
        out.push('<blockquote>');
      }
      out.push(`<p>${inlineFormat(line.slice(2))}</p>`);
      continue;
    } else {
      closeBlockquote();
    }

    // Unordered list
    if (/^[-*+] /.test(line.trim())) {
      closeBlockquote();
      if (inList !== 'ul') {
        closeList();
        inList = 'ul';
        out.push('<ul>');
      }
      out.push(`<li>${inlineFormat(line.trim().replace(/^[-*+] /, ''))}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      closeBlockquote();
      if (inList !== 'ol') {
        closeList();
        inList = 'ol';
        out.push('<ol>');
      }
      out.push(`<li>${inlineFormat(line.trim().replace(/^\d+\.\s/, ''))}</li>`);
      continue;
    }

    closeList();

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      out.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      out.push('');
      continue;
    }

    // Paragraph
    out.push(`<p>${inlineFormat(line)}</p>`);
  }

  closeList();
  closeBlockquote();
  closeTable();

  return out.join('\n');

  function closeList() {
    if (inList) {
      out.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }
  }
  function closeBlockquote() {
    if (inBlockquote) {
      out.push('</blockquote>');
      inBlockquote = false;
    }
  }
  function closeTable() {
    if (inTable) {
      if (tableHeaderDone) out.push('</tbody>');
      out.push('</table>');
      inTable = false;
      tableHeaderDone = false;
    }
  }
}

function inlineFormat(text: string): string {
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold + italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Footnote references [^1]
  text = text.replace(/\[\^(\d+)\]/g, '<sup><a href="#fn-$1" id="fnref-$1">$1</a></sup>');
  return text;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
