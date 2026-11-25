# Healthcare Visual Analytics Dashboard

An interactive healthcare dashboard for exploring patient data, analyzing medical statistics, and visualizing hospital-related insights.

## Overview

This project provides an interactive view of healthcare data through key performance indicators, charts, filters, and a geographical map of hospitals.

## Features

- **Key Metrics:** Total Patients, Average Billing, Average Length of Stay, and Abnormal Test Results.
- **Interactive Visualizations:** Patient demographics, medical conditions, test results, billing analysis, and length of stay.
- **Dynamic Filters:** Filter data by hospital, medical condition, age group, gender, admission type, test results, blood type, and insurance provider.
- **Correlation Matrix:** Explore relationships between numerical variables.
- **Interactive Hospital Map:** View hospital locations and related statistics.
- **Responsive Dashboard:** Charts and metrics update automatically based on selected filters.

## Technologies

- HTML5
- CSS3
- JavaScript
- D3.js v7
- ArcGIS API for JavaScript 4.27

## Live Demo

[View the Healthcare Dashboard](https://linadiaf.github.io/dashboard-medical-health/)

## Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/LinaDiaf/dashboard-medical-health.git
   ```

2. Open the project folder.
3. Run the project using a local HTTP server to ensure the CSV dataset loads correctly.
4. Open the dashboard in your browser.

## Project Structure

```text
dashboard-medical-health/
├── Data/
│   └── healthcare_dataset.csv
├── index.html
├── script.js
├── styles.css
└── README.md
```
