const API = 'https://api.github.com';
const USERNAME = 'DevanshBurman';
const CACHE_KEY = `github-dashboard:${USERNAME}:v2`;
const CACHE_TTL = 30 * 60 * 1000;
const PRIORITIES = ['placement', 'diabetes', 'learnix', 'patient-monitoring', 'patient_monitoring', 'iot'];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function runtimeToken() {
  // A host may inject GITHUB_TOKEN at runtime via a secure proxy. Never commit it.
  return globalThis.GITHUB_TOKEN || globalThis.__GITHUB_TOKEN__ || '';
}

async function request(path, { retries = 2, optional = false } = {}) {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const token = runtimeToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${API}${path}`, { headers });
      if (response.ok) return response.json();
      if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
        const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
        throw new Error(`GitHub rate limit reached. Try again after ${new Date(reset).toLocaleTimeString()}.`);
      }
      if (optional && [404, 422].includes(response.status)) return null;
      if (response.status < 500 || attempt === retries) throw new Error(`GitHub API request failed (${response.status}).`);
    } catch (error) {
      if (attempt === retries) {
        if (optional) return null;
        throw error;
      }
    }
    await wait(500 * (2 ** attempt));
  }
}

async function getContributions() {
  try {
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = await response.json();
    return { total: Object.values(data.total || {}).reduce((sum, value) => sum + Number(value), 0), days: data.contributions || [] };
  } catch { return null; }
}

async function getLanguageBytes(repos) {
  const candidates = repos.filter(repo => !repo.fork).slice(0, 20);
  const results = await Promise.all(candidates.map(repo => request(`/repos/${USERNAME}/${repo.name}/languages`, { optional: true, retries: 1 })));
  return results.reduce((totals, languages) => {
    Object.entries(languages || {}).forEach(([name, bytes]) => { totals[name] = (totals[name] || 0) + bytes; });
    return totals;
  }, {});
}

function selectFeatured(repos) {
  return [...repos].sort((a, b) => {
    const rank = repo => {
      const index = PRIORITIES.findIndex(keyword => repo.name.toLowerCase().includes(keyword));
      return index < 0 ? 99 : index;
    };
    return rank(a) - rank(b) || b.stargazers_count - a.stargazers_count || new Date(b.updated_at) - new Date(a.updated_at);
  }).slice(0, 4);
}

async function getGitHubDashboard({ force = false } = {}) {
  if (!force) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.savedAt < CACHE_TTL) return { ...cached.data, cached: true };
    } catch { /* Browser storage may be disabled. */ }
  }
  const [profile, repos, events, commits, contributions] = await Promise.all([
    request(`/users/${USERNAME}`),
    request(`/users/${USERNAME}/repos?per_page=100&sort=updated&type=public`),
    request(`/users/${USERNAME}/events/public?per_page=5`),
    request(`/search/commits?q=author:${USERNAME}&per_page=1`, { optional: true }),
    getContributions()
  ]);
  const languages = await getLanguageBytes(repos);
  const data = {
    profile, repos, events: events || [], languages, contributions,
    latest: repos.filter(repo => !repo.fork).slice(0, 6),
    featured: selectFeatured(repos.filter(repo => !repo.fork)),
    stats: {
      repositories: profile.public_repos, followers: profile.followers, following: profile.following,
      stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      forks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
      commits: commits?.total_count ?? null, contributions: contributions?.total ?? null
    }
  };
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data })); } catch { /* No-op. */ }
  return data;
}

globalThis.githubService = Object.freeze({ getGitHubDashboard });
