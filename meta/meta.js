import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const timeSlider = document.getElementById('commit-progress');
const commitTimeElement = document.getElementById('commit-time');

export let commitProgress = timeSlider ? Number(timeSlider.value) : 0;
export let commitMaxTime = null;
let timeScale = null;

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

  commitTimeElement.textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  commitTimeElement.dateTime = commitMaxTime.toISOString();
}

timeSlider?.addEventListener('input', onTimeSliderChange);
updateSliderFill();

async function initTimeFilter() {
  if (!timeSlider || !commitTimeElement) return;

  const commits = await d3.csv('loc.csv', row => ({
    datetime: new Date(row.datetime),
  }));

  if (commits.length === 0) return;

  const sliderRange = [
    Number(timeSlider.min ?? 0),
    Number(timeSlider.max ?? 100),
  ];

  timeScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range(sliderRange);

  onTimeSliderChange();
}

initTimeFilter();
