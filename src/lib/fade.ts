/**
 * Fondu sur les bords d'une zone qui défile : en haut seulement si on a défilé,
 * en bas seulement s'il reste du contenu caché. Le style est dans app.css (.fade-edges).
 */
export function fadeEdges(node: HTMLElement) {
  const SIZE = '32px';
  const update = () => {
    const top = node.scrollTop > 1;
    const bottom = node.scrollTop + node.clientHeight < node.scrollHeight - 1;
    node.style.setProperty('--fade-top', top ? SIZE : '0px');
    node.style.setProperty('--fade-bottom', bottom ? SIZE : '0px');
  };
  node.classList.add('fade-edges');
  update();
  node.addEventListener('scroll', update, { passive: true });
  const resize = new ResizeObserver(update);
  resize.observe(node);
  const content = new MutationObserver(update);
  content.observe(node, { childList: true, subtree: true });
  return {
    destroy() {
      node.removeEventListener('scroll', update);
      resize.disconnect();
      content.disconnect();
    }
  };
}
