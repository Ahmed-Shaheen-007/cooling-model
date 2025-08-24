// Global variables
let temperatureChart = null;

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    const calculateBtn = document.getElementById('calculate-btn');
    const plotBtn = document.getElementById('plot-btn');
    
    calculateBtn.addEventListener('click', calculateTemperature);
    plotBtn.addEventListener('click', generatePlot);
    
    // Add Enter key support for inputs
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateTemperature();
            }
        });
    });
    
    // Initialize with sample values
    setSampleValues();
});

// Set sample values for demonstration
function setSampleValues() {
    document.getElementById('t0').value = '100';
    document.getElementById('tenv').value = '20';
    document.getElementById('k').value = '0.05';
    document.getElementById('t').value = '30';
}

// Get input values and validate them
function getInputValues() {
    const t0 = parseFloat(document.getElementById('t0').value);
    const tenv = parseFloat(document.getElementById('tenv').value);
    const k = parseFloat(document.getElementById('k').value);
    const t = parseFloat(document.getElementById('t').value);
    
    // Validation
    const errors = [];
    
    if (isNaN(t0)) {
        errors.push('Initial temperature (T₀) must be a valid number');
    }
    
    if (isNaN(tenv)) {
        errors.push('Ambient temperature (T_env) must be a valid number');
    }
    
    if (isNaN(k) || k <= 0) {
        errors.push('Cooling constant (k) must be a positive number');
    }
    
    if (isNaN(t) || t < 0) {
        errors.push('Time (t) must be a non-negative number');
    }
    
    return {
        values: { t0, tenv, k, t },
        errors: errors
    };
}

// Calculate temperature using Newton's Law of Cooling
function calculateTemperatureAtTime(t0, tenv, k, t) {
    // T(t) = T_env + (T_0 - T_env) * e^(-kt)
    return tenv + (t0 - tenv) * Math.exp(-k * t);
}

// Main calculation function
function calculateTemperature() {
    const { values, errors } = getInputValues();
    const resultElement = document.getElementById('result');
    const errorElement = document.getElementById('error');
    
    // Hide previous results
    resultElement.classList.remove('show');
    errorElement.classList.remove('show');
    
    if (errors.length > 0) {
        displayError(errors.join('. '));
        return;
    }
    
    const { t0, tenv, k, t } = values;
    
    try {
        const temperature = calculateTemperatureAtTime(t0, tenv, k, t);
        
        // Check for reasonable results
        if (!isFinite(temperature)) {
            displayError('Calculation resulted in an invalid value. Please check your inputs.');
            return;
        }
        
        displayResult(temperature, t);
        
    } catch (error) {
        displayError('An error occurred during calculation. Please check your inputs.');
        console.error('Calculation error:', error);
    }
}

// Display calculation result
function displayResult(temperature, time) {
    const resultElement = document.getElementById('result');
    resultElement.innerHTML = `
        <strong>T(${time}) = ${temperature.toFixed(2)}°C</strong>
        <br>
        <small>Temperature after ${time} minutes</small>
    `;
    resultElement.classList.add('show');
}

// Display error message
function displayError(message) {
    const errorElement = document.getElementById('error');
    errorElement.innerHTML = `<strong>Error:</strong> ${message}`;
    errorElement.classList.add('show');
}

// Generate plot using Chart.js
function generatePlot() {
    const { values, errors } = getInputValues();
    
    if (errors.length > 0) {
        displayError(errors.join('. '));
        return;
    }
    
    const { t0, tenv, k, t } = values;
    
    // Generate data points for the plot
    const maxTime = Math.max(100, t * 2); // Show at least up to double the input time
    const dataPoints = [];
    const timeStep = maxTime / 100; // 100 data points
    
    for (let time = 0; time <= maxTime; time += timeStep) {
        const temperature = calculateTemperatureAtTime(t0, tenv, k, time);
        dataPoints.push({
            x: time,
            y: temperature
        });
    }
    
    // Add a point for the specific input time
    const specificTemp = calculateTemperatureAtTime(t0, tenv, k, t);
    
    // Destroy existing chart if it exists
    if (temperatureChart) {
        temperatureChart.destroy();
    }
    
    // Create new chart
    const ctx = document.getElementById('temperatureChart').getContext('2d');
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Temperature T(t)',
                data: dataPoints,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.4
            }, {
                label: `T(${t}) = ${specificTemp.toFixed(2)}°C`,
                data: [{
                    x: t,
                    y: specificTemp
                }],
                backgroundColor: '#e74c3c',
                borderColor: '#e74c3c',
                pointRadius: 8,
                pointHoverRadius: 10,
                showLine: false
            }, {
                label: `Ambient Temperature (${tenv}°C)`,
                data: [
                    { x: 0, y: tenv },
                    { x: maxTime, y: tenv }
                ],
                borderColor: '#27ae60',
                backgroundColor: '#27ae60',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Newton\'s Law of Cooling - Temperature vs Time',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#3498db',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `T(${context.parsed.x.toFixed(1)}) = ${context.parsed.y.toFixed(2)}°C`;
                            } else if (context.datasetIndex === 1) {
                                return `Calculated Point: T(${t}) = ${specificTemp.toFixed(2)}°C`;
                            } else {
                                return `Ambient Temperature: ${tenv}°C`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time (minutes)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            elements: {
                point: {
                    radius: 2,
                    hoverRadius: 6
                }
            }
        }
    });
    
    // Scroll to chart
    document.querySelector('.chart-section').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Utility function to format numbers
function formatNumber(num, decimals = 2) {
    return Number(num.toFixed(decimals));
}

// Add some additional interactivity
document.addEventListener('DOMContentLoaded', function() {
    // Add real-time validation feedback
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateInput(this);
        });
    });
});

// Validate individual input
function validateInput(input) {
    const value = parseFloat(input.value);
    const id = input.id;
    
    // Remove existing validation classes
    input.classList.remove('valid', 'invalid');
    
    if (input.value === '') {
        return; // Empty is okay, just don't validate
    }
    
    let isValid = true;
    
    switch(id) {
        case 't0':
        case 'tenv':
        case 't':
            isValid = !isNaN(value);
            if (id === 't' && value < 0) isValid = false;
            break;
        case 'k':
            isValid = !isNaN(value) && value > 0;
            break;
    }
    
    if (isValid) {
        input.classList.add('valid');
    } else {
        input.classList.add('invalid');
    }
}
