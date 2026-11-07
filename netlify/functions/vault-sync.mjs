const DEFAULT_VAULT_REPO = 'FelipeVandevelde/vault-obsidian';

let lastTriggeredSha = null;
let lastTriggerTimeMs = 0;
const REBUILD_COOLDOWN_MS = 3 * 60_000;

export default async function handler() {
  const pat = (process.env.GH_PAT || '').trim();
  const deployHookUrl = (process.env.DEPLOY_HOOK_URL || '').trim();
  const repo = (process.env.VAULT_REPO || DEFAULT_VAULT_REPO).trim();
  const siteUrl = (process.env.URL || '').replace(/\/+$/, '');

  if (!pat || !deployHookUrl) {
    console.log('[vault-sync] Skipping scheduled check: GH_PAT and DEPLOY_HOOK_URL must be configured in server environment variables.');
    return new Response(JSON.stringify({ ok: false, skipped: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const headRes = await fetch(`https://api.github.com/repos/${repo}/commits/HEAD`, {
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Accept': 'application/vnd.github.sha',
      'Cache-Control': 'no-cache',
      'User-Agent': 'DevGarden-Netlify-Vault-Sync'
    }
  });

  if (!headRes.ok) {
    console.warn(`[vault-sync] Failed to fetch remote vault HEAD: ${headRes.status}`);
    return new Response(JSON.stringify({ ok: false, status: headRes.status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const remoteSha = (await headRes.text()).trim();
  if (!remoteSha) {
    return new Response(JSON.stringify({ ok: false, reason: 'empty-sha' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let deployedSha = null;
  if (siteUrl) {
    try {
      const metaRes = await fetch(`${siteUrl}/vault-sync.json?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        deployedSha = typeof meta?.commitSha === 'string' ? meta.commitSha.trim() : null;
      }
    } catch {
      // Ignore metadata fetch failure and fall back to cooldown guard
    }
  }

  if (deployedSha && deployedSha === remoteSha) {
    lastTriggeredSha = remoteSha;
    return new Response(JSON.stringify({ ok: true, synced: false, commitSha: remoteSha }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = Date.now();
  if (lastTriggeredSha === remoteSha && now - lastTriggerTimeMs < REBUILD_COOLDOWN_MS) {
    return new Response(JSON.stringify({ ok: true, synced: false, pendingCommitSha: remoteSha }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const hookRes = await fetch(deployHookUrl, { method: 'POST' });
  if (!hookRes.ok) {
    console.warn(`[vault-sync] DEPLOY_HOOK_URL returned status ${hookRes.status}`);
    return new Response(JSON.stringify({ ok: false, hookStatus: hookRes.status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  lastTriggeredSha = remoteSha;
  lastTriggerTimeMs = now;
  console.log(`[vault-sync] Triggered deploy for new vault commit ${remoteSha.slice(0, 7)} (previous: ${deployedSha ? deployedSha.slice(0, 7) : 'unknown'}).`);

  return new Response(JSON.stringify({ ok: true, synced: true, commitSha: remoteSha }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const config = {
  schedule: '* * * * *'
};
