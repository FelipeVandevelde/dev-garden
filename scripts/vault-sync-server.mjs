import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

export const DEFAULT_VAULT_REPO = 'FelipeVandevelde/vault-obsidian';
export const DEFAULT_VAULT_SYNC_INTERVAL_MS = 60_000;

export function resolveVaultSyncConfig(cwd = process.cwd(), envOverrides = process.env) {
  const loaded = loadEnv(envOverrides.NODE_ENV || 'production', cwd, '');
  const getVar = (key) => envOverrides[key] ?? loaded[key] ?? '';

  const rawInterval = Number(getVar('VAULT_SYNC_INTERVAL_MS'));
  const intervalMs = Number.isFinite(rawInterval) && rawInterval > 0
    ? rawInterval
    : DEFAULT_VAULT_SYNC_INTERVAL_MS;

  return {
    cwd,
    pat: getVar('GH_PAT').trim(),
    repo: getVar('VAULT_REPO').trim() || DEFAULT_VAULT_REPO,
    intervalMs,
    deployHookUrl: getVar('DEPLOY_HOOK_URL').trim(),
    shaFilePath: path.resolve(cwd, '.astro', 'vault-head.sha'),
    distDir: path.resolve(cwd, 'dist'),
    stagingDistDir: path.resolve(cwd, '.astro', 'dist-staging'),
    astroBin: path.resolve(cwd, 'node_modules', 'astro', 'astro.js'),
    pagefindBin: path.resolve(cwd, 'node_modules', 'pagefind', 'lib', 'runner', 'bin.cjs')
  };
}

export async function readRecordedVaultSha(config) {
  try {
    if (existsSync(config.shaFilePath)) {
      const raw = (await fs.readFile(config.shaFilePath, 'utf-8')).trim();
      if (raw) return raw;
    }
  } catch {
    // Ignore read errors
  }

  try {
    const syncMetaPath = path.join(config.distDir, 'vault-sync.json');
    if (existsSync(syncMetaPath)) {
      const parsed = JSON.parse(await fs.readFile(syncMetaPath, 'utf-8'));
      if (typeof parsed?.commitSha === 'string' && parsed.commitSha.trim()) {
        return parsed.commitSha.trim();
      }
    }
  } catch {
    // Ignore read errors
  }

  return null;
}

export async function writeRecordedVaultSha(config, sha) {
  if (!sha) return;
  await fs.mkdir(path.dirname(config.shaFilePath), { recursive: true });
  await fs.writeFile(config.shaFilePath, `${sha.trim()}\n`, 'utf-8');
}

/**
 * @param {ReturnType<typeof resolveVaultSyncConfig>} config
 * @param {string} [targetDistDir]
 * @param {string | null} [explicitSha]
 */
