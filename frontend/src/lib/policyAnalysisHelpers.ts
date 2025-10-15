// Helper utilities used by PolicyAnalysis view
export const escapeHtml = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const renderMarkdownToHtml = (md: string) => {
  if (!md) return ''
  let html = escapeHtml(md)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
  // italics: *text* or _text_
  html = html.replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/gim, '$1<em>$2</em>')
  html = html.replace(/(^|[^_])_(?!_)(.*?)_(?!_)/gim, '$1<em>$2</em>')
  // inline code `code`
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>')
  // links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  // fenced code blocks ```
  html = html.replace(/```([\s\S]*?)```/gim, (_all, code) => `<pre class="rounded bg-gray-100 p-3 overflow-auto"><code>${escapeHtml(code)}</code></pre>`)
  // Convert simple markdown lists into <li> wrappers and then group into <ul>
  html = html.replace(/(^|\n)- (.*?)(?=\n|$)/gim, '$1<li>$2</li>')
  html = html.replace(/(?:<li>.*?<\/li>\s*)+/gms, (m) => `<ul>${m}</ul>`)
  html = html.replace(/\n/g, '<br/>')
  return html
}

// Helper: capture a DOM node and inline computed styles (lightweight)
export function inlineComputedStylesForExport(root: HTMLElement | null): string {
  if (!root) return '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'
  const clone = root.cloneNode(true) as HTMLElement
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT, null)
  const nodes: Element[] = []
  let cur = walker.nextNode() as Element | null
  while (cur) {
    nodes.push(cur)
    cur = walker.nextNode() as Element | null
  }
  nodes.forEach((el) => {
    try {
      const comp = window.getComputedStyle(el)
      const props = [
        'display','position','width','height','margin','padding','border','boxSizing',
        'fontSize','fontFamily','fontWeight','lineHeight','color','backgroundColor',
        'textAlign','verticalAlign','listStyleType','whiteSpace','overflow','wordBreak'
      ]
      const pairs: string[] = []
      props.forEach((p) => {
        // convert camelCase prop name to kebab-case CSS name
        const cssName = p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
        // try typed access first, then fallback to getPropertyValue
        const v = ((comp as unknown as Record<string, string | null>)[p as string]) || comp.getPropertyValue(cssName)
        if (v) pairs.push(`${cssName}:${v}`)
      })
      if (pairs.length) el.setAttribute('style', pairs.join('; '))
    } catch {
      // ignore
    }
  })
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${clone.outerHTML}</body></html>`
}

// ADD: at bottom, next to inlineComputedStylesForExport exports
export function htmlNodeToHtmlAndCss(
  root: HTMLElement | null,
  opts?: { title?: string; includeGlobalCss?: boolean; inlineComputed?: boolean }
): { htmlDocument: string; cssText: string } {
  const title = (opts?.title ?? document.title ?? 'Report').replace(/[<>]/g, '');
  if (!root) {
    const empty = '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';
    return { htmlDocument: empty, cssText: '' };
  }

  // clone node so we don’t mutate live DOM
  const clone = root.cloneNode(true) as HTMLElement;

  // optionally inline computed styles to preserve exact look
  if (opts?.inlineComputed !== false) {
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT, null);
    const nodes: Element[] = [];
    let cur = walker.nextNode() as Element | null;
    while (cur) { nodes.push(cur); cur = walker.nextNode() as Element | null; }
    nodes.forEach((el) => {
      try {
        const comp = window.getComputedStyle(el as HTMLElement);
        const props = [
          'display','position','width','height','margin','padding','border','boxSizing',
          'fontSize','fontFamily','fontWeight','lineHeight','color','backgroundColor',
          'textAlign','verticalAlign','listStyleType','whiteSpace','overflow','wordBreak',
          'gap','justifyContent','alignItems','flex','flexDirection','gridTemplateColumns','gridTemplateRows'
        ];
        const pairs: string[] = [];
        props.forEach((p) => {
          const cssName = p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
          const v = (comp as unknown as Record<string,string|undefined>)[p] || comp.getPropertyValue(cssName);
          if (v) pairs.push(`${cssName}:${v}`);
        });
        if (pairs.length) (el as HTMLElement).setAttribute('style', pairs.join(';'));
      } catch {
        // ignore errors (e.g. getComputedStyle on some elements or cross-origin issues)
      }
    });
  }

  // Collect same-origin CSS (best-effort; cross-origin is blocked by the browser)
  let cssText = '';
  if (opts?.includeGlobalCss !== false) {
    try {
      // <style> tags
      document.querySelectorAll('style').forEach((s) => { cssText += (s.textContent || '') + '\n'; });
      // same-origin stylesheets
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          const rules = (sheet as CSSStyleSheet).cssRules;
          if (!rules) return;
          for (let i = 0; i < rules.length; i++) cssText += rules[i].cssText + '\n';
        } catch { /* cross-origin — ignore */ }
      });
    } catch { /* ignore */ }
  }

  const baseHref = (() => {
    try { return (document.baseURI || window.location.origin || '/'); } catch { return '/'; }
  })();

  const htmlDocument =
    '<!doctype html>' +
    `<html><head><meta charset="utf-8">` +
    `<base href="${baseHref}">` +
    `<title>${title}</title>` +
    (cssText ? `<style>${cssText}</style>` : '') +
    `</head><body>${clone.outerHTML}</body></html>`;

  return { htmlDocument, cssText };
}


export default {
  escapeHtml,
  renderMarkdownToHtml,
  inlineComputedStylesForExport,
  htmlNodeToHtmlAndCss,
}
