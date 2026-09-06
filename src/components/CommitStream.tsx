import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import mockData from '../data/github-mock.json';
import { siteConfig } from '../site.config';

export default function CommitStream() {
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const username = siteConfig.author.githubUsername;
        if (!username) {
          setCommits(mockData);
          setLoading(false);
          return;
        }
        
        const res = await fetch(`https://api.github.com/users/${username}/events/public?per_page=50`);
        if (!res.ok) throw new Error('Failed to fetch');
        const events = await res.json();
        
        if (!Array.isArray(events)) {
            throw new Error('Not an array');
        }

        const pushEvents = events.filter((e: any) => e.type === 'PushEvent');
        const fetchedCommits = [];
        
        for (const event of pushEvents) {
          const repoName = event.repo.name.split('/')[1] || event.repo.name;
          for (const commit of event.payload.commits || []) {
            fetchedCommits.push({
              sha: commit.sha.substring(0, 7),
              message: commit.message.split('\n')[0],
              date: event.created_at,
              repo: repoName
            });
          }
        }
        
        setCommits(fetchedCommits.length > 0 ? fetchedCommits.slice(0, 5) : mockData);
      } catch (err) {
        console.warn('Falling back to mock data', err);
        setCommits(mockData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommits();
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
