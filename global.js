// global.js
// This script builds a navigation bar automatically on every page.
// It makes links work both locally (Live Server) and on GitHub Pages.
// It also highlights the current page link and opens external links in new tabs.

console.log("IT’S ALIVE!"); // quick test that JS is running

// $$ is helper funtion to grab multiple elements
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// List of pages for the nav 
const pages = [
  { url: "",            title: "Home" },
  { url: "projects/",   title: "Projects" },
  { url: "resume/",     title: "Resume" },
  { url: "contact/",    title: "Contact" },
  { url: "https://github.com/", title: "Github" },
];

// Detect if running locally or on GitHub Pages
// Live Server uses localhost or 127.0.0.1
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);

// Function to find the correct base folder for links
// On GitHub Pages, the site may be hosted inside /repo-name/
// Locally, it is just "/"
function detectBasePath() {
  if (isLocal) return "/";

  const hostIsGH = location.hostname.endsWith("github.io");
  if (!hostIsGH) return "/";

  // Split the path 
  const parts = location.pathname.split("/").filter(Boolean);

  // If there is a first part, assume it is the repo name
  return parts.length > 0 ? `/${parts[0]}/` : "/";
}

// The final base path that works for both Live Server and GitHub Pages
const BASE_PATH = detectBasePath();

// Helper to clean up paths
// Removes "index.html" and extra slashes so paths can be compared
const normalizePath = (p) =>
  p.replace(/index\.html?$/i, "").replace(/\/+$/, "/");

// Save current page
const currentHost = location.host;
const currentPath = normalizePath(location.pathname);

// Navigation 
// Create a <nav> element and add it to the top of the body
const nav = document.createElement("nav");
document.body.prepend(nav);

// Create each link
for (const p of pages) {
  let url = p.url;

  // Check if link is external (starts with http)
  const isExternal =
    /^https?:\/\//i.test(url) || url.startsWith("mailto:") || url.startsWith("tel:");

  // If internal, prefix with BASE_PATH so links work everywhere
  if (!isExternal && !url.startsWith("#")) {
    url = BASE_PATH + url;
  }

  // Create the <a> element
  const a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  // External links open in a new tab with security settings
  if (a.host !== currentHost) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }

  // Check if this link is the current page
  const linkPath = normalizePath(a.pathname);
  const isCurrent = a.host === currentHost && linkPath === currentPath;

  // Add "current" class to highlight active page
  a.classList.toggle("current", isCurrent);

  // Add accessibility info for screen readers
  if (isCurrent) a.setAttribute("aria-current", "page");

  // Add the link to the nav
  nav.append(a);
}

