import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { commits, updateScatterPlot, updateCommitStats } from './main.js';

const timeSlider = document.getElementById('commit-progress');
const commitTimeElement = document.getElementById('commit-time');
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// Change this between 0 (earliest) and 100 (latest)
// if you want a different initial slider position.
const INITIAL_PROGRESS = 100;

let commitProgress = INITIAL_PROGRESS;
let commitMaxTime = null;
let timeScale = null;
let filteredCommits = commits;

function updateSliderFill() {
  if (!timeSlider) return;
  const min = Number(timeSlider.min ?? 0);
  const max = Number(timeSlider.max ?? 100);
  const percent = ((commitProgress - min) / (max - min)) * 100;
  timeSlider.style.setProperty('--progress', `${percent}%`);
}

function updateFileDisplay(currentCommits) {
  const container = d3.select('#files');

  if (!currentCommits || currentCommits.length === 0) {
    container.selectAll('div').remove();
    return;
  }

  const lines = currentCommits.flatMap(d => d.lines ?? []);

  const files = d3
    .groups(lines, d => d.file)
    .map(([name, fileLines]) => ({ name, lines: fileLines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const filesContainer = container
    .selectAll('div')
    .data(files, d => d.name)
    .join(enter => {
      const div = enter.append('div');
      div.append('dt').append('code');
      div.append('dd');
      return div;
    });

  // filename + line count
  filesContainer
    .select('dt > code')
    .html(d => `${d.name}<small>${d.lines.length} lines</small>`);

  // one dot per line
  filesContainer
    .select('dd')
    .selectAll('div')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', d => `--color: ${colors(d.type)}`);
}

export function onTimeSliderChange() {
  if (!timeSlider) return;

  commitProgress = Number(timeSlider.value);
  updateSliderFill();

  if (!timeScale || !commitTimeElement) return;

  commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  commitTimeElement.textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  commitTimeElement.dateTime = commitMaxTime.toISOString();

  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);
  updateCommitStats(filteredCommits);
}

timeSlider?.addEventListener('input', onTimeSliderChange);

function initTimeFilter() {
  if (!timeSlider || !commitTimeElement || !commits || commits.length === 0) return;

  timeSlider.value = String(INITIAL_PROGRESS);
  commitProgress = INITIAL_PROGRESS;
  updateSliderFill();

  const sliderRange = [
    Number(timeSlider.min ?? 0),
    Number(timeSlider.max ?? 100),
  ];

  timeScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range(sliderRange);

  onTimeSliderChange();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initTimeFilter);
} else {
  initTimeFilter();
}
