/* =====================================================
   GLOBAL.JS
   Builds navigation and handles global helpers.
   Works both locally (Live Server) and on GitHub Pages.
   ===================================================== */

console.log("IT’S ALIVE!"); // quick test that JS is running


/* --- Helper: $$ (query selector all) --- */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


/* --- List of pages for the nav --- */
const pages = [
  { url: "",            title: "Home" },
  { url: "projects/",   title: "Projects" },
  { url: "resume/",     title: "Resume" },
  { url: "contact/",    title: "Contact" },
  { url: "meta/",       title: "Meta" },
  { url: "https://github.com/zmosDS", title: "Github" },
];


/* --- Detect if running locally or on GitHub Pages --- */
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);


/* --- Function to find the correct base folder for links --- */
function detectBasePath() {
  if (isLocal) return "/";

  const hostIsGH = location.hostname.endsWith("github.io");
  if (!hostIsGH) return "/";

  const parts = location.pathname.split("/").filter(Boolean);

  // If repo is served from subfolder (like /portfolio/), return that as base
  return parts.length > 0 ? `/${parts[0]}/` : "/";
}


/* --- The final base path that works for both Live Server and GitHub Pages --- */
const BASE_PATH = detectBasePath();
export { BASE_PATH }; // used in projects.js for images + JSON


/* --- Helper to clean up paths for comparison --- */
const normalizePath = (p) =>
  p.replace(/index\.html?$/i, "").replace(/\/+$/, "/");


/* --- Save current page info --- */
const currentHost = location.host;
const currentPath = normalizePath(location.pathname);


/* =====================================================
   NAVIGATION
   Auto-builds nav bar and highlights current page.
   ===================================================== */

const nav = document.createElement("nav");
document.body.prepend(nav);

for (const p of pages) {
  let url = p.url;

  // External link detection
  const isExternal =
    /^https?:\/\//i.test(url) || url.startsWith("mailto:") || url.startsWith("tel:");

  // Add base path for internal links (important for GitHub Pages)
  if (!isExternal && !url.startsWith("#")) {
    url = BASE_PATH + url;
  }

  const a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  // Open external links in new tab
  if (a.host !== currentHost) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }

  // Highlight current page
  const linkPath = normalizePath(a.pathname);
  const isCurrent = a.host === currentHost && linkPath === currentPath;
  a.classList.toggle("current", isCurrent);
  if (isCurrent) a.setAttribute("aria-current", "page");

  nav.append(a);
}


/* =====================================================
   DARK MODE SWITCH
   Creates a small theme dropdown and persists choice.
   ===================================================== */

(function () {
  // Build dropdown at top of <body>
  document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
        Theme:
        <select>
          <option value="light dark">Automatic</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    `
  );

  const select = document.querySelector('.color-scheme select');

  function setColorScheme(value) {
    document.documentElement.style.setProperty('color-scheme', value);
    select.value = value;

    // Save preference (except for Automatic)
    if (value === 'light dark') {
      localStorage.removeItem('colorScheme');
    } else {
      localStorage.colorScheme = value;
    }
  }

  // Load saved or default setting
  const saved = localStorage.colorScheme;
  setColorScheme(saved || 'light dark');

  // Listen for user change
  select.addEventListener('input', (e) => {
    setColorScheme(e.target.value);
  });
})();


/* =====================================================
   PROJECTS
   Handles:
   - loading project data
   - rendering project cards
   - working paths for both local + GitHub Pages
   ===================================================== */


/* --- Fetch JSON --- */
export async function fetchJSON(url) {
  try {
    // Always resolve relative to BASE_PATH (fixes /portfolio/ subdir issue)
    const fullURL = url.startsWith('http') ? url : `${BASE_PATH}${url}`;
    const response = await fetch(fullURL);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fullURL}: ${response.statusText}`);
    }

    // Return parsed data for use in project page
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}


/* --- Render Projects --- */
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';

  projects.forEach(project => {
    // Build correct image path (BASE_PATH ensures proper folder depth)
    const imgPath = project.image.startsWith('http')
      ? project.image
      : `${BASE_PATH}${project.image.replace(/^\/+/, '')}`;

    // Project card template
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${imgPath}" alt="${project.title}">
      <div class="project-info">
        <p>${project.description}</p>

        ${project.live || project.code ? `
          <div class="project-links">
            ${project.live ? `<a href="${project.live}" target="_blank" rel="noopener noreferrer">View Project</a>` : ''}
            ${project.live && project.code ? ' · ' : ''}
            ${project.code ? `<a href="${project.code}" target="_blank" rel="noopener noreferrer">View Code</a>` : ''}
          </div>
        ` : ''}

        <p class="project-year">${project.year}</p>
      </div>
    `;
    containerElement.appendChild(article);
  });

  // If you add extra project metadata or filtering later, modify here.
}


/* --- GitHub API Helper --- */
export async function fetchGitHubData(username) {
  // Used for pulling user profile or repo info dynamically
  return fetchJSON(`https://api.github.com/users/${username}`);
}
