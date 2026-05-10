# ⚔️ RISK ARBITER — Documentación Técnica

## Sistema Integrado de Arbitraje para Risk: Global Domination

Un **árbitro digital** que automatiza el cálculo de refuerzos y proporciona análisis probabilístico para el modo Blitz. Sistema basado en:
- **Lógica de estado** — GameArbiter (gestión de jugadores y territorios)
- **Análisis probabilístico** — BisectionModel (búsqueda de raíces numéricas)
- **Interfaz tab-based** — 4 módulos integrados (Jugadores, Refuerzos, Blitz, Reglas)

---

## Despliegue en GitHub Pages

Este repo publica el contenido de la carpeta `risk-blitz-calculator/` mediante GitHub Pages.

Pasos:
1. En GitHub, abre **Settings → Pages**.
2. En **Build and deployment**, selecciona **GitHub Actions**.
3. Haz push a `main` y espera el workflow **Deploy GitHub Pages**.

La URL quedara como:
`https://<usuario>.github.io/<repo>/`

---

## I. LÓGICA DE REFUERZOS — GameArbiter

### A. Ecuación Principal de Refuerzos

La fórmula base de Risk se implementa como:

$$T(t) = \max(3, \lfloor n_T / 3 \rfloor) + \sum_{c} B_c + B_{cartas}$$

Donde:
- $T(t)$ = Tropas disponibles en turno $t$
- $n_T$ = Número de territorios bajo control
- $B_c$ = Bonificación de continentes controlados completamente
- $B_{cartas}$ = Bonificación por conjuntos de cartas canjeados
- $\max(3, \cdot)$ = Mínimo de 3 tropas garantizado

### B. Bonificación de Territorios

Componente base (sin mínimo):

$$R_{terr}(n_T) = \lfloor n_T / 3 \rfloor$$

Ejemplos:
- 5 territorios → $\lfloor 5/3 \rfloor = 1$ tropa
- 10 territorios → $\lfloor 10/3 \rfloor = 3$ tropas
- 20 territorios → $\lfloor 20/3 \rfloor = 6$ tropas
- 42 territorios (máx) → $\lfloor 42/3 \rfloor = 14$ tropas

**Implementación:**
```javascript
const territorialBase = Math.floor(territoriesControlled / 3);
const territorialBonus = Math.max(3, territorialBase);
```

### C. Bonificación de Continentes

Función discreta con 6 posibles valores (un continente por control completo):

$$B_c = \sum_{i=1}^{k} \text{bonus}(continente_i)$$

Donde $k$ = número de continentes bajo control completo.

**Tabla de bonificaciones:**

| Continente | Territorios | Bonificación |
|-----------|-------------|--------------|
| Norteamérica | 9 | +5 |
| Sudamérica | 4 | +2 |
| Europa | 7 | +5 |
| África | 6 | +3 |
| Asia | 12 | +7 |
| Australia | 4 | +2 |

**Lógica:**
```javascript
const continentBonusMap = {
  'NA': 5,   // Norteamérica
  'SA': 2,   // Sudamérica
  'EU': 5,   // Europa
  'AF': 3,   // África
  'AS': 7,   // Asia
  'AU': 2    // Australia
};

let continentTotal = 0;
for (const continent of continentsControlled) {
  continentTotal += continentBonusMap[continent];
}
```

**Nota:** La verificación de control completo es manual (checkboxes en la UI). El sistema no valida automáticamente si el jugador tiene todos los territorios; depende de la integridad del usuario.

### D. Bonificación de Cartas

Función escalonada basada en conjuntos canjeables:

$$B_{cartas}(s) = \begin{cases}
0 & \text{si } s = 0 \\
2 & \text{si } s = 1 \\
5 & \text{si } s = 2 \\
10 & \text{si } s = 3 \\
15 & \text{si } s = 4 \\
20 & \text{si } s \geq 5
\end{cases}$$

Donde $s$ = número de conjuntos válidos de 3+ cartas.

**Implementación:**
```javascript
const cardBonusMap = {
  0: 0,
  1: 2,
  2: 5,
  3: 10,
  4: 15,
  5: 20
};

const cardBonus = cardBonusMap[cardSets] || 20;
```

### E. Ejemplo Completo

**Escenario:** Jugador controla:
- 18 territorios
- Norteamérica (NA) y Australia (AU) completamente
- 2 conjuntos de cartas válidos

