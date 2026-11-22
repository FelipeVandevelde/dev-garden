import mockData from '../data/github-mock.json';

export type Commit = {
  sha: string;
  message: string;
  date: string;
  repo: string;
};

type SearchCommitItem = {
  sha?: string;
  commit?: {
    message?: string;
    author?: { date?: string } | null;
    committer?: { date?: string } | null;
  };
  repository?: { name?: string } | null;
};

export const MOCK_COMMITS: Commit[] = mockData;

/**
 * Turns GitHub commit-search results into activity rows: short SHA, first line of the
 * message, and each SHA only once (the same commit can live in several repos, e.g. forks).
 */
export function toActivityCommits(items: SearchCommitItem[], limit = 5): Commit[] {
  const seen = new Set<string>();
  const commits: Commit[] = [];

  for (const item of items) {
    if (!item?.sha || seen.has(item.sha)) continue;
    seen.add(item.sha);
    commits.push({
      sha: item.sha.substring(0, 7),
      message: (item.commit?.message ?? '').split('\n')[0],
      date: item.commit?.author?.date ?? item.commit?.committer?.date ?? '',
      repo: item.repository?.name ?? '',
    });
    if (commits.length >= limit) break;
  }

  return commits;
}

/**
 * Latest public, non-merge commits authored by `username`, newest first.
 * Uses GitHub commit search, because the public events API no longer lists the
 * commits inside push events. Works without a token (search allows 10 requests per
 * minute per IP) and only sees public repositories.
 * Falls back to the mock commits when no username is set, on any error, or when
 * nothing is found.
 */
export async function fetchRecentCommits(
  username: string | undefined,
  {
    limit = 5,
    fetchImpl = (input, init) => fetch(input, init),
  }: { limit?: number; fetchImpl?: typeof fetch } = {}
): Promise<Commit[]> {
  if (!username) return MOCK_COMMITS;

  try {
    const query = encodeURIComponent(`author:${username} merge:false`);
    // Ask for extra rows so removing duplicate SHAs still leaves `limit` commits
    const url = `https://api.github.com/search/commits?q=${query}&sort=author-date&order=desc&per_page=${limit * 2}`;
    const res = await fetchImpl(url, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`[GitHub Fetcher] Commit search responded with ${res.status}. Falling back to mock data.`);
      return MOCK_COMMITS;
    }

    const body = await res.json();
    const commits = toActivityCommits(Array.isArray(body?.items) ? body.items : [], limit);
    return commits.length > 0 ? commits : MOCK_COMMITS;
  } catch {
    console.warn('[GitHub Fetcher] Network or timeout error. Falling back to mock data.');
    return MOCK_COMMITS;
  }
}
