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

export default {
  escapeHtml,
  renderMarkdownToHtml,
}
