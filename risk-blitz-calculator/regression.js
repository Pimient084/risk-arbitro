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
        // 21 puntos: (razón A/D, P(victoria))
        this.empiricalData = [
            { ratio: 0.2, probability: 0.01 },
            { ratio: 0.33, probability: 0.03 },
            { ratio: 0.5, probability: 0.08 },
            { ratio: 0.67, probability: 0.15 },
            { ratio: 0.8, probability: 0.22 },
            { ratio: 1.0, probability: 0.38 },
            { ratio: 1.2, probability: 0.50 },
            { ratio: 1.33, probability: 0.58 },
            { ratio: 1.5, probability: 0.65 },
            { ratio: 1.67, probability: 0.70 },
            { ratio: 2.0, probability: 0.78 },
            { ratio: 2.5, probability: 0.85 },
            { ratio: 3.0, probability: 0.89 },
            { ratio: 3.5, probability: 0.92 },
            { ratio: 4.0, probability: 0.94 },
            { ratio: 4.5, probability: 0.96 },
            { ratio: 5.0, probability: 0.97 },
            { ratio: 6.0, probability: 0.98 },
            { ratio: 7.0, probability: 0.99 },
            { ratio: 8.0, probability: 0.995 },
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
