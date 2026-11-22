import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchRecentCommits, toActivityCommits, MOCK_COMMITS } from '../src/utils/githubFetcher';

const item = (sha: string, repo: string, message: string, date = '2026-11-20T10:00:00Z') => ({
  sha,
  commit: { message, author: { date } },
  repository: { name: repo },
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('toActivityCommits', () => {
  it('shortens SHAs, keeps the first message line, and skips duplicate SHAs', () => {
    const rows = toActivityCommits([
      item('aaaaaaaaaaaa1111', 'portfolio', 'feat: one\n\nbody text'),
      item('aaaaaaaaaaaa1111', 'template', 'feat: one'),
      item('bbbbbbbbbbbb2222', 'template', 'fix: two'),
    ]);

    expect(rows).toEqual([
      { sha: 'aaaaaaa', message: 'feat: one', date: '2026-11-20T10:00:00Z', repo: 'portfolio' },
      { sha: 'bbbbbbb', message: 'fix: two', date: '2026-11-20T10:00:00Z', repo: 'template' },
    ]);
  });

  it('stops at the limit', () => {
    const items = ['1', '2', '3', '4'].map((n) => item(n.repeat(10), 'repo', `commit ${n}`));
    expect(toActivityCommits(items, 2)).toHaveLength(2);
  });
});

describe('fetchRecentCommits', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns mock commits without calling GitHub when no username is set', async () => {
    const fetchImpl = vi.fn();
    expect(await fetchRecentCommits(undefined, { fetchImpl })).toBe(MOCK_COMMITS);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('searches non-merge commits by author, newest first', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({ items: [item('cccccccccccc3333', 'dev-garden', 'docs: three')] })
    );

    const rows = await fetchRecentCommits('someone', { fetchImpl });

    const url = new URL(String(fetchImpl.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://api.github.com/search/commits');
    expect(url.searchParams.get('q')).toBe('author:someone merge:false');
    expect(url.searchParams.get('sort')).toBe('author-date');
    expect(url.searchParams.get('order')).toBe('desc');
    expect(rows).toEqual([{ sha: 'ccccccc', message: 'docs: three', date: '2026-11-20T10:00:00Z', repo: 'dev-garden' }]);
  });

  it('falls back to mock commits when rate limited', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn(async () => jsonResponse({ message: 'API rate limit exceeded' }, 403));
    expect(await fetchRecentCommits('someone', { fetchImpl })).toBe(MOCK_COMMITS);
  });

  it('falls back to mock commits when the search finds nothing', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ total_count: 0, items: [] }));
    expect(await fetchRecentCommits('someone', { fetchImpl })).toBe(MOCK_COMMITS);
  });

  it('falls back to mock commits on a network error', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(await fetchRecentCommits('someone', { fetchImpl })).toBe(MOCK_COMMITS);
  });
});
