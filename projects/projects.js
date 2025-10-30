 // Import function
import { fetchJSON, renderProjects } from '../global.js';

 // Fectching project data
const projects = await fetchJSON('../lib/projects.json');

 // Select projects container
const projectsContainer = document.querySelector('.projects');

  // Render Projects
renderProjects(projects, projectsContainer, 'h2');

// Import D3
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Select the SVG by your ID
let svg = d3.select("#pieChart");

// Data for slices
let data = [1, 2, 3, 4, 5];

// Colors for each slice
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Arc generator: defines slice shape
let arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);

// Pie generator: calculates angles automatically
let sliceGenerator = d3.pie();

// Compute arcs for all data points
let arcData = sliceGenerator(data);
let arcs = arcData.map(d => arcGenerator(d));

// Draw each arc path in the SVG
arcs.forEach((arc, idx) => {
  svg.append('path')
    .attr('d', arc)
    .attr('fill', colors(idx))
    .attr('transform', 'translate(0, 0)');
});
