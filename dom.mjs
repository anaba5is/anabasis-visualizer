export function html(tag, className = '', content = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = content;
  return node;
}

export function link(text, href, className = '') {
  const anchor = html('a', className, text);
  anchor.href = href;
  return anchor;
}
