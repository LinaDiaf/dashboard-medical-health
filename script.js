        let rawData = [];
        let processedData = [];
        let filteredData = [];
        let map, view;

        const colors = {
            testResults: {
                'Normal': '#a1ecff',
                'Abnormal': '#177c95',
                'Inconclusive': '#2dd4fe'
            },
            gender: {
                'Male': '#35c9ff',
                'Female': '#e73c89',
                'Other': '#95a5a6'
            }
        };

        // Auto-load data from file path
        window.addEventListener('DOMContentLoaded', function() {
            fetch('Data/healthcare_dataset.csv')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Could not load dataset. Make sure Data/healthcare_dataset.csv exists in the correct location.');
                    }
                    return response.text();
                })
                .then(text => {
                    parseCSV(text);
                    document.getElementById('status').textContent = '✓ Data loaded successfully!';
                    document.getElementById('status').style.color = '#28a745';
                })
                .catch(error => {
                    document.getElementById('status').textContent = '✗ Error: ' + error.message;
                    document.getElementById('status').style.color = '#dc3545';
                    console.error('Error loading dataset:', error);
                });
        });

        function parseCSV(text) {
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            rawData = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const values = parseCSVLine(lines[i]);
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] ? values[index].trim() : '';
                });
                rawData.push(obj);
            }
            
            preprocessData();
            initializeVisualization();
        }

        function parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current);
            return result;
        }

        function preprocessData() {
            processedData = rawData.map(row => {
                const admissionDate = new Date(row['Date of Admission']);
                const dischargeDate = new Date(row['Discharge Date']);
                const lengthOfStay = Math.ceil((dischargeDate - admissionDate) / (1000 * 60 * 60 * 24));
                
                const age = parseInt(row.Age) || 0;
                let ageGroup;
                if (age <= 18) ageGroup = '0-18';
                else if (age <= 40) ageGroup = '19-40';
                else if (age <= 65) ageGroup = '41-65';
                else ageGroup = '65+';
                
                return {
                    ...row,
                    Age: age,
                    AgeGroup: ageGroup,
                    LengthOfStay: lengthOfStay,
                    BillingAmount: parseFloat(row['Billing Amount']) || 0,
                    AdmissionDate: admissionDate,
                    DischargeDate: dischargeDate
                };
            });
            
            filteredData = [...processedData];
        }

        function initializeVisualization() {
            document.getElementById('mainDashboard').style.display = 'block';
            
            populateFilters();
            updateStatistics();
            createTestResultsChart();
            createConditionsChart();
            createBillingChart();
            createDemographicsChart();
            initializeMap();
            createCorrelationMatrix();
            createAdmissionTypePieChart();
            createConditionStayChart();

            
            setupFilterListeners();
        }

        function populateFilters() {
            const hospitals = [...new Set(processedData.map(d => d.Hospital))].sort();
            const conditions = [...new Set(processedData.map(d => d['Medical Condition']))].sort();
            const genders = [...new Set(processedData.map(d => d.Gender))].sort();
            const admissionTypes = [...new Set(processedData.map(d => d['Admission Type']))].sort();
            const bloodTypes = [...new Set(processedData.map(d => d['Blood Type']))].sort();
            const insurances = [...new Set(processedData.map(d => d['Insurance Provider']))].sort();
            
            const hospitalSelect = document.getElementById('hospitalFilter');
            hospitals.forEach(h => {
                const option = document.createElement('option');
                option.value = h;
                option.textContent = h;
                hospitalSelect.appendChild(option);
            });
            
            const conditionSelect = document.getElementById('conditionFilter');
            conditions.forEach(c => {
                const option = document.createElement('option');
                option.value = c;
                option.textContent = c;
                conditionSelect.appendChild(option);
            });
            
            const genderSelect = document.getElementById('genderFilter');
            genders.forEach(g => {
                const option = document.createElement('option');
                option.value = g;
                option.textContent = g;
                genderSelect.appendChild(option);
            });
            
            const admissionSelect = document.getElementById('admissionFilter');
            admissionTypes.forEach(a => {
                const option = document.createElement('option');
                option.value = a;
                option.textContent = a;
                admissionSelect.appendChild(option);
            });
            
            const bloodTypeSelect = document.getElementById('bloodTypeFilter');
            bloodTypes.forEach(b => {
                const option = document.createElement('option');
                option.value = b;
                option.textContent = b;
                bloodTypeSelect.appendChild(option);
            });
            
            const insuranceSelect = document.getElementById('insuranceFilter');
            insurances.forEach(i => {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                insuranceSelect.appendChild(option);
            });
        }

        function setupFilterListeners() {
            ['hospitalFilter', 'conditionFilter', 'ageFilter', 'genderFilter', 
             'admissionFilter', 'testResultFilter', 'bloodTypeFilter', 'insuranceFilter'].forEach(id => {
                document.getElementById(id).addEventListener('change', applyFilters);
            });

            document.getElementById('resetFilters').addEventListener('click', resetAllFilters);
        }
      function resetAllFilters() {
            // Reset all filter dropdowns to "all"
            document.getElementById('hospitalFilter').value = 'all';
            document.getElementById('conditionFilter').value = 'all';
            document.getElementById('ageFilter').value = 'all';
            document.getElementById('genderFilter').value = 'all';
            document.getElementById('admissionFilter').value = 'all';
            document.getElementById('testResultFilter').value = 'all';
            document.getElementById('bloodTypeFilter').value = 'all';
            document.getElementById('insuranceFilter').value = 'all';
            
            // Reset filtered data to all processed data
            filteredData = [...processedData];
            
            // Update all visualizations
            updateAllVisualizations();
            
            // Visual feedback - button animation
            const btn = document.getElementById('resetFilters');
            btn.textContent = '✓ Filters Reset!';
            btn.style.background = 'linear-gradient(135deg, #28a745 0%, #218838 100%)';
            
            setTimeout(() => {
                btn.textContent = 'Reset All Filters';
                btn.style.background = 'linear-gradient(135deg, #359cdc 0%, #50a7da 100%)';
            }, 1500);
        }
        function applyFilters() {
            const hospital = document.getElementById('hospitalFilter').value;
            const condition = document.getElementById('conditionFilter').value;
            const ageGroup = document.getElementById('ageFilter').value;
            const gender = document.getElementById('genderFilter').value;
            const admissionType = document.getElementById('admissionFilter').value;
            const testResult = document.getElementById('testResultFilter').value;
            const bloodType = document.getElementById('bloodTypeFilter').value;
            const insurance = document.getElementById('insuranceFilter').value;
            
            filteredData = processedData.filter(d => {
                if (hospital !== 'all' && d.Hospital !== hospital) return false;
                if (condition !== 'all' && d['Medical Condition'] !== condition) return false;
                if (ageGroup !== 'all' && d.AgeGroup !== ageGroup) return false;
                if (gender !== 'all' && d.Gender !== gender) return false;
                if (admissionType !== 'all' && d['Admission Type'] !== admissionType) return false;
                if (testResult !== 'all' && d['Test Results'] !== testResult) return false;
                if (bloodType !== 'all' && d['Blood Type'] !== bloodType) return false;
                if (insurance !== 'all' && d['Insurance Provider'] !== insurance) return false;
                return true;
            });
            
            updateAllVisualizations();
        }

        function updateAllVisualizations() {
            updateStatistics();
            createTestResultsChart();
            createConditionsChart();
            createBillingChart();
            createDemographicsChart();
            createCorrelationMatrix();
            createAdmissionTypePieChart();
            createConditionStayChart();

        }

        function updateStatistics() {
            const totalPatients = filteredData.length;
            const avgBilling = d3.mean(filteredData, d => d.BillingAmount).toFixed(2);
            const avgStay = d3.mean(filteredData, d => d.LengthOfStay).toFixed(1);
            const abnormalCount = filteredData.filter(d => d['Test Results'] === 'Abnormal').length;
            
            const statsHTML = `
                <div class="stat-card">
                    <div class="stat-value">${totalPatients}</div>
                    <div class="stat-label">Total Patients</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$${avgBilling}</div>
                    <div class="stat-label">Avg Billing</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${avgStay}</div>
                    <div class="stat-label">Avg Stay (days)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${abnormalCount}</div>
                    <div class="stat-label">Abnormal Results</div>
                </div>
            `;
            
            document.getElementById('statsPanel').innerHTML = statsHTML;
        }

        function createTestResultsChart() {
            const container = document.getElementById('testResultsChart');
            container.innerHTML = '';
            
            const data = d3.rollup(filteredData, v => v.length, d => d['Test Results']);
            const chartData = Array.from(data, ([key, value]) => ({key, value}));
            
            const width = container.offsetWidth;
            const height = 300;
            const margin = {top: 20, right: 20, bottom: 50, left: 60};
            
            const svg = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height);
            
            const x = d3.scaleBand()
                .domain(chartData.map(d => d.key))
                .range([margin.left, width - margin.right])
                .padding(0.3);
            
            const y = d3.scaleLinear()
                .domain([0, d3.max(chartData, d => d.value)])
                .nice()
                .range([height - margin.bottom, margin.top]);
            
            svg.selectAll('rect')
                .data(chartData)
                .join('rect')
                .attr('x', d => x(d.key))
                .attr('y', height - margin.bottom)
                .attr('width', x.bandwidth())
                .attr('height', 0)
                .attr('fill', d => colors.testResults[d.key] || '#6c757d')
                .transition()
                .duration(800)
                .attr('y', d => y(d.value))
                .attr('height', d => y(0) - y(d.value));
            
            svg.selectAll('rect')
                .on('mouseover', function(event, d) {
                    const tooltip = document.getElementById('tooltip');
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `<strong>${d.key}</strong><br>Count: ${d.value}`;
                    tooltip.style.left = event.pageX + 10 + 'px';
                    tooltip.style.top = event.pageY - 30 + 'px';
                    d3.select(this).attr('opacity', 0.7);
                })
                .on('mouseout', function() {
                    document.getElementById('tooltip').style.display = 'none';
                    d3.select(this).attr('opacity', 1);
                });
            
            svg.append('g')
                .attr('transform', `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x))
                .selectAll('text')
                .style('font-size', '12px');
            
            svg.append('g')
                .attr('transform', `translate(${margin.left},0)`)
                .call(d3.axisLeft(y))
                .selectAll('text')
                .style('font-size', '12px');
        }

        function createConditionsChart() {
            const container = document.getElementById('conditionsChart');
            container.innerHTML = '';
            
            const nested = d3.rollup(
                filteredData,
                v => d3.rollup(v, vv => vv.length, dd => dd['Test Results']),
                d => d['Medical Condition']
            );
            
            const conditions = Array.from(nested.keys()).slice(0, 6);
            const testResults = ['Abnormal', 'Inconclusive','Normal'];
            
            const data = conditions.map(condition => {
                const obj = {condition};
                testResults.forEach(result => {
                    obj[result] = nested.get(condition)?.get(result) || 0;
                });
                return obj;
            });
            
            const width = container.offsetWidth;
            const height = 300;
            const margin = {top: 20, right: 100, bottom: 80, left: 60};
            
            const svg = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height);
            
            const x = d3.scaleBand()
                .domain(conditions)
                .range([margin.left, width - margin.right])
                .padding(0.2);
            
            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d3.sum(testResults, key => d[key]))])
                .nice()
                .range([height - margin.bottom, margin.top]);
            
            const stack = d3.stack()
                .keys(testResults);
            
            const series = stack(data);
            
            svg.selectAll('g.layer')
                .data(series)
                .join('g')
                .attr('class', 'layer')
                .attr('fill', d => colors.testResults[d.key])
                .selectAll('rect')
                .data(d => d)
                .join('rect')
                .attr('x', d => x(d.data.condition))
                .attr('y', height - margin.bottom)
                .attr('height', 0)
                .attr('width', x.bandwidth())
                .transition()
                .duration(800)
                .attr('y', d => y(d[1]))
                .attr('height', d => y(d[0]) - y(d[1]));
            svg.selectAll('rect')
                .on('mouseover', function(event, d) {
                    const tooltip = document.getElementById('tooltip');
                    const seriesKey = this.parentNode.__data__.key;  // récupère Normal/Abnormal/Inconclusive
                    const value = d.data[seriesKey];                // valeur correspondante à cette barre
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `<strong>${seriesKey}</strong><br>Count: ${value}`;
                    tooltip.style.left = event.pageX + 10 + 'px';
                    tooltip.style.top = event.pageY - 30 + 'px';
                    d3.select(this).attr('opacity', 0.7);
                })
                .on('mouseout', function() {
                    document.getElementById('tooltip').style.display = 'none';
                    d3.select(this).attr('opacity', 1);
                });
            svg.append('g')
                .attr('transform', `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x))
                .selectAll('text')
                .attr('transform', 'rotate(-45)')
                .style('text-anchor', 'end')
                .style('font-size', '11px');
            
            svg.append('g')
                .attr('transform', `translate(${margin.left},0)`)
                .call(d3.axisLeft(y));
            
            const legend = svg.append('g')
                .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);
            
            testResults.forEach((result, i) => {
                const g = legend.append('g')
                    .attr('transform', `translate(0, ${i * 25})`);
                
                g.append('rect')
                    .attr('width', 18)
                    .attr('height', 18)
                    .attr('fill', colors.testResults[result]);
                
                g.append('text')
                    .attr('x', 24)
                    .attr('y', 13)
                    .text(result)
                    .style('font-size', '12px');
            });
        }

        function createBillingChart() {
            const container = document.getElementById('billingChart');
            container.innerHTML = '';
            
            const width = container.offsetWidth;
            const height = 300;
            const margin = {top: 20, right: 20, bottom: 50, left: 60};
            
            const svg = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height);
            
            const bins = d3.bin()
                .domain([0, d3.max(filteredData, d => d.BillingAmount)])
                .thresholds(20)
                (filteredData.map(d => d.BillingAmount));
            
            const x = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d.BillingAmount)])
                .range([margin.left, width - margin.right]);
            
            const y = d3.scaleLinear()
                .domain([0, d3.max(bins, d => d.length)])
                .nice()
                .range([height - margin.bottom, margin.top]);
            
            svg.selectAll('rect')
                .data(bins)
                .join('rect')
                .attr('x', d => x(d.x0) + 1)
                .attr('y', height - margin.bottom)
                .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
                .attr('height', 0)
                .attr('fill', '#667eea')
                .transition()
                .duration(800)
                .attr('y', d => y(d.length))
                .attr('height', d => y(0) - y(d.length));
             svg.selectAll('rect')
                .on('mouseover', function(event, d) {
                    const tooltip = document.getElementById('tooltip');
                    const value = d.length;          
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `</strong>Count: ${value}`;
                    tooltip.style.left = event.pageX + 10 + 'px';
                    tooltip.style.top = event.pageY - 30 + 'px';
                    d3.select(this).attr('opacity', 0.7);
                })
                .on('mouseout', function() {
                    document.getElementById('tooltip').style.display = 'none';
                    d3.select(this).attr('opacity', 1);
                });
            svg.append('g')
                .attr('transform', `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x).ticks(10).tickFormat(d => '$' + d3.format('.0f')(d)));
            
            svg.append('g')
                .attr('transform', `translate(${margin.left},0)`)
                .call(d3.axisLeft(y));
        }

        function createDemographicsChart() {
            const container = document.getElementById('demographicsChart');
            container.innerHTML = '';
            
            const data = d3.rollup(filteredData, v => v.length, d => d.Gender);
            const pieData = Array.from(data, ([key, value]) => ({key, value}));
            
            const width = container.offsetWidth;
            const height = 300;
            const radius = Math.min(width, height) / 2 - 40;
            
            const svg = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', `translate(${width/2},${height/2})`);
            
            const pie = d3.pie()
                .value(d => d.value)
                .sort(null);
            
            const arc = d3.arc()
                .innerRadius(radius * 0.5)
                .outerRadius(radius);
            
            const arcs = svg.selectAll('arc')
                .data(pie(pieData))
                .join('g')
                .attr('class', 'arc');
            
            arcs.append('path')
                .attr('d', arc)
                .attr('fill', d => colors.gender[d.data.key] || '#95a5a6')
                .attr('opacity', 0)
                .transition()
                .duration(800)
                .attr('opacity', 1);
            svg.selectAll('path')
            .on('mouseover', function(event, d) {
            const tooltip = document.getElementById('tooltip');
            const key = d.data.key;      // Gender
            const value = d.data.value;  // Nombre de patients
            tooltip.style.display = 'block';
            tooltip.innerHTML = `<strong>${key}</strong><br>Count: ${value}`;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY - 30 + 'px';
            d3.select(this).attr('opacity', 0.8);
        })
        .on('mouseout', function() {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.display = 'none';
            d3.select(this).attr('opacity', 1);
        });
        const total = d3.sum(pieData, d => d.value);
            arcs.append('text')
                .attr('transform', d => `translate(${arc.centroid(d)})`)
                .attr('text-anchor', 'middle')
                .attr('font-size', '14px')
                .attr('font-weight', 'bold')
                .attr('fill', 'white')
                .text(d => {
        const percent = ((d.data.value / total) * 100).toFixed(1); // arrondi à 1 décimale
        return `${percent}%`;
        });
        }

 function createCorrelationMatrix() {
    const container = document.getElementById('correlationChart');
    container.innerHTML = '';
    
    // Sélection des colonnes numériques
    const numericKeys = ['Age', 'BillingAmount', 'LengthOfStay',];
    const data = filteredData.map(d => {
        const obj = {};
        numericKeys.forEach(k => obj[k] = +d[k] || 0);
        return obj;
    });
    
    // Calcul de la matrice de corrélation (Pearson)
    const corrMatrix = numericKeys.map((key1, i) =>
        numericKeys.map((key2, j) => {
            if (i === j) return 1; // Corrélation parfaite avec soi-même
            
            const x = data.map(d => d[key1]);
            const y = data.map(d => d[key2]);
            const meanX = d3.mean(x);
            const meanY = d3.mean(y);
            
            // Calcul de la covariance
            const cov = d3.sum(x.map((v, idx) => (v - meanX) * (y[idx] - meanY))) / x.length;
            
            // Calcul des écarts-types
            const stdX = Math.sqrt(d3.sum(x.map(v => (v - meanX) ** 2)) / x.length);
            const stdY = Math.sqrt(d3.sum(y.map(v => (v - meanY) ** 2)) / y.length);
            
            // Éviter la division par zéro
            if (stdX === 0 || stdY === 0) return 0;
            
            return cov / (stdX * stdY);
        })
    );
    
    const width = container.offsetWidth;
    const height = 300;
    const margin = { top: 60, right: 20, bottom: 20, left: 60 };
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const xScale = d3.scaleBand()
        .domain(numericKeys)
        .range([margin.left, width - margin.right])
        .padding(0.05);
    
    const yScale = d3.scaleBand()
        .domain(numericKeys)
        .range([margin.top, height - margin.bottom])
        .padding(0.05);
    
    const colorScale = d3.scaleSequential()
        .domain([-1, 1])
        .interpolator(d3.interpolateRdBu);
    
    // Création des cellules
    svg.selectAll('rect')
        .data(corrMatrix.flatMap((row, i) => row.map((value, j) => ({ i, j, value }))))
        .join('rect')
        .attr('x', d => xScale(numericKeys[d.j]))
        .attr('y', d => yScale(numericKeys[d.i]))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.value))
        .on('mouseover', function(event, d) {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.display = 'block';
            tooltip.innerHTML = `<strong>${numericKeys[d.i]} vs ${numericKeys[d.j]}</strong><br>Correlation: ${d.value.toFixed(2)}`;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY - 30 + 'px';
            d3.select(this).attr('stroke', '#000').attr('stroke-width', 2);
        })
        .on('mouseout', function() {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.display = 'none';
            d3.select(this).attr('stroke', null);
        });
    
    // Axes
    const xAxis = d3.axisTop(xScale);
    const yAxis = d3.axisLeft(yScale);
    
    svg.append('g')
        .attr('transform', `translate(0, ${margin.top})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'start');
    
    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(yAxis);
}


    function createConditionStayChart() {
    const container = document.getElementById('conditionStayChart');
    container.innerHTML = '';
    
    // Group data by medical condition and calculate stay statistics
    const data = d3.rollup(
        filteredData,
        v => ({
            avg: d3.mean(v, d => d.LengthOfStay),
            median: d3.median(v, d => d.LengthOfStay),
            count: v.length
        }),
        d => d['Medical Condition']
    );
    
    // Convert to array and sort by average length of stay (descending)
    const chartData = Array.from(data, ([condition, stats]) => ({
        condition: condition,
        avgStay: stats.avg,
        medianStay: stats.median,
        count: stats.count
    }))
    .sort((a, b) => b.avgStay - a.avgStay)
    .slice(0, 8); // Show top 8 conditions
    
    // Set up dimensions
    const width = container.offsetWidth;
    const height = 350;
    const margin = {top: 20, right: 120, bottom: 100, left: 60};
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Create scales
    const x = d3.scaleBand()
        .domain(chartData.map(d => d.condition))
        .range([margin.left, width - margin.right])
        .padding(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => Math.max(d.avgStay, d.medianStay))])
        .nice()
        .range([height - margin.bottom, margin.top]);
    
    // Color palette for bars
    const colors = {
        average: '#667eea',
        median: '#2dd4fe'
    };
    
    // Create average stay bars
    svg.selectAll('rect.avg')
        .data(chartData)
        .join('rect')
        .attr('class', 'avg')
        .attr('x', d => x(d.condition))
        .attr('y', height - margin.bottom)
        .attr('width', x.bandwidth() * 0.45)
        .attr('height', 0)
        .attr('fill', colors.average)
        .attr('opacity', 0.85)
        .transition()
        .duration(800)
        .attr('y', d => y(d.avgStay))
        .attr('height', d => y(0) - y(d.avgStay));
    
    // Create median stay bars
    svg.selectAll('rect.median')
        .data(chartData)
        .join('rect')
        .attr('class', 'median')
        .attr('x', d => x(d.condition) + x.bandwidth() * 0.5)
        .attr('y', height - margin.bottom)
        .attr('width', x.bandwidth() * 0.45)
        .attr('height', 0)
        .attr('fill', colors.median)
        .attr('opacity', 0.85)
        .transition()
        .duration(800)
        .attr('y', d => y(d.medianStay))
        .attr('height', d => y(0) - y(d.medianStay));
    
    // Add tooltips for average bars
    svg.selectAll('rect.avg')
        .on('mouseover', function(event, d) {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.display = 'block';
            tooltip.innerHTML = `
                <strong>${d.condition}</strong><br>
                <span style="color: ${colors.average}">● Average Stay:</span> ${d.avgStay.toFixed(1)} days<br>
                Patients: ${d.count}
            `;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY - 30 + 'px';
            d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function() {
            document.getElementById('tooltip').style.display = 'none';
            d3.select(this).attr('opacity', 0.85);
        });
    
    // Add tooltips for median bars
    svg.selectAll('rect.median')
        .on('mouseover', function(event, d) {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.display = 'block';
            tooltip.innerHTML = `
                <strong>${d.condition}</strong><br>
                <span style="color: ${colors.median}">● Median Stay:</span> ${d.medianStay.toFixed(1)} days<br>
                Patients: ${d.count}
            `;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY - 30 + 'px';
            d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function() {
            document.getElementById('tooltip').style.display = 'none';
            d3.select(this).attr('opacity', 0.85);
        });
    
    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '11px');
    
    // Add Y axis
    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('font-size', '12px');
    
    // Y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height - margin.bottom) / 2)
        .attr('y', margin.left - 45)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .text('Length of Stay (Days)');
    
    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);
    
    // Average legend
    legend.append('rect')
        .attr('width', 20)
        .attr('height', 20)
        .attr('fill', colors.average)
        .attr('opacity', 0.85);
    
    legend.append('text')
        .attr('x', 26)
        .attr('y', 15)
        .text('Average')
        .style('font-size', '12px');
    
    // Median legend
    legend.append('rect')
        .attr('y', 28)
        .attr('width', 20)
        .attr('height', 20)
        .attr('fill', colors.median)
        .attr('opacity', 0.85);
    
    legend.append('text')
        .attr('x', 26)
        .attr('y', 43)
        .text('Median')
        .style('font-size', '12px');
}



