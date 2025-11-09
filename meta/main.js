import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// adjust: chart size
const width = 1000;
const height = 600;

// adjust: outer margins
const margin = { top: 10, right: 10, bottom: 30, left: 40 };

// shared scales for brush + selection
let x;
let y;

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
    const obj = {
      id: commit,
      url: "https://github.com/vis-society/lab-7/commit/" + commit,
      author: first.author,
      date: first.date,
      time: first.time,
      timezone: first.timezone,
      datetime: first.datetime,
      hourFrac: first.datetime.getHours() + first.datetime.getMinutes() / 60,
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

// Summary stats
function renderCommitInfo(data, commits) {
  const stats = [
    { label: "COMMITS", value: commits.length },
    { label: "FILES", value: d3.group(data, d => d.file).size },
    { label: "TOTAL LOC", value: data.length },
    { label: "MAX DEPTH", value: d3.max(data, d => d.depth) },
    { label: "LONGEST LINE", value: d3.max(data, d => d.length) },
    { label: "MAX LINES", value: d3.max(d3.groups(data, d => d.file).map(([f, lines]) => lines.length)) }
  ];

  const container = d3.select("#stats")
    .append("div")
    .attr("class", "summary-box");

  const item = container.selectAll("div.stat")
    .data(stats)
    .enter()
    .append("div")
    .attr("class", "stat");

  item.append("div").attr("class", "value").text(d => d.value);
  item.append("div").attr("class", "label").text(d => d.label);
}

// Main chart
function renderScatterPlot(data, commits) {
  const area = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  // adjust: time scale on x
  x = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([area.left, area.right])
    .nice();

  // adjust: y scale (hours of day)
  y = d3.scaleLinear()
    .domain([0, 24])
    .range([area.bottom, area.top]);

  // adjust: color scale
  const color = d3.scaleSequential()
    .domain([0, 24])
    .interpolator(d3.interpolateBlues);

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);

  // adjust: bubble size range
  const r = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  // gridlines
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${area.left}, 0)`)
    .call(
      d3.axisLeft(y)
        .tickFormat("")
        .tickSize(-area.width)
    );

  svg.append("g")
    .attr("transform", `translate(0, ${area.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${area.left}, 0)`)
    .call(
      d3.axisLeft(y)
        .tickFormat(d => String(d % 24).padStart(2, "0") + ":00")
    );

  // circles
  svg.append("g")
    .attr("class", "dots")
    .selectAll("circle")
    .data(sortedCommits)
    .join("circle")
    .attr("cx", d => x(d.datetime))
    .attr("cy", d => y(d.hourFrac))
    .attr("r", d => r(d.totalLines))
    .attr("fill", d => color(d.hourFrac))
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

  createBrushSelector(svg);
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
  const cy = y(commit.hourFrac);

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
let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
