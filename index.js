// Importing function
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// Fetch and filter projects
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

// Projects container
const projectsContainer = document.querySelector('.projects');

// Render latest projects
renderProjects(latestProjects, projectsContainer, 'h2');

// Fetches github
const githubData = await fetchGitHubData('zmosDS');

// Get github stats
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

