import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { commits, updateScatterPlot } from './main.js';

const timeSlider = document.getElementById('commit-progress');
const commitTimeElement = document.getElementById('commit-time');

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

export function onTimeSliderChange() {
  if (!timeSlider) return;

  commitProgress = Number(timeSlider.value);
  updateSliderFill();

  if (!timeScale || !commitTimeElement) return;

  commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  commitTimeElement.textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  commitTimeElement.dateTime = commitMaxTime.toISOString();

  updateScatterPlot(filteredCommits);
}

timeSlider?.addEventListener('input', onTimeSliderChange);
updateSliderFill();

function initTimeFilter() {
  if (!timeSlider || commits.length === 0) return;

  // Ensure the slider starts at the configured initial position
  timeSlider.value = INITIAL_PROGRESS;

  const sliderRange = [
    Number(timeSlider.min ?? 0),
    Number(timeSlider.max ?? 100),
  ];

  timeScale = d3.scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range(sliderRange);

  onTimeSliderChange();
}

initTimeFilter();