**Cálculo:**

$$T = \max(3, \lfloor 18/3 \rfloor) + (5 + 2) + 5 = \max(3, 6) + 7 + 5 = 6 + 7 + 5 = 18 \text{ tropas}$$

---

## II. ESTIMACIÓN PROBABILÍSTICA — BisectionModel

### A. Modelo de Datos Empíricos

El sistema utiliza 21 puntos de datos extraídos del engine de Risk: Global Domination para el modo Blitz:

$$\mathcal{D} = \{(r_i, P_i) : i = 1, 2, ..., 21\}$$

Donde:
- $r_i$ = ratio atacante/defensor = $\text{tropas\_atacante} / \text{tropas\_defensor}$
- $P_i$ = probabilidad empírica de victoria para el atacante

**Muestra de datos (primeros 5 puntos):**

| Ratio (r) | Probabilidad (P) |
|----------|-----------------|
| 0.2 | 0.047 |
| 0.4 | 0.088 |
| 0.6 | 0.125 |
| 0.8 | 0.165 |
| 1.0 | 0.211 |
| ... | ... |
| 5.0 | 0.999 |

**Propiedades:**
- Rango de r: [0.2, 5.0]
- Rango de P: [0.047, 0.999]
- Función monótona creciente (a mayor ratio, mayor probabilidad)
- Asintótica a 1.0 cuando r → ∞

### B. Interpolación Lineal

Para cualquier ratio $r$ entre dos puntos de datos $(r_j, P_j)$ y $(r_{j+1}, P_{j+1})$:

$$\hat{P}(r) = P_j + \frac{r - r_j}{r_{j+1} - r_j} \cdot (P_{j+1} - P_j)$$

**Ejemplo numérico:**
- Dados: $(r_j, P_j) = (1.0, 0.211)$ y $(r_{j+1}, P_{j+1}) = (1.2, 0.251)$
- Para $r = 1.1$:

$$\hat{P}(1.1) = 0.211 + \frac{1.1 - 1.0}{1.2 - 1.0} \cdot (0.251 - 0.211) = 0.211 + \frac{0.1}{0.2} \cdot 0.040 = 0.211 + 0.020 = 0.231$$

**Implementación:**
```javascript
function linearInterpolate(x, x1, y1, x2, y2) {
  return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
}

function predictProbability(ratio) {
  // Encuentra dos puntos que rodean el ratio
  let lower = empiricalData[0];
  let upper = empiricalData[0];
  
  for (let i = 0; i < empiricalData.length - 1; i++) {
    if (empiricalData[i].ratio <= ratio && ratio <= empiricalData[i + 1].ratio) {
      lower = empiricalData[i];
      upper = empiricalData[i + 1];
      break;
    }
  }
  
  return linearInterpolate(ratio, lower.ratio, lower.probability, 
                          upper.ratio, upper.probability);
}
```

### C. Búsqueda por Bisección — Encontrar Probabilidades Críticas

**Problema:** Dado un valor objetivo de probabilidad $P^*$ (ej: 0.75 = 75%), encontrar el ratio crítico $r^*$ donde:

$$P(r^*) = P^*$$

**Solución:** Método de bisección iterativo que explota la monotonía de P(r).

**Algoritmo:**

```
Entrada: P* ∈ (0, 1), tolerancia ε, máximo de iteraciones MAX
Salida: r* tal que |P(r*) - P*| < ε

1. Inicializar: r_bajo = 0.2,  r_alto = 5.0
2. Para i = 1 hasta MAX:
     r_medio = (r_bajo + r_alto) / 2
     P_medio = predictProbability(r_medio)
     error = |P_medio - P*|
     
     Si error < ε:
       Retornar r_medio
     Si P_medio < P*:
       r_bajo = r_medio  (necesitamos r más alto)
     Si P_medio > P*:
       r_alto = r_medio  (necesitamos r más bajo)
3. Retornar r_medio (mejor aproximación alcanzada)
```

**Complejidad:** O(log n) donde n = (r_alto - r_bajo) / ε

Con $\epsilon = 10^{-6}$ y rango [0.2, 5.0], converge en ~15-20 iteraciones.

