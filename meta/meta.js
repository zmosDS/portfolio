import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const timeSlider = document.getElementById('commit-progress');
const commitTimeElement = document.getElementById('commit-time');

export let commitProgress = timeSlider ? Number(timeSlider.value) : 100;
export let commitMaxTime = null;
let timeScale = null;

export function onTimeSliderChange() {
  if (!timeScale || !timeSlider || !commitTimeElement) return;

  commitProgress = Number(timeSlider.value);
  commitMaxTime = timeScale.invert(commitProgress);

  commitTimeElement.textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  commitTimeElement.dateTime = commitMaxTime.toISOString();
}

timeSlider?.addEventListener('input', onTimeSliderChange);

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
