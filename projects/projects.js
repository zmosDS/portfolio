 // Import function
import { fetchJSON, renderProjects } from '../global.js';

 // Fectching project data
const projects = await fetchJSON('../lib/projects.json');

 // Select projects container
const projectsContainer = document.querySelector('.projects');

  // Render Projects
renderProjects(projects, projectsContainer, 'h2');

