# Mapping Misconduct: NYPD Complaint Trends (1985–2019)

Interactive map of civilian complaints against the NYPD by precinct and year.  
**Live demo:** [View the Interactive Map](https://oneeljilc.github.io/Fall2025_DSCR209R_Project3/)

## Goal
Show how complaints changed over time and how a small set of precincts, especially Brooklyn’s 75th, account for a large share of the total.

## Built With
- D3.js v7
- GeoJSON
- HTML, CSS, JavaScript
- GitHub Pages

## Features
- Interactive NYC precinct map colored by yearly complaint counts
- Year slider to explore 1985–2019
- Brushing to select precincts with totals and a per-precinct breakdown
- Precincts with zero complaints shown in gray
- Blended per-year and global max for better contrast in early years
- Legend that updates to match the scale

## Files
- `data/allegations_20200727.csv` — raw CCRB export (reference only)
- `data/Project_3_Data_Transformation.ipynb` — Jupyter notebook used to process the raw CCRB dataset
- `data/complaints_by_precinct.json` — processed data used by the visualization
- `data/nyc_precincts.geojson` — precinct boundaries
- `index.html` — page structure
- `style.css` — styles
- `visualization.js` — D3 map, slider, legend, brushing

## Data Source
[New York City’s Civilian Complaint Review Board](https://projects.propublica.org/datastore/#civilian-complaints-against-new-york-city-police-officers)


## Contributors
Zack M., Jillian O., Alex H.

## Course
DSC 209 - Data Visualization, UC San Diego  
Fall 2025 • Team Smooth JAZ

