export const escapeHtml = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const renderMarkdownToHtml = (md: string) => {
  if (!md) return ''
  let html = escapeHtml(md)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
  html = html.replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/gim, '$1<em>$2</em>')
  html = html.replace(/(^|[^_])_(?!_)(.*?)_(?!_)/gim, '$1<em>$2</em>')
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
  html = html.replace(/```([\s\S]*?)```/gim, (_all, code) => `<pre><code>${escapeHtml(code)}</code></pre>`)
  html = html.replace(/(^|\n)- (.*?)(?=\n|$)/gim, '$1<li>$2</li>')
  html = html.replace(/(?:<li>.*?<\/li>\s*)+/gms, (m) => `<ul>${m}</ul>`)
  html = html.replace(/\n/g, '<br/>')
  return html
}

export default { escapeHtml, renderMarkdownToHtml }
