# Mapping Misconduct: NYPD Complaint Trends (1985–2019)

Interactive map of civilian complaints against the NYPD by precinct and year.  
**Live demo:** [View the Interactive Map](https://oneeljilc.github.io/Fall2025_DSCR209R_Project3/)

## Goal
The goal of this project is to visualize civilian complaints against the NYPD from 1985–2019 at the precinct level, allowing users to explore how complaint patterns changed over time and which areas experienced the highest concentration of reports.

## Built With
- D3.js 
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
```
Fall2025_DSCR209R_Project3/
├── index.html                               # Main webpage for the interactive map
├── visualization.js                         # D3 logic for map, slider, brushing, legend
├── style.css                                # Page styling
├── data/
│   ├── allegations_20200727.csv             # Raw CCRB dataset (reference only)
│   ├── Project_3_Data_Transformation.ipynb  # Data processing & transformation notebook
│   ├── complaints_by_precinct.json          # Processed dataset used by the visualization
│   └── nyc_precincts.geojson                # NYC precinct boundary shapes (GeoJSON)
├── README.md                                # Project overview and usage details

```

## Data Source
[New York City’s Civilian Complaint Review Board](https://projects.propublica.org/datastore/#civilian-complaints-against-new-york-city-police-officers)


## Contributors
Zack M. • Jillian O. • Alex H.  
Team Smooth JAZ 

## Course
DSC 209 - Data Visualization  
Fall 2025 • UC San Diego