function createAdmissionTypePieChart() {
    const container = document.getElementById('admissionTypePieChart');
    container.innerHTML = '';
    
    // Aggregate data by admission type
    const data = d3.rollup(filteredData, v => v.length, d => d['Admission Type']);
    const pieData = Array.from(data, ([key, value]) => ({
        type: key,
        count: value
    }));
    
    // Calculate total for percentage calculations
    const total = d3.sum(pieData, d => d.count);
    
    // Set up dimensions
    const width = container.offsetWidth;
    const height = 350;
    const radius = Math.min(width, height) / 2 - 40;
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width/2},${height/2})`);
    
    // Color scale for admission types
    const colorScale = d3.scaleOrdinal()
        .domain(['Emergency', 'Urgent', 'Elective'])
        .range(['#dc3545', '#ffc107', '#28a745']); // Red, Yellow, Green
    
    // Create pie layout
    const pie = d3.pie()
        .value(d => d.count)
        .sort(null); // Maintain order
    
    // Create arc generator (donut chart)
    const arc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius);
    
    // Arc for hover effect (slightly larger)
    const arcHover = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 1.05);
    
    // Create pie slices
    const arcs = svg.selectAll('arc')
        .data(pie(pieData))
        .join('g')
        .attr('class', 'arc');
    
    // Add paths (pie slices)
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.type))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 150)
        .attr('opacity', 1);
    
    // Add interactivity to paths
    arcs.selectAll('path')
        .on('mouseover', function(event, d) {
            // Expand arc on hover
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arcHover)
                .attr('opacity', 0.9);
            
            // Show tooltip
            const tooltip = document.getElementById('tooltip');
            const percentage = ((d.data.count / total) * 100).toFixed(1);
            tooltip.style.display = 'block';
            tooltip.innerHTML = `
                <strong>${d.data.type}</strong><br>
                Count: ${d.data.count}<br>
                Percentage: ${percentage}%
            `;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY - 30 + 'px';
        })
        .on('mouseout', function() {
            // Return to original size
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arc)
                .attr('opacity', 1);
            
            // Hide tooltip
            document.getElementById('tooltip').style.display = 'none';
        });
    
    // Add percentage labels on slices
    arcs.append('text')
        .attr('transform', d => {
            const [x, y] = arc.centroid(d);
            return `translate(${x},${y})`;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .attr('opacity', 0)
        .text(d => {
            const percentage = ((d.data.count / total) * 100).toFixed(1);
            return `${percentage}%`;
        })
        .transition()
        .duration(800)
        .delay((d, i) => i * 150 + 400)
        .attr('opacity', 1);
    
    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${radius + 20}, ${-radius})`);
    
    pieData.forEach((d, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 30})`);
        
        legendRow.append('rect')
            .attr('width', 20)
            .attr('height', 20)
            .attr('fill', colorScale(d.type))
            .attr('rx', 3);
        
        legendRow.append('text')
            .attr('x', 28)
            .attr('y', 15)
            .text(`${d.type} (${d.count})`)
            .style('font-size', '13px')
            .attr('alignment-baseline', 'middle');
    });
    
    // Add center label (total)
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .attr('y', -10)
        .text(total);
    
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#666')
        .attr('y', 10)
        .text('Total Patients');
}

       function initializeMap() {
            require([
                "esri/Map",
                "esri/views/MapView",
                "esri/Graphic",
                "esri/layers/GraphicsLayer"
            ], function(Map, MapView, Graphic, GraphicsLayer) {
                
                const graphicsLayer = new GraphicsLayer();
                
                map = new Map({
                    basemap: "streets-navigation-vector",
                    layers: [graphicsLayer]
                });
                
                view = new MapView({
                    container: "viewDiv",
                    map: map,
                    center: [-98, 39],
                    zoom: 4
                });
                
                const hospitals = d3.rollup(
                    processedData,
                    v => ({
                        count: v.length,
                        avgBilling: d3.mean(v, d => d.BillingAmount),
                        testResults: d3.rollup(v, vv => vv.length, d => d['Test Results'])
                    }),
                    d => d.Hospital
                );
                
                const hospitalCoords = [
                    {name: "Smith PLC", lat: 40.7, lon: -74.0},
                    {name: "Johnson and Sons", lat: 34.0, lon: -118.2},
                    {name: "Williams Inc", lat: 41.9, lon: -87.6},
                    {name: "Brown Group", lat: 29.8, lon: -95.4},
                    {name: "Davis Ltd", lat: 33.4, lon: -112.1}
                ];
                
                hospitalCoords.forEach(coord => {
                    const stats = hospitals.get(coord.name);
                    if (!stats) return;
                    
                    const point = {
                        type: "point",
                        longitude: coord.lon,
                        latitude: coord.lat
                    };
                    
                    const markerSymbol = {
                        type: "simple-marker",
                        color: [102, 126, 234],
                        size: Math.sqrt(stats.count) * 2,
                        outline: {
                            color: [255, 255, 255],
                            width: 2
                        }
                    };
                    
                    const popupTemplate = {
                        title: coord.name,
                        content: `
                            <b>Patients:</b> ${stats.count}<br>
                            <b>Avg Billing:</b> $${stats.avgBilling.toFixed(2)}<br>
                            <b>Normal:</b> ${stats.testResults.get('Normal') || 0}<br>
                            <b>Abnormal:</b> ${stats.testResults.get('Abnormal') || 0}<br>
                            <b>Inconclusive:</b> ${stats.testResults.get('Inconclusive') || 0}
                        `
                    };
                    
                    const graphic = new Graphic({
                        geometry: point,
                        symbol: markerSymbol,
                        attributes: {hospital: coord.name},
                        popupTemplate: popupTemplate
                    });
                    
                    graphicsLayer.add(graphic);
                });
                
                view.on("click", function(event) {
                    view.hitTest(event).then(function(response) {
                        if (response.results.length) {
                            const graphic = response.results[0].graphic;
                            if (graphic.attributes && graphic.attributes.hospital) {
                                document.getElementById('hospitalFilter').value = graphic.attributes.hospital;
                                applyFilters();
                            }
                        }
                    });
                });
            });
        }