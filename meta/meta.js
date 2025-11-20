import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { commits, updateScatterPlot, updateCommitStats } from './main.js';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

const commitTimeElement = document.getElementById('commit-time');
const colors = d3.scaleOrdinal(d3.schemeTableau10);

let commitMaxTime = null;
let filteredCommits = commits;
const scrollCommits = commits.slice().reverse();

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

function initTimeFilter() {
  if (!commitTimeElement || !commits || commits.length === 0) return;

  // Start with the most recent commit (show all history)
  const latestCommit = commits[commits.length - 1];
  commitMaxTime = latestCommit.datetime;
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

initTimeFilter();

d3.select('#scatter-story')
  .selectAll('.step')
  .data(scrollCommits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

function onStepEnter(response) {
  const el = response?.element;
  const commit = el?.__data__;
  if (!commit || !commitTimeElement) return;

  // Visually mark the active step (optional, but clarifying)
  d3.selectAll('#scatter-story .step').classed('is-active', false);
  d3.select(el).classed('is-active', true);

  commitMaxTime = commit.datetime;
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  // Update the time label
  commitTimeElement.textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  commitTimeElement.dateTime = commitMaxTime.toISOString();

  // Reuse the same updates as the slider
  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);
  updateCommitStats(filteredCommits);
}

const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);
