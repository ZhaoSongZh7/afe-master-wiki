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

export type ConsultedPage = {
  title: string;
  url: string;
};

type HandbookPage = ConsultedPage & {
  text: string;
};

export type HandbookContext = {
  text: string;
  pages: ConsultedPage[];
};

let handbookPages: Promise<HandbookPage[]> | undefined;

function loadHandbookPages() {
  handbookPages ??= Promise.all(
    source.getPages().map(async (page) => ({
      title: page.data.title,
      url: page.url,
      text: await getLLMText(page),
    })),
  );
  return handbookPages;
}

function getWeightedTerms(queries: string[]) {
  const weightedTerms = new Map<string, number>();

  queries.forEach((query, index) => {
    const weight = index + 1;
    for (const term of query.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
      if (term.length > 2 && !ignoredTerms.has(term)) {
        weightedTerms.set(term, Math.max(weightedTerms.get(term) ?? 0, weight));
      }
    }
  });

  return weightedTerms;
}

export async function findHandbookContext(queries: string[]): Promise<HandbookContext> {
  const recentQueries = queries.slice(-3);
  const weightedTerms = getWeightedTerms(recentQueries);

  if (weightedTerms.size === 0) return { text: '', pages: [] };

  const pages = await loadHandbookPages();
  const matches = pages
    .map((page) => {
      const title = page.title.toLowerCase();
      const text = page.text.toLowerCase();
      const score = [...weightedTerms].reduce(
        (total, [term, weight]) =>
          total +
          (title.includes(term) ? 4 * weight : 0) +
          (text.includes(term) ? weight : 0),
        0,
      );

      return { ...page, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return {
    text: matches.map(({ text }) => text.slice(0, 8_000)).join('\n\n---\n\n'),
    pages: matches.map(({ title, url }) => ({ title, url })),
  };
}