**Implementación:**
```javascript
function bisection(targetProbability, tolerance = 1e-6, maxIterations = 100) {
  let rLow = 0.2;
  let rHigh = 5.0;
  let iterations = 0;
  
  for (let i = 0; i < maxIterations; i++) {
    const rMid = (rLow + rHigh) / 2;
    const pMid = this.predictProbability(rMid);
    const error = Math.abs(pMid - targetProbability);
    
    iterations++;
    
    if (error < tolerance) {
      return { ratio: rMid, probability: pMid, iterations, error };
    }
    
    if (pMid < targetProbability) {
      rLow = rMid;  // P muy baja, aumentar ratio
    } else {
      rHigh = rMid; // P muy alta, disminuir ratio
    }
  }
  
  // Retorna mejor aproximación si no converge exactamente
  const rMid = (rLow + rHigh) / 2;
  const pMid = this.predictProbability(rMid);
  return { ratio: rMid, probability: pMid, iterations, error: Math.abs(pMid - targetProbability) };
}
```

### D. Puntos Críticos — Umbral de Decisión

El sistema calcula tres puntos críticos que definen la estrategia:

$$\begin{align}
r_{25\%} &= \text{ratio donde } P(r_{25\%}) = 0.25 \text{ (muy riesgoso)}\\
r_{50\%} &= \text{ratio donde } P(r_{50\%}) = 0.50 \text{ (equilibrio)}\\
r_{75\%} &= \text{ratio donde } P(r_{75\%}) = 0.75 \text{ (favorable)}
\end{align}$$

**Ejemplo de salida:**
```javascript
{
  "critical_points": {
    "risk_25_percent": { ratio: 0.55, probability: 0.25, iterations: 16 },
    "balanced_50_percent": { ratio: 1.10, probability: 0.50, iterations: 18 },
    "favorable_75_percent": { ratio: 2.20, probability: 0.75, iterations: 15 }
  }
}
```

**Interpretación:** Para ganar con >75% de confianza, el atacante necesita al menos 2.2x de tropas que el defensor.

### E. Función de Recomendación

Estrategia basada en la probabilidad calculada:

$$\text{Recomendación}(P) = \begin{cases}
\text{NO ATACAR} & \text{si } P < 0.40\\
\text{DIPLOMACIA} & \text{si } 0.40 \leq P < 0.60\\
\text{BLITZ} & \text{si } P \geq 0.60
\end{cases}$$

---

## III. ARQUITECTURA DE CLASES

### A. GameArbiter (`arbiter.js`)

**Responsabilidades:**
- Gestión de estado de jugadores
- Cálculo de refuerzos según fórmula oficial
- Consultas sobre estados de juego

**Estructura interna:**

```javascript
class GameArbiter {
  constructor() {
    this.players = [];           // Array de objetos jugador
    this.continents = {
      'NA': { name: 'Norteamérica', bonus: 5, territories: 9 },
      'SA': { name: 'Sudamérica', bonus: 2, territories: 4 },
      'EU': { name: 'Europa', bonus: 5, territories: 7 },
      'AF': { name: 'África', bonus: 3, territories: 6 },
      'AS': { name: 'Asia', bonus: 7, territories: 12 },
      'AU': { name: 'Australia', bonus: 2, territories: 4 }
    };
    this.cardBonus = { 0: 0, 1: 2, 2: 5, 3: 10, 4: 15, 5: 20 };
  }
}
```

**Métodos principales:**

| Método | Entrada | Salida | Lógica |
|--------|---------|--------|--------|
| `addPlayer(name, color)` | string, string | {id, name, color, territories: 0, ...} | Genera ID único, inicializa jugador |
| `calculateReinforcements(playerId, territories, continents[], cards)` | id, int, [string], int | {total, breakdown{}, ...} | Aplica fórmula principal (máx, piso, suma) |
| `removePlayer(playerId)` | id | void | Filtra jugador del array |
| `getPlayer(playerId)` | id | {jugador} | Búsqueda por ID |
| `controlsContinentCompletely(playerId, continent)` | id, string | boolean | Verifica presencia en array continents[] del jugador |
| `getAllPlayers()` | void | [{jugador+refuerzos}] | Mapea cada jugador + cálculos |
| `getGameStats()` | void | {totalPlayers, territoriosAsignados, continentesControlados} | Agregación de estado |

### B. BisectionModel (`regression.js`)

**Responsabilidades:**
- Interpolación entre datos empíricos
- Búsqueda numérica de puntos críticos
- Recomendaciones tácticas

