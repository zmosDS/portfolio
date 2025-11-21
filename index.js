/* =====================================================
   HOME PAGE
   Loads a project teaser + GitHub profile stats.
   Keep logic simple so updates stay low-risk.
   ===================================================== */

import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';


/* ---------- Latest Projects ---------- */
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3); // update count if you want more/less cards
const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h2');


/* ---------- GitHub Stats ---------- */
const githubData = await fetchGitHubData('zmosDS');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
  profileStats.innerHTML = `
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
    </dl>
  `;
}
