import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: "https://github.com/vis-society/lab-7/commit/" + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, "lines", {
        value: lines,
        enumerable: false,
        writable: true,
        configurable: true,
      });

      return ret;
    });
}

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

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  // ===== SCALES =====
  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const colorScale = d3.scaleSequential()
    .domain([0, 24])
    .interpolator(d3.interpolateBlues);

  // ===== SIZE SCALE (Step 4) =====
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);

  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]); // adjust if too big/small

  // ===== SORT so small dots render on top (Step 4.3) =====
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  // ===== GRIDLINES =====
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat("")
        .tickSize(-usableArea.width)
    );

  // ===== AXES =====
  svg.append("g")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat(d => String(d % 24).padStart(2, "0") + ":00")
    );

  // ===== DOTS (with opacity + size + hover behavior) =====
  svg.append("g")
    .attr("class", "dots")
    .selectAll("circle")
    .data(sortedCommits)
    .join("circle")
    .attr("cx", d => xScale(d.datetime))
    .attr("cy", d => yScale(d.hourFrac))
    .attr("r", d => rScale(d.totalLines))
    .attr("fill", d => colorScale(d.hourFrac))
    .style("fill-opacity", 0.7)
    .on("mouseenter", (event, commit) => {
      d3.select(event.currentTarget).style("fill-opacity", 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });
}

/* Tooltip helpers */

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  if (!commit) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
}

function updateTooltipVisibility(isVisible) {
  document.getElementById("commit-tooltip").hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
}

let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