export async function stampDistVaultMetadata(config, targetDistDir = config.distDir, explicitSha = null) {
  if (!existsSync(targetDistDir)) return null;
  let commitSha = explicitSha;

  if (!commitSha && config.pat) {
    try {
      const head = await fetchRemoteVaultHead(config, null);
      if (head.sha) {
        commitSha = head.sha;
        await writeRecordedVaultSha(config, commitSha);
      }
    } catch {
      // Ignore network errors during build stamping and fall back to recorded SHA
    }
  }

  if (!commitSha) {
    commitSha = await readRecordedVaultSha(config);
  }

  const payload = {
    repo: config.repo,
    commitSha: commitSha || null,
    syncedAt: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(targetDistDir, 'vault-sync.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf-8'
  );
  return payload;
}

/**
 * @param {ReturnType<typeof resolveVaultSyncConfig>} config
 * @param {string | null} [etag]
 * @param {typeof fetch} [fetchImpl]
 */
export async function fetchRemoteVaultHead(config, etag = null, fetchImpl = fetch) {
  if (!config.pat) {
    throw new Error('GH_PAT is required to check remote vault commits.');
  }

  const headers = {
    'Authorization': `Bearer ${config.pat}`,
    'Accept': 'application/vnd.github.sha',
    'Cache-Control': 'no-cache',
    'User-Agent': 'DevGarden-Vault-Sync'
  };
  if (etag) {
    headers['If-None-Match'] = etag;
  }

  const res = await fetchImpl(`https://api.github.com/repos/${config.repo}/commits/HEAD`, { headers });
  if (res.status === 304) {
    return {
      sha: null,
      etag: res.headers?.get?.('etag') || etag,
      notModified: true
    };
  }
  if (!res.ok) {
    throw new Error(`GitHub API responded with ${res.status} ${res.statusText}`);
  }

  const sha = (await res.text()).trim();
  return {
    sha: sha || null,
    etag: res.headers?.get?.('etag') || etag,
    notModified: false
  };
}

export async function triggerDeployHook(deployHookUrl, fetchImpl = fetch) {
  if (!deployHookUrl) return false;
  const res = await fetchImpl(deployHookUrl, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Deploy hook failed with status ${res.status}`);
  }
  return true;
}

function runNodeCommand(scriptPath, args, cwd, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...extraEnv
      }
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${path.basename(scriptPath)} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function syncDirectoryMirror(srcDir, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const [srcEntries, destEntries] = await Promise.all([
    fs.readdir(srcDir, { withFileTypes: true }),
    fs.readdir(destDir, { withFileTypes: true })
  ]);

  const srcNames = new Set(srcEntries.map((entry) => entry.name));

  for (const entry of srcEntries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await syncDirectoryMirror(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }

  for (const entry of destEntries) {
    if (!srcNames.has(entry.name)) {
      await fs.rm(path.join(destDir, entry.name), { recursive: true, force: true });
    }
  }
}

async function rebuildDistFromRemoteVault(config, targetSha = null) {
  const buildEnv = { USE_REMOTE_VAULT: 'true' };

  try {
    await fs.rm(config.stagingDistDir, { recursive: true, force: true });
    await runNodeCommand(config.astroBin, ['build', '--outDir', config.stagingDistDir], config.cwd, buildEnv);
    await runNodeCommand(config.pagefindBin, ['--site', config.stagingDistDir], config.cwd, buildEnv);
    await stampDistVaultMetadata(config, config.stagingDistDir, targetSha);

    await syncDirectoryMirror(config.stagingDistDir, config.distDir);
    await fs.rm(config.stagingDistDir, { recursive: true, force: true });
  } catch {
    await runNodeCommand(config.astroBin, ['build'], config.cwd, buildEnv);
    await runNodeCommand(config.pagefindBin, ['--site', config.distDir], config.cwd, buildEnv);
    await stampDistVaultMetadata(config, config.distDir, targetSha);
  }

  if (targetSha) {
    await writeRecordedVaultSha(config, targetSha);
  }
}

/**
 * @param {ReturnType<typeof resolveVaultSyncConfig>} config
 * @param {{ lastSha: string | null; lastEtag: string | null }} [state]
 * @param {{ hookOnly?: boolean; rebuildFn?: (cfg: any, sha?: string | null) => Promise<void>; fetchImpl?: typeof fetch }} [options]
 */
export async function checkAndSyncOnce(config, state = { lastSha: null, lastEtag: null }, options = {}) {
  const { hookOnly = false, rebuildFn = rebuildDistFromRemoteVault, fetchImpl = fetch } = options;
  const knownSha = state.lastSha || (await readRecordedVaultSha(config));
  const head = await fetchRemoteVaultHead(config, state.lastEtag, fetchImpl);
  state.lastEtag = head.etag;

  if (head.notModified || !head.sha) {
    return { synced: false, sha: knownSha };
  }

  if (knownSha && head.sha === knownSha) {
    state.lastSha = head.sha;
    return { synced: false, sha: head.sha };
  }

  console.log(`[vault-sync] New vault commit detected (${knownSha ? knownSha.slice(0, 7) : 'initial'} -> ${head.sha.slice(0, 7)}).`);

  if (config.deployHookUrl) {
    await triggerDeployHook(config.deployHookUrl, fetchImpl);
    console.log('[vault-sync] Triggered DEPLOY_HOOK_URL.');
  }

  if (!hookOnly) {
    await rebuildFn(config, head.sha);
    console.log(`[vault-sync] Rebuilt static site for vault commit ${head.sha.slice(0, 7)}.`);
  } else {
    await writeRecordedVaultSha(config, head.sha);
  }

  state.lastSha = head.sha;
  return { synced: true, sha: head.sha };
}

async function runServer(config, previewArgs = []) {
  if (!existsSync(config.distDir)) {
    console.log('[vault-sync] Building initial site from remote vault...');
    await rebuildDistFromRemoteVault(config);
  } else {
    await stampDistVaultMetadata(config, config.distDir);
  }

  const state = {
    lastSha: await readRecordedVaultSha(config),
    lastEtag: null
  };

  if (config.pat) {
    try {
      await checkAndSyncOnce(config, state);
    } catch (err) {
      console.warn(`[vault-sync] Initial vault sync check warning: ${err.message}`);
    }
  }

  const forwardedArgs = ['preview', ...previewArgs];
  if (process.env.HOST && !previewArgs.includes('--host')) {
    forwardedArgs.push('--host', process.env.HOST);
  }
  if (process.env.PORT && !previewArgs.includes('--port')) {
    forwardedArgs.push('--port', process.env.PORT);
  }

  const previewProc = spawn(process.execPath, [config.astroBin, ...forwardedArgs], {
    cwd: config.cwd,
    stdio: 'inherit'
  });

  let isSyncing = false;
  let timer = null;

  if (config.pat) {
    console.log(`[vault-sync] Watching ${config.repo} every ${Math.round(config.intervalMs / 1000)}s...`);
    timer = setInterval(async () => {
      if (isSyncing) return;
      isSyncing = true;
      try {
        await checkAndSyncOnce(config, state);
      } catch (err) {
        console.warn(`[vault-sync] Poll warning: ${err.message}`);
      } finally {
        isSyncing = false;
      }
    }, config.intervalMs);
  } else {
    console.warn('[vault-sync] GH_PAT is not set; periodic remote vault sync is disabled.');
  }

  const shutdown = (signal) => {
    if (timer) clearInterval(timer);
    if (!previewProc.killed) {
      previewProc.kill(signal);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  previewProc.on('exit', (code) => {
    if (timer) clearInterval(timer);
    process.exit(code ?? 0);
  });
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const args = process.argv.slice(2);
  const config = resolveVaultSyncConfig();

  if (args.includes('--stamp-dist')) {
    stampDistVaultMetadata(config)
      .catch((err) => {
        console.warn(`[vault-sync] Failed to stamp dist metadata: ${err.message}`);
      });
  } else if (args.includes('--once')) {
    checkAndSyncOnce(config, { lastSha: null, lastEtag: null }, { hookOnly: args.includes('--hook-only') })
      .catch((err) => {
        console.error(`[vault-sync] Sync failed: ${err.message}`);
        process.exit(1);
      });
  } else {
    runServer(config, args).catch((err) => {
      console.error(`[vault-sync] Server failed: ${err.message}`);
      process.exit(1);
    });
  }
}
