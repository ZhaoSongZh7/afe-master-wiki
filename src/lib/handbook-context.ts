import { getLLMText, source } from '@/lib/source';

const ignoredTerms = new Set([
  'about',
  'after',
  'also',
  'and',
  'are',
  'can',
  'for',
  'from',
  'have',
  'how',
  'the',
  'this',
  'what',
  'when',
  'where',
  'which',
  'with',
  'you',
  'your',
]);

let handbookPages: Promise<string[]> | undefined;

function loadHandbookPages() {
  handbookPages ??= Promise.all(source.getPages().map(getLLMText));
  return handbookPages;
}

export async function findHandbookContext(query: string) {
  const terms = [...new Set(query.toLowerCase().match(/[a-z0-9]+/g) ?? [])]
    .filter((term) => term.length > 2 && !ignoredTerms.has(term));

  if (terms.length === 0) return '';

  const pages = await loadHandbookPages();
  return pages
    .map((text) => ({
      text,
      score: terms.reduce(
        (total, term) => total + (text.toLowerCase().includes(term) ? 1 : 0),
        0,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map(({ text }) => text.slice(0, 8_000))
    .join('\n\n---\n\n');
}
