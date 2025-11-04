/* =====================================================
   PROJECTS PAGE
   Handles:
   - loading project data
   - rendering project cards
   - building pie chart (projects per year)
   - live search with year filter stacking
   ===================================================== */


/* --- Imports --- */
import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


/* --- Load project data --- */
const projects = await fetchJSON('../lib/projects.json');

/* --- Shared filter state --- */
let selectedYear = null;   // null = no year filter
let searchQuery = '';      // lowercase string from search input


/* --- DOM references --- */
const projectsContainer = document.querySelector('.projects');
const svg = d3.select('#pieChart');
const legend = d3.select('.legend');
const searchInput = document.querySelector('.searchBar');


/* --- Convert project list → [{label, value}] per year --- */
const toYearCounts = (list) => {
  const rolled = d3.rollups(list, v => v.length, d => d.year);
  return rolled
    .map(([year, count]) => ({ label: String(year), value: count }))
    .sort((a, b) => a.label.localeCompare(b.label));
};


/* --- Combine filtering (search + year) --- */
function getFilteredList() {
  let list = projects;

  // search filter
  if (searchQuery) {
    list = list.filter(p =>
      Object.values(p).join(' ').toLowerCase().includes(searchQuery)
    );
  }

  // year filter
  if (selectedYear) {
    list = list.filter(p => String(p.year) === selectedYear);
  }

  return list;
}

/* --- Render All (cards + chart) --- */
function renderAll() {
  const list = getFilteredList();

  // render project cards
  renderProjects(list, projectsContainer, 'h2');

  // no-results message
  const existing = document.querySelector('.no-results');
  if (!list.length) {
    if (!existing) {
      const p = document.createElement('p');
      p.className = 'no-results';
      p.textContent = 'No projects found.';
      projectsContainer.append(p);
    }
  } else if (existing) {
    existing.remove();
  }

  // render chart + legend
  drawChart(toYearCounts(list));
}


/* --- Draw pie chart + legend --- */
function drawChart(data) {
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  if (!data.length) {
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('No data');
    return;
  }

  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const arc = d3.arc().innerRadius(0).outerRadius(50);
  const pie = d3.pie().value(d => d.value);
  const arcs = pie(data);

  /* --- PIE SLICES --- */
  const slices = svg.selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (_, i) => colors(i))
    .classed('selected', d => selectedYear === data[d.index].label)
    .on('click', (_, d) => {
      const clickedYear = data[d.index].label;
      selectedYear = (selectedYear === clickedYear) ? null : clickedYear;
      renderAll();
    });

  /* --- LEGEND --- */
  const legendItems = legend.selectAll('li')
    .data(data)
    .enter()
    .append('li')
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .classed('selected', d => selectedYear === d.label)
    .on('click', (_, d) => {
      selectedYear = (selectedYear === d.label) ? null : d.label;
      renderAll();
    });
}


/* --- Search input --- */
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase();
  renderAll();
});


/* --- Initial load --- */
renderAll();
