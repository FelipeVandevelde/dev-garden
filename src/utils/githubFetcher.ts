import mockData from '../data/github-mock.json';
import { siteConfig } from '../site.config';

export type Commit = {
  sha: string;
  message: string;
  date: string;
  repo: string;
};

export async function fetchRecentCommits(): Promise<Commit[]> {
  const username = siteConfig.author.githubUsername;
  if (!username) return mockData;

  try {
    const headers: HeadersInit = {
      'User-Agent': 'Astro-Build-Pipeline',
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (import.meta.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${import.meta.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/users/${username}/events/public`, {
      headers,
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) {
      console.warn(`[GitHub Fetcher] API responded with ${res.status}. Falling back to mock data.`);
      return mockData;
    }

    const events = await res.json();
    const pushEvents = events.filter((e: any) => e.type === 'PushEvent');
    
    const commits: Commit[] = [];
    for (const event of pushEvents) {
      const repoName = event.repo.name.split('/')[1] || event.repo.name;
      for (const commit of event.payload.commits || []) {
        commits.push({
          sha: commit.sha.substring(0, 7),
          message: commit.message.split('\n')[0],
          date: event.created_at,
          repo: repoName
        });
      }
    }
    
    if (commits.length === 0) return mockData;
    return commits.slice(0, 5);
  } catch (err) {
    console.warn('[GitHub Fetcher] Network or timeout error. Falling back to mock data.');
    return mockData;
  }
}