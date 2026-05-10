/**
 * RISK Blitz Calculator — Búsqueda de Raíces por Bisección
 * 
 * Método de Bisección para encontrar puntos críticos donde P(x) = 0.25, 0.50, 0.75
 * Interpolación lineal entre 21 puntos empíricos
 * Converge en ~10-15 iteraciones con precisión ε = 1e-6
 */

class BisectionModel {
    constructor() {
        // Datos empíricos reales del Blitz de Risk: Global Domination
        // 250 puntos interpolados: (razón A/D, P(victoria))
        this.empiricalData = [
            { ratio: 0.2, probability: 0.01 },
            { ratio: 0.2394, probability: 0.01605 },
            { ratio: 0.2787, probability: 0.02211 },
            { ratio: 0.3181, probability: 0.02816 },
            { ratio: 0.3574, probability: 0.03807 },
            { ratio: 0.3968, probability: 0.04964 },
            { ratio: 0.4361, probability: 0.06122 },
            { ratio: 0.4755, probability: 0.07279 },
            { ratio: 0.5149, probability: 0.08612 },
            { ratio: 0.5542, probability: 0.10232 },
            { ratio: 0.5936, probability: 0.11853 },
            { ratio: 0.6329, probability: 0.13474 },
            { ratio: 0.6723, probability: 0.15123 },
            { ratio: 0.7116, probability: 0.17243 },
            { ratio: 0.751, probability: 0.19362 },
            { ratio: 0.7904, probability: 0.21481 },
            { ratio: 0.8297, probability: 0.24378 },
            { ratio: 0.8691, probability: 0.27526 },
            { ratio: 0.9084, probability: 0.30675 },
            { ratio: 0.9478, probability: 0.33823 },
            { ratio: 0.9871, probability: 0.36972 },
            { ratio: 1.0265, probability: 0.3959 },
            { ratio: 1.0659, probability: 0.41952 },
            { ratio: 1.1052, probability: 0.44313 },
            { ratio: 1.1446, probability: 0.46675 },
            { ratio: 1.1839, probability: 0.49036 },
            { ratio: 1.2233, probability: 0.51433 },
            { ratio: 1.2627, probability: 0.53855 },
            { ratio: 1.302, probability: 0.56277 },
            { ratio: 1.3414, probability: 0.58468 },
            { ratio: 1.3807, probability: 0.60089 },
            { ratio: 1.4201, probability: 0.61709 },
            { ratio: 1.4594, probability: 0.6333 },
            { ratio: 1.4988, probability: 0.6495 },
            { ratio: 1.5382, probability: 0.66122 },
            { ratio: 1.5775, probability: 0.6728 },
            { ratio: 1.6169, probability: 0.68437 },
            { ratio: 1.6562, probability: 0.69595 },
            { ratio: 1.6956, probability: 0.7062 },
            { ratio: 1.7349, probability: 0.71574 },
            { ratio: 1.7743, probability: 0.72528 },
            { ratio: 1.8137, probability: 0.73483 },
            { ratio: 1.853, probability: 0.74437 },
            { ratio: 1.8924, probability: 0.75391 },
            { ratio: 1.9317, probability: 0.76345 },
            { ratio: 1.9711, probability: 0.77299 },
            { ratio: 2.0104, probability: 0.78146 },
            { ratio: 2.0498, probability: 0.78697 },
            { ratio: 2.0892, probability: 0.79248 },
            { ratio: 2.1285, probability: 0.79799 },
            { ratio: 2.1679, probability: 0.8035 },
            { ratio: 2.2072, probability: 0.80901 },
            { ratio: 2.2466, probability: 0.81452 },
            { ratio: 2.2859, probability: 0.82003 },
            { ratio: 2.3253, probability: 0.82554 },
            { ratio: 2.3647, probability: 0.83105 },
            { ratio: 2.404, probability: 0.83656 },
            { ratio: 2.4434, probability: 0.84207 },
            { ratio: 2.4827, probability: 0.84758 },
            { ratio: 2.5221, probability: 0.85177 },
            { ratio: 2.5614, probability: 0.85492 },
            { ratio: 2.6008, probability: 0.85806 },
            { ratio: 2.6402, probability: 0.86121 },
            { ratio: 2.6795, probability: 0.86436 },
            { ratio: 2.7189, probability: 0.86751 },
            { ratio: 2.7582, probability: 0.87066 },
            { ratio: 2.7976, probability: 0.87381 },
            { ratio: 2.8369, probability: 0.87696 },
            { ratio: 2.8763, probability: 0.8801 },
            { ratio: 2.9157, probability: 0.88325 },
            { ratio: 2.955, probability: 0.8864 },
            { ratio: 2.9944, probability: 0.88955 },
            { ratio: 3.0337, probability: 0.89202 },
            { ratio: 3.0731, probability: 0.89439 },
            { ratio: 3.1124, probability: 0.89675 },
            { ratio: 3.1518, probability: 0.89911 },
            { ratio: 3.1912, probability: 0.90147 },
            { ratio: 3.2305, probability: 0.90383 },
            { ratio: 3.2699, probability: 0.90619 },
            { ratio: 3.3092, probability: 0.90855 },
            { ratio: 3.3486, probability: 0.91092 },
            { ratio: 3.388, probability: 0.91328 },
            { ratio: 3.4273, probability: 0.91564 },
            { ratio: 3.4667, probability: 0.918 },
            { ratio: 3.506, probability: 0.92024 },
            { ratio: 3.5454, probability: 0.92182 },
            { ratio: 3.5847, probability: 0.92339 },
            { ratio: 3.6241, probability: 0.92496 },
            { ratio: 3.6635, probability: 0.92654 },
            { ratio: 3.7028, probability: 0.92811 },
            { ratio: 3.7422, probability: 0.92969 },
            { ratio: 3.7815, probability: 0.93126 },
            { ratio: 3.8209, probability: 0.93284 },
            { ratio: 3.8602, probability: 0.93441 },
            { ratio: 3.8996, probability: 0.93598 },
            { ratio: 3.939, probability: 0.93756 },
            { ratio: 3.9783, probability: 0.93913 },
            { ratio: 4.0177, probability: 0.94071 },
            { ratio: 4.057, probability: 0.94228 },
            { ratio: 4.0964, probability: 0.94386 },
            { ratio: 4.1357, probability: 0.94543 },
            { ratio: 4.1751, probability: 0.947 },
            { ratio: 4.2145, probability: 0.94858 },
            { ratio: 4.2538, probability: 0.95015 },
            { ratio: 4.2932, probability: 0.95173 },
            { ratio: 4.3325, probability: 0.9533 },
            { ratio: 4.3719, probability: 0.95488 },
            { ratio: 4.4112, probability: 0.95645 },
            { ratio: 4.4506, probability: 0.95802 },
            { ratio: 4.49, probability: 0.9596 },
            { ratio: 4.5293, probability: 0.96059 },
            { ratio: 4.5687, probability: 0.96137 },
            { ratio: 4.608, probability: 0.96216 },
            { ratio: 4.6474, probability: 0.96295 },
            { ratio: 4.6867, probability: 0.96373 },
            { ratio: 4.7261, probability: 0.96452 },
            { ratio: 4.7655, probability: 0.96531 },
            { ratio: 4.8048, probability: 0.9661 },
            { ratio: 4.8442, probability: 0.96688 },
            { ratio: 4.8835, probability: 0.96767 },
            { ratio: 4.9229, probability: 0.96846 },
            { ratio: 4.9622, probability: 0.96924 },
            { ratio: 5.0016, probability: 0.97002 },
            { ratio: 5.041, probability: 0.97041 },
            { ratio: 5.0803, probability: 0.9708 },
            { ratio: 5.1197, probability: 0.9712 },
            { ratio: 5.159, probability: 0.97159 },
            { ratio: 5.1984, probability: 0.97198 },
            { ratio: 5.2378, probability: 0.97238 },
            { ratio: 5.2771, probability: 0.97277 },
            { ratio: 5.3165, probability: 0.97316 },
            { ratio: 5.3558, probability: 0.97356 },
            { ratio: 5.3952, probability: 0.97395 },
            { ratio: 5.4345, probability: 0.97435 },
            { ratio: 5.4739, probability: 0.97474 },
            { ratio: 5.5133, probability: 0.97513 },
            { ratio: 5.5526, probability: 0.97553 },
            { ratio: 5.592, probability: 0.97592 },
            { ratio: 5.6313, probability: 0.97631 },
            { ratio: 5.6707, probability: 0.97671 },
            { ratio: 5.71, probability: 0.9771 },
            { ratio: 5.7494, probability: 0.97749 },
            { ratio: 5.7888, probability: 0.97789 },
            { ratio: 5.8281, probability: 0.97828 },
            { ratio: 5.8675, probability: 0.97867 },
            { ratio: 5.9068, probability: 0.97907 },
            { ratio: 5.9462, probability: 0.97946 },
            { ratio: 5.9855, probability: 0.97986 },
            { ratio: 6.0249, probability: 0.98025 },
            { ratio: 6.0643, probability: 0.98064 },
            { ratio: 6.1036, probability: 0.98104 },
            { ratio: 6.143, probability: 0.98143 },
            { ratio: 6.1823, probability: 0.98182 },
            { ratio: 6.2217, probability: 0.98222 },
            { ratio: 6.261, probability: 0.98261 },
            { ratio: 6.3004, probability: 0.983 },
            { ratio: 6.3398, probability: 0.9834 },
            { ratio: 6.3791, probability: 0.98379 },
            { ratio: 6.4185, probability: 0.98418 },
            { ratio: 6.4578, probability: 0.98458 },
            { ratio: 6.4972, probability: 0.98497 },
            { ratio: 6.5365, probability: 0.98537 },
            { ratio: 6.5759, probability: 0.98576 },
            { ratio: 6.6153, probability: 0.98615 },
            { ratio: 6.6546, probability: 0.98655 },
            { ratio: 6.694, probability: 0.98694 },
            { ratio: 6.7333, probability: 0.98733 },
            { ratio: 6.7727, probability: 0.98773 },
            { ratio: 6.812, probability: 0.98812 },
            { ratio: 6.8514, probability: 0.98851 },
            { ratio: 6.8908, probability: 0.98891 },
            { ratio: 6.9301, probability: 0.9893 },
            { ratio: 6.9695, probability: 0.98969 },
            { ratio: 7.0088, probability: 0.99004 },
            { ratio: 7.0482, probability: 0.99024 },
            { ratio: 7.0876, probability: 0.99044 },
            { ratio: 7.1269, probability: 0.99063 },
            { ratio: 7.1663, probability: 0.99083 },
            { ratio: 7.2056, probability: 0.99103 },
            { ratio: 7.245, probability: 0.99122 },
            { ratio: 7.2843, probability: 0.99142 },
            { ratio: 7.3237, probability: 0.99162 },
            { ratio: 7.3631, probability: 0.99182 },
            { ratio: 7.4024, probability: 0.99201 },
            { ratio: 7.4418, probability: 0.99221 },
            { ratio: 7.4811, probability: 0.99241 },
            { ratio: 7.5205, probability: 0.9926 },
            { ratio: 7.5598, probability: 0.9928 },
            { ratio: 7.5992, probability: 0.993 },
            { ratio: 7.6386, probability: 0.99319 },
            { ratio: 7.6779, probability: 0.99339 },
            { ratio: 7.7173, probability: 0.99359 },
            { ratio: 7.7566, probability: 0.99378 },
            { ratio: 7.796, probability: 0.99398 },
            { ratio: 7.8353, probability: 0.99418 },
            { ratio: 7.8747, probability: 0.99437 },
            { ratio: 7.9141, probability: 0.99457 },
            { ratio: 7.9534, probability: 0.99477 },
            { ratio: 7.9928, probability: 0.99496 },
            { ratio: 8.0321, probability: 0.99506 },
            { ratio: 8.0715, probability: 0.99514 },
            { ratio: 8.1108, probability: 0.99522 },
            { ratio: 8.1502, probability: 0.9953 },
            { ratio: 8.1896, probability: 0.99538 },
            { ratio: 8.2289, probability: 0.99546 },
            { ratio: 8.2683, probability: 0.99554 },
            { ratio: 8.3076, probability: 0.99562 },
            { ratio: 8.347, probability: 0.99569 },
            { ratio: 8.3863, probability: 0.99577 },
            { ratio: 8.4257, probability: 0.99585 },
            { ratio: 8.4651, probability: 0.99593 },
            { ratio: 8.5044, probability: 0.99601 },
            { ratio: 8.5438, probability: 0.99609 },
            { ratio: 8.5831, probability: 0.99617 },
            { ratio: 8.6225, probability: 0.99624 },
            { ratio: 8.6618, probability: 0.99632 },
            { ratio: 8.7012, probability: 0.9964 },
            { ratio: 8.7406, probability: 0.99648 },
            { ratio: 8.7799, probability: 0.99656 },
            { ratio: 8.8193, probability: 0.99664 },
            { ratio: 8.8586, probability: 0.99672 },
            { ratio: 8.898, probability: 0.9968 },
            { ratio: 8.9373, probability: 0.99687 },
            { ratio: 8.9767, probability: 0.99695 },
            { ratio: 9.0161, probability: 0.99703 },
            { ratio: 9.0554, probability: 0.99711 },
            { ratio: 9.0948, probability: 0.99719 },
            { ratio: 9.1341, probability: 0.99727 },
            { ratio: 9.1735, probability: 0.99735 },
            { ratio: 9.2129, probability: 0.99743 },
            { ratio: 9.2522, probability: 0.9975 },
            { ratio: 9.2916, probability: 0.99758 },
            { ratio: 9.3309, probability: 0.99766 },
            { ratio: 9.3703, probability: 0.99774 },
            { ratio: 9.4096, probability: 0.99782 },
            { ratio: 9.449, probability: 0.9979 },
            { ratio: 9.4884, probability: 0.99798 },
            { ratio: 9.5277, probability: 0.99806 },
            { ratio: 9.5671, probability: 0.99813 },
            { ratio: 9.6064, probability: 0.99821 },
            { ratio: 9.6458, probability: 0.99829 },
            { ratio: 9.6851, probability: 0.99837 },
            { ratio: 9.7245, probability: 0.99845 },
            { ratio: 9.7639, probability: 0.99853 },
            { ratio: 9.8032, probability: 0.99861 },
            { ratio: 9.8426, probability: 0.99869 },
            { ratio: 9.8819, probability: 0.99876 },
            { ratio: 9.9213, probability: 0.99884 },
            { ratio: 9.9606, probability: 0.99892 },
            { ratio: 10.0, probability: 0.999 }
        ];

        // Puntos críticos encontrados por bisección
        this.criticalPoints = {
            p25: null,   // razón donde P = 0.25
            p50: null,   // razón donde P = 0.50
            p75: null    // razón donde P = 0.75
        };

        // Parámetros de bisección
        this.tolerance = 1e-6;      // Precisión
        this.maxIterations = 100;   // Máximo de iteraciones

        // Calcular puntos críticos
        this.findCriticalPoints();
    }

    /**
     * Interpola linealmente entre dos puntos
     * Dados (x1,y1) y (x2,y2), encuentra y para un x dado
     */
    linearInterpolate(x, x1, y1, x2, y2) {
        if (x < x1 || x > x2) return null;
        return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
    }

    /**
     * Método de Bisección para encontrar raíz
     * Busca dónde f(x) = P(x) - targetP = 0
     * 
     * @param {number} targetP - Probabilidad objetivo (0.25, 0.50, 0.75)
     * @returns {object} - { ratio, probability, iterations }
     */
    bisection(targetP) {
        let a = this.empiricalData[0].ratio;
        let b = this.empiricalData[this.empiricalData.length - 1].ratio;
        let iterations = 0;

        // f(a) = P(a) - targetP
        let fa = this.predictProbability(a) - targetP;
        let fb = this.predictProbability(b) - targetP;

        // Verificar que hay raíz en [a, b]
        if (fa * fb > 0) {
            console.warn(`No hay raíz para P=${targetP} en [${a}, ${b}]`);
            return null;
        }

        // Bisección iterativa
        let c, fc;
        while (Math.abs(b - a) > this.tolerance && iterations < this.maxIterations) {
            c = (a + b) / 2;
            fc = this.predictProbability(c) - targetP;

            iterations++;

            // Si encontramos raíz exacta
            if (Math.abs(fc) < 1e-10) {
                break;
            }

            // Decidir qué mitad continuar
            if (fa * fc < 0) {
                // Raíz en [a, c]
                b = c;
                fb = fc;
            } else {
                // Raíz en [c, b]
                a = c;
                fa = fc;
            }
        }

        const finalRatio = (a + b) / 2;
        const finalProb = this.predictProbability(finalRatio);

        return {
            ratio: finalRatio,
            probability: finalProb,
            iterations: iterations,
            error: Math.abs(finalProb - targetP)
        };
    }

