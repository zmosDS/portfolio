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
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
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

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // CHANGE: we should clear out the existing xAxis and then create a new one.
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// after initializing filteredCommits
let lines = filteredCommits.flatMap((d) => d.lines);
let files = d3
  .groups(lines, (d) => d.file)
  .map(([name, lines]) => {
    return { name, lines };
  });

let filesContainer = d3
  .select('#files')
  .selectAll('div')
  .data(files, (d) => d.name)
  .join(
    // This code only runs when the div is initially rendered
    (enter) =>
      enter.append('div').call((div) => {
        div.append('dt').append('code');
        div.append('dd');
      }),
  );

// This code updates the div info
filesContainer.select('dt > code').text((d) => d.name);
filesContainer.select('dd').text((d) => `${d.lines.length} lines`);



