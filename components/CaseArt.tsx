import { caseSvg, type CaseKind } from '../lib/case-art';

/**
 * Dibuja una funda en SVG. El contenido sale de lib/case-art.ts (código propio,
 * sin datos del usuario), por eso es seguro inyectarlo como HTML.
 */
export default function CaseArt({
  kind,
  seed = 0,
  className = '',
}: {
  kind: CaseKind;
  seed?: number;
  className?: string;
}) {
  return <div aria-hidden="true" className={className} dangerouslySetInnerHTML={{ __html: caseSvg(kind, seed) }} />;
}