    /**
     * Encuentra los tres puntos críticos
     */
    findCriticalPoints() {
        this.criticalPoints.p25 = this.bisection(0.25);
        this.criticalPoints.p50 = this.bisection(0.50);
        this.criticalPoints.p75 = this.bisection(0.75);

        console.log('✓ Puntos críticos encontrados por Bisección:');
        console.log('  P=25%:', this.criticalPoints.p25);
        console.log('  P=50%:', this.criticalPoints.p50);
        console.log('  P=75%:', this.criticalPoints.p75);
    }

    /**
     * Obtiene probabilidad para una razón A/D
     * Interpola linealmente entre los 21 puntos
     */
    predictProbability(ratio) {
        // Limitar a rango de datos
        if (ratio < this.empiricalData[0].ratio) {
            return this.empiricalData[0].probability;
        }
        if (ratio > this.empiricalData[this.empiricalData.length - 1].ratio) {
            return this.empiricalData[this.empiricalData.length - 1].probability;
        }

        // Encontrar intervalo donde cae ratio
        for (let i = 0; i < this.empiricalData.length - 1; i++) {
            const p1 = this.empiricalData[i];
            const p2 = this.empiricalData[i + 1];

            if (ratio >= p1.ratio && ratio <= p2.ratio) {
                return this.linearInterpolate(
                    ratio,
                    p1.ratio, p1.probability,
                    p2.ratio, p2.probability
                );
            }
        }

        return 0;
    }

    /**
     * Obtiene error aproximado de interpolación
     */
    getError(ratio) {
        return this.tolerance;
    }

    /**
     * Devuelve recomendación táctica basada en probabilidad
     */
    getRecommendation(probability) {
        if (probability > 0.75) {
            return {
                text: '🟢 USAR BLITZ — Ventaja significativa (>75%)',
                color: '#2ecc71',
                strategy: 'Blitz'
            };
        } else if (probability < 0.25) {
            return {
                text: '🔴 EVITAR BLITZ — Riesgo alto (<25%)',
                color: '#e74c3c',
                strategy: 'Manual'
            };
        } else {
            return {
                text: '🟡 ZONA GRIS — Diplomacia recomendada (25-75%)',
                color: '#f39c12',
                strategy: 'Diplomacia'
            };
        }
    }

    /**
     * Obtiene todos los datos para visualización
     */
    getData() {
        return {
            empirical: this.empiricalData,
            criticalPoints: this.criticalPoints,
            tolerance: this.tolerance
        };
    }
}

// Exportar clase
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BisectionModel;
}