**Estructura interna:**

```javascript
class BisectionModel {
  constructor() {
    this.empiricalData = [
      { ratio: 0.2, probability: 0.047 },
      { ratio: 0.4, probability: 0.088 },
      // ... 19 más ...
      { ratio: 5.0, probability: 0.999 }
    ];
  }
}
```

**Métodos principales:**

| Método | Entrada | Salida | Lógica |
|--------|---------|--------|--------|
| `linearInterpolate(x, x1, y1, x2, y2)` | float, float, float, float, float | float | Calc: $y = y_1 + (x-x_1)/(x_2-x_1) \cdot (y_2-y_1)$ |
| `predictProbability(ratio)` | float | float | Busca intervalo, interpola |
| `bisection(targetP)` | float | {ratio, probability, iterations, error} | Bisección iterativa O(log n) |
| `findCriticalPoints()` | void | {25%, 50%, 75%} | Llama bisection(0.25), (0.50), (0.75) |
| `getRecommendation(probability)` | float | {text, color, strategy} | Mapeo P→estrategia |
| `getData()` | void | {empiricalData, criticalPoints} | Retorna todo para visualización |

---

## IV. FLUJO DE DATOS — Ejemplo Completo

**Usuario:** Quiere calcular refuerzos para Jugador "Alice" con 15 territorios, NA+EU, 2 conjuntos de cartas.

### Paso 1: GameArbiter.calculateReinforcements()

```javascript
// Entrada
playerId = "player_123"
territories = 15
continentsControlled = ['NA', 'EU']
cardSets = 2

// Cálculos internos
territorialBase = floor(15 / 3) = 5
territorialBonus = max(3, 5) = 5

continentBonus = 5 (NA) + 5 (EU) = 10

cardBonus = cardBonusMap[2] = 5

// Resultado
total = 5 + 10 + 5 = 20 tropas

breakdown = {
  territories: 5,
  continents: 10,
  cards: 5
}
```

### Paso 2: Aplicación en UI

- Display: "20 tropas disponibles"
- Desglose mostrado: [5 + 10 + 5]
- Jugador listo para colocar tropas en fase de refuerzo

---

## V. PARÁMETROS DE CONFIGURACIÓN

### Tolerancia de Bisección

```javascript
const BISECTION_TOLERANCE = 1e-6;  // ±0.0001% en probabilidad
const MAX_BISECTION_ITERATIONS = 100;
```

**Efecto:** Aumentar tolerancia = menos iteraciones, menos precisión.

### Rango de Interpolación

```javascript
const RATIO_MIN = 0.2;  // 1 atacante vs 5 defensores mínimo
const RATIO_MAX = 5.0;  // 5 atacantes vs 1 defensor máximo
```

Valores fuera de este rango usan extrapolación (no recomendado en Risk).

### Umbrales de Recomendación

```javascript
const THRESHOLD_NO_ATTACK = 0.40;
const THRESHOLD_DIPLOMACY = 0.60;
const THRESHOLD_BLITZ = 1.00;
```

Personalizables según dificultad/estilo de juego.

---

## VI. VALIDACIONES Y LIMITACIONES

### Validaciones Implementadas

✅ **Mínimo de 3 tropas** — La fórmula de referencia de tropas garantiza el mínimo (no puede caer por debajo).

✅ **División entera de territorios** — Piso matemático evita fraccionales.

✅ **Bonificación discreta de cartas** — Mapeo directo previene valores inválidos.

### Limitaciones Conocidas

❌ **Control de continentes manual** — El sistema no valida si el jugador tiene todos los 9/4/7/6/12/4 territorios respectivos. Depende de la integridad del usuario.

❌ **Sin persistencia** — Actualizar navegador = pérdida de datos. Sin localStorage implementado.

❌ **Extrapolación en Blitz** — Ratios fuera de [0.2, 5.0] pueden dar resultados imprecisos.

❌ **Sin historial de turnos** — No rastrea evolución de refuerzos a lo largo del tiempo.

---

## VII. FÓRMULAS RESUMIDAS

### Refuerzos Completos

$$T_{final} = \max\left(3, \left\lfloor \frac{n_T}{3} \right\rfloor\right) + \left(\sum_{c \in C} B_c\right) + f_{cartas}(s)$$

### Probabilidad Blitz (Interpolación)

