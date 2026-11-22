import { useEffect, useState } from 'preact/hooks';
import { siteConfig } from '../site.config';
import { fetchRecentCommits, type Commit } from '../utils/githubFetcher';

export default function CommitStream() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetchRecentCommits never rejects; it falls back to mock data on any failure
    fetchRecentCommits(siteConfig.author.githubUsername)
      .then(setCommits)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div class="activity-list"><p>Loading activity...</p></div>;
  }

  return (
    <div class="activity-list">
      {commits.map(commit => (
        <div class="activity-item" key={commit.sha}>
          <span><span class="commit-hash">{commit.sha}</span> &mdash; [{commit.repo}] {commit.message}</span>
          <span style={{ color: 'var(--text-muted)' }}>{new Date(commit.date).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
