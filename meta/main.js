import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export const width = 1000;
export const height = 600;

export const margin = { top: 10, right: 10, bottom: 30, left: 40 };

const chartArea = {
  left: margin.left,
  right: width - margin.right,
  top: margin.top,
  bottom: height - margin.bottom,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

// shared scales for brush + selection
let x;
let y;

let chartSvg;
let dotsGroup;
let xAxisGroup;
let yAxisGroup;

// Color scale: night = blue, day = orange.
// 0h  → deep blue, 12h → orange, 24h → deep blue.
const nightColor = d3.rgb("#1d4ed8");   // rich blue
const dayColor = d3.rgb("#de6118");     // matches existing orange
const nightToDay = d3.interpolateRgb(nightColor, dayColor);
const dayToNight = d3.interpolateRgb(dayColor, nightColor);

const hourColorScale = d3
  .scaleSequential((t) => {
    // t is normalized 0–1 fraction of the day
    if (t <= 0.5) {
      // midnight → noon: blue → orange
      return nightToDay(t * 2);
    }
    // noon → midnight: orange → blue
    return dayToNight((t - 0.5) * 2);
  })
  .domain([0, 24]);

export let data;
export let commits;

// Load and parse CSV
async function loadData() {
  const data = await d3.csv("loc.csv", row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

// Group rows by commit
function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([commit, lines]) => {
    const first = lines[0];
    const hourOfDay = first.datetime.getHours() + first.datetime.getMinutes() / 60;
    const hourWrapped = hourOfDay < 6 ? hourOfDay + 24 : hourOfDay;
    const obj = {
      id: commit,
      url: "https://github.com/vis-society/lab-7/commit/" + commit,
      author: first.author,
      date: first.date,
      time: first.time,
      timezone: first.timezone,
      datetime: first.datetime,
      hourFrac: hourOfDay,
      hourWrapped,
      totalLines: lines.length,
    };

    Object.defineProperty(obj, "lines", {
      value: lines,
      enumerable: false,
      writable: true,
      configurable: true,
    });

    return obj;
  });
}

// Summary stats helpers
function computeStats(activeData, activeCommits) {
  return [
    { label: "COMMITS", value: activeCommits.length },
    { label: "FILES", value: d3.group(activeData, d => d.file).size },
    { label: "TOTAL LOC", value: activeData.length },
    { label: "MAX DEPTH", value: d3.max(activeData, d => d.depth) },
    { label: "LONGEST LINE", value: d3.max(activeData, d => d.length) },
    {
      label: "MAX LINES",
      value: d3.max(
        d3.groups(activeData, d => d.file).map(([f, lines]) => lines.length),
      ),
    },
  ];
}

// Update summary stats for current selection (or all commits if none)
export function updateCommitStats(filteredCommits) {
  const hasData = filteredCommits && filteredCommits.length > 0;
  const activeCommits = hasData ? filteredCommits : commits;
  const activeData = hasData
    ? filteredCommits.flatMap(d => d.lines ?? [])
    : data;

  const stats = computeStats(activeData, activeCommits);

  const container = d3.select("#stats");

  const summaryBox = container
    .selectAll("div.summary-box")
    .data([null])
    .join("div")
    .attr("class", "summary-box");

  const items = summaryBox
    .selectAll("div.stat")
    .data(stats, d => d.label)
    .join(enter => {
      const div = enter.append("div").attr("class", "stat");
      div.append("div").attr("class", "value");
      div.append("div").attr("class", "label");
      return div;
    });

  items.select(".value").text(d => d.value);
  items.select(".label").text(d => d.label);
}

// Main chart
function renderScatterPlot(data, commits) {
  chartSvg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  // adjust: time scale on x
  x = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([chartArea.left, chartArea.right])
    .nice();

  // adjust: y scale (hours of day)
  y = d3.scaleLinear()
    .domain([30, 6]) // flipped: 6 AM at bottom, wraps through the night
    .range([chartArea.bottom, chartArea.top]);

  // gridlines
  chartSvg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${chartArea.left}, 0)`)
    .call(
      d3.axisLeft(y)
        .tickFormat("")
        .tickSize(-chartArea.width)
    );

  xAxisGroup = chartSvg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${chartArea.bottom})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%b %-d"))
    );

  yAxisGroup = chartSvg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${chartArea.left}, 0)`)
    .call(
      d3.axisLeft(y)
        // Explicit ticks so we don't repeat 6 AM at top + bottom:
        // 6, 8, 10, ..., 28 (which formats to 4 AM).
        .tickValues(d3.range(6, 30, 2))
        .tickFormat(d => {
          const h = (d % 24 + 24) % 24; // 0–23
          const date = new Date(2000, 0, 1, h);
          return d3.timeFormat("%-I %p")(date); // e.g. "6 AM", "8 AM", ..., "4 AM"
        })
    );

  dotsGroup = chartSvg.append("g")
    .attr("class", "dots");

  updateScatterPlot(commits);

  createBrushSelector(chartSvg);
}

export function updateScatterPlot(filteredCommits) {
  if (!chartSvg || !xAxisGroup || !dotsGroup) return;

  const hasData = filteredCommits && filteredCommits.length > 0;
  const activeCommits = hasData ? filteredCommits : commits;

  x.domain(d3.extent(activeCommits, d => d.datetime));

  const [minLines, maxLines] = d3.extent(activeCommits, d => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%b %-d"));
  xAxisGroup
    .attr("transform", `translate(0, ${chartArea.bottom})`)
    .call(xAxis);

  const sortedCommits = d3.sort(activeCommits, d => -d.totalLines);

  dotsGroup
    .selectAll("circle")
    .data(sortedCommits, d => d.id)
    .join("circle")
    .attr("cx", d => x(d.datetime))
    .attr("cy", d => y(d.hourWrapped))
    .attr("r", d => rScale(d.totalLines))
    .attr("fill", d => hourColorScale(d.hourFrac))
    .style("fill-opacity", 0.7)
    .on("mouseenter", (event, commit) => {
      d3.select(event.currentTarget).style("fill-opacity", 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mouseleave", event => {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });
}

// Tooltip helpers
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  if (!commit) return;

  link.href = commit.url;
  link.textContent = commit.id;

  // adjust: tooltip date format
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
}

function updateTooltipVisibility(show) {
  document.getElementById("commit-tooltip").hidden = !show;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
}

// brush overlay
function createBrushSelector(svg) {
  svg.append("g")
    .attr("class", "brush")
    .call(
      d3.brush()
        .on("start brush end", brushed)
    );

  // D3 overlay blocks hover unless dots are raised
  svg.selectAll('.dots, .overlay ~ *').raise();
}

// Select dots
function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;

  const cx = x(commit.datetime);
  const cy = y(commit.hourWrapped);

  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selectedCommits.flatMap(d => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
      <div class="lang-block">
        <dt>${language}</dt>
        <dd>${count} lines</dd>
        <dd>${formatted}</dd>
      </div>
    `;
  }
}

// initialize
data = await loadData();
commits = processCommits(data);

updateCommitStats(commits);
renderScatterPlot(data, commits);