$$\hat{P}(r) = P_i + \frac{r - r_i}{r_{i+1} - r_i}(P_{i+1} - P_i) \quad \text{donde} \quad r_i \leq r \leq r_{i+1}$$

### Punto Crítico (Bisección)

$$\text{Encuentra } r^* \text{ tal que } |P(r^*) - P^*| < \epsilon$$

---

## VIII. CÓMO USAR

**1. Pestaña Jugadores:**
- Ingresa nombre (ej: "Alice")
- Selecciona color
- Haz clic en "Agregar"
- Aparece en lista con contador de refuerzos (0 inicialmente)

**2. Pestaña Refuerzos:**
- Selecciona Jugador
- Ingresa territorios (1-42)
- Marca continentes controlados (máx 6)
- Ingresa conjuntos de cartas (0-5+)
- Haz clic en "Calcular Refuerzos"
- Ve desglose: [terr + cont + cartas = total]

**3. Pestaña Blitz:**
- Ingresa tropas atacante
- Ingresa tropas defensor
- Haz clic en "Calcular Probabilidad"
- Ve recomendación (NO ATACAR / DIPLOMACIA / BLITZ) con color indicador

**4. Pestaña Reglas:**
- Referencia rápida sin dejar el sistema
1. **Pestaña "Jugadores"** — Registra los n jugadores del turno
2. **Pestaña "Refuerzos"** — Selecciona jugador activo, marca continentes, calcula
3. **Pestaña "Blitz"** — Antes de atacar: ingresa tropas, ve recomendación
4. **Pestaña "Reglas"** — Consulta rápida si hay duda

### En el Navegador
```bash
# Abre arbiter.html en navegador (Chrome, Firefox, Edge)
open arbiter.html
```

**Requisitos:**
- Navegador con soporte ES6+
- Chart.js (CDN incluido)
- Sin backend, completamente local

---

## 🔬 Método Numérico: Bisección

Para el estimador de Blitz, usamos **búsqueda de raíces por bisección**, que:

✅ Encuentra exactamente dónde P(victoria) cruza 25%, 50%, 75%  
✅ Converge en ~10-15 iteraciones (O(log n))  
✅ Usa interpolación lineal directa (sin polinomios complejos)  
✅ Rápido (<1ms) y preciso (ε = 10⁻⁶)

**Algoritmo:**
```
1. Intervalo [a, b] con f(a)·f(b) < 0
2. c = (a+b)/2
3. Si f(c) ≈ 0: ¡encontrada raíz!
4. Si f(a)·f(c) < 0: busca en [a,c] sino en [c,b]
5. Repetir hasta |b-a| < ε
```

---

## 🎨 Interfaz

- **Paleta:** Negro/Dorado (militar, histórico)
- **Tipografía:** Cinzel (títulos, serif), Rajdhani (datos, monospace)
- **Animaciones:** Tabs suaves, resultado con fadeIn
- **Responsive:** Diseño adaptable a móvil/tablet

---

## 📝 Archivos

| Archivo | Propósito |
|---------|-----------|
| `arbiter.html` | Interfaz principal con 4 pestañas |
| `styles-arbiter.css` | Diseño completo (2000+ líneas) |
| `arbiter.js` | Lógica de árbitro y cálculos |
| `app-arbiter.js` | Controlador de eventos y interfaz |
| `regression.js` | Modelo Blitz (Bisección) |
| `index.html` | Versión anterior (solo Blitz) |

---

## 🎓 Aprendizaje

Este proyecto demuestra:
1. **Arquitectura modular** — Clases independientes reutilizables
2. **Métodos numéricos** — Bisección para encontrar raíces
3. **UI responsivo** — Tabs, formularios, actualización dinámica
4. **Lógica de dominio** — Reglas de Risk implementadas fielmente
5. **Control de eventos** — Listeners organizados por sección

---

## 🚀 Futuras Mejoras

- [ ] Historial de turnos/ataques
- [ ] Exportar estado del juego a JSON
- [ ] Modo "Inicio de partida" (distribuir territorios iniciales)
- [ ] Animación de Bisección paso-a-paso
- [ ] Guardado en localStorage
- [ ] Modo oscuro/claro

---

**Creado para jugadores que quieren menos contabilidad, más estrategia.** ⚔️

¿Preguntas? Revisa las pestañas "Reglas" e "Información" en la interfaz.

