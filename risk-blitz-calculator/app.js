/**
 * RISK Blitz Calculator - Application Logic
 * Frontend controller for regression model and UI updates
 */

let regressionModel = null;
let chart = null;

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Inicializa la aplicación
 */
function initializeApp() {
    // Crear modelo de bisección
    regressionModel = new BisectionModel();

    // Configurar event listeners
    setupEventListeners();

    // Renderizar tabla de datos
    renderDataTable();

    // Inicializar gráfico
    initializeChart();

    console.log('✓ RISK Blitz Calculator initialized');
    console.log('Método: Bisección para encontrar puntos críticos');
    console.log('Puntos críticos:', regressionModel.criticalPoints);
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    const troopsAttacker = document.getElementById('troopsAttacker');
    const troopsDefender = document.getElementById('troopsDefender');
    const btnIncAtk = document.getElementById('btnIncAtk');
    const btnDecAtk = document.getElementById('btnDecAtk');
    const btnIncDef = document.getElementById('btnIncDef');
    const btnDecDef = document.getElementById('btnDecDef');
    const btnCalculate = document.getElementById('btnCalculate');

    // Botones de incremento/decremento
    btnIncAtk.addEventListener('click', () => {
        troopsAttacker.value = Math.min(50, parseInt(troopsAttacker.value) + 1);
    });

    btnDecAtk.addEventListener('click', () => {
        troopsAttacker.value = Math.max(1, parseInt(troopsAttacker.value) - 1);
    });

    btnIncDef.addEventListener('click', () => {
        troopsDefender.value = Math.min(50, parseInt(troopsDefender.value) + 1);
    });

    btnDecDef.addEventListener('click', () => {
        troopsDefender.value = Math.max(1, parseInt(troopsDefender.value) - 1);
    });

    // Permitir Enter en campos de entrada
    troopsAttacker.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateAndDisplay();
    });

    troopsDefender.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateAndDisplay();
    });

    // Botón de cálculo
    btnCalculate.addEventListener('click', calculateAndDisplay);

    // Calcular automáticamente al cambiar valores
    troopsAttacker.addEventListener('change', calculateAndDisplay);
    troopsDefender.addEventListener('change', calculateAndDisplay);
}

/**
 * Calcula y muestra los resultados
 */
function calculateAndDisplay() {
    const attackerTroops = parseInt(document.getElementById('troopsAttacker').value) || 1;
    const defenderTroops = parseInt(document.getElementById('troopsDefender').value) || 1;

    // Validar
    if (attackerTroops < 1 || defenderTroops < 1) {
        return;
    }

    // Calcular razón
    const ratio = attackerTroops / defenderTroops;

    // Obtener probabilidad
    const probability = regressionModel.predictProbability(ratio);

    // Obtener recomendación
    const rec = regressionModel.getRecommendation(probability);

    // Obtener error aproximado
    const errorApprox = regressionModel.getError(ratio);

    // Actualizar UI
    const resultCard = document.getElementById('resultCard');
    resultCard.style.display = 'block';

    // Probabilidad
    document.getElementById('probValue').textContent = (probability * 100).toFixed(1);
    document.getElementById('probPercentage').textContent = '%';

    // Recomendación
    const recElement = document.getElementById('recommendation');
    recElement.textContent = rec.text;
    recElement.style.color = rec.color;

    // Métricas
    document.getElementById('metricRatio').textContent = ratio.toFixed(2);
    document.getElementById('metricStrategy').textContent = rec.strategy;

    // Error de interpolación
    const tolerance = regressionModel.tolerance;
    document.getElementById('errorValue').textContent = (tolerance * 100).toFixed(6) + '%';

    // Actualizar punto en gráfico
    updateChartPoint(ratio, probability);
}

/**
 * Inicializa el gráfico de probabilidad
 */
function initializeChart() {
    const ctx = document.getElementById('probabilityChart').getContext('2d');

    // Generar curva de predicción
    const curveData = [];
    for (let x = 0.1; x <= 10; x += 0.1) {
        curveData.push({
            x: x.toFixed(2),
            y: regressionModel.predictProbability(x)
        });
    }

    // Datos empíricos
    const empiricalData = regressionModel.empiricalData.map(d => ({
        x: d.ratio,
        y: d.probability
    }));

    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Curva Ajustada (MMC Grado 3)',
                    type: 'line',
                    data: curveData,
                    borderColor: '#d4af37',
                    borderWidth: 3,
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderDash: [],
                    spanGaps: true
                },
                {
                    label: 'Datos Empíricos (21 puntos)',
                    type: 'scatter',
                    data: empiricalData,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBorderColor: '#fff'
                },
                {
                    label: 'Punto Actual',
                    type: 'scatter',
                    data: [],
                    backgroundColor: '#2ecc71',
                    borderColor: '#27ae60',
                    borderWidth: 3,
                    pointRadius: 8,
                    pointHoverRadius: 10
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#e8eef5',
                        font: {
                            family: "'Rajdhani', sans-serif",
                            size: 12
                        },
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 21, 53, 0.9)',
                    borderColor: '#d4af37',
                    borderWidth: 1,
                    bodyColor: '#e8eef5',
                    titleColor: '#d4af37',
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0) {
                                return `P(victoria): ${(context.parsed.y * 100).toFixed(2)}%`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0,
                    max: 10,
                    grid: {
                        color: 'rgba(212, 175, 55, 0.1)',
                        drawBorder: true
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            family: "'Rajdhani', monospace",
                            size: 11
                        }
                    },
                    title: {
                        display: true,
                        text: 'Razón Atacante/Defensor',
                        color: '#d4af37',
                        font: {
                            family: "'Cinzel', serif",
                            size: 13,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    grid: {
                        color: 'rgba(212, 175, 55, 0.1)'
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            family: "'Rajdhani', monospace"
                        },
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Probabilidad de Victoria',
                        color: '#d4af37',
                        font: {
                            family: "'Cinzel', serif",
                            size: 13,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

/**
 * Actualiza el punto actual en el gráfico
 */
function updateChartPoint(ratio, probability) {
    if (!chart) return;

    chart.data.datasets[2].data = [{ x: ratio, y: probability }];
    chart.update();
}

/**
 * Renderiza la tabla de datos empíricos
 */
function renderDataTable() {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';

    const data = regressionModel.getData();

    for (let i = 0; i < data.empirical.length; i++) {
        const emp = data.empirical[i];
        const pred = regressionModel.predictProbability(emp.ratio);
        const error = Math.abs(emp.probability - pred);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.ratio.toFixed(2)}</td>
            <td>${(emp.probability * 100).toFixed(2)}%</td>
            <td>${(pred * 100).toFixed(2)}%</td>
            <td>${(error * 100).toFixed(3)}%</td>
        `;

        tbody.appendChild(row);
    }

    // Mostrar información de puntos críticos
    const tolerance = regressionModel.tolerance;
    document.getElementById('ecmValue').textContent = (tolerance * 100).toFixed(6) + '% (precisión de bisección)';
}
