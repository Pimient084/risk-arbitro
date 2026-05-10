/**
 * RISK Arbiter — Application Controller
 * Gestiona eventos, lógica de interfaz y coordinación entre módulos
 */

/**
 * ==================== CLASE: WHEEL SPINNER ====================
 * Ruleta interactiva que respeta las probabilidades de Blitz
 */
class WheelSpinner {
    constructor(canvasId, probability = 0.5) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.probability = probability;
        this.pointerAngle = -Math.PI / 2;
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 0;
        this.displaySize = 0;
        this.currentRotation = 0;
        this.spinStartRotation = 0;
        this.isSpinning = false;
        this.spinResult = null;
        this.lockedProbability = null;
        this.spinStartTime = null;
        this.spinDuration = 2500; // 2.5 segundos

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.draw();
    }

    /**
     * Ajusta el canvas al tamano disponible y mantiene aspecto cuadrado
     */
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const fallbackSize = 320;
        const width = rect.width || this.canvas.parentElement?.clientWidth || fallbackSize;
        const height = rect.height || width || fallbackSize;
        const size = Math.max(1, Math.floor(Math.min(width, height)));
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = Math.floor(size * dpr);
        this.canvas.height = Math.floor(size * dpr);
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.displaySize = size;
        this.centerX = size / 2;
        this.centerY = size / 2;
        this.radius = Math.max(10, Math.min(this.centerX, this.centerY) - 14);

        this.draw();
    }

    /**
     * Dibuja la ruleta con dos sectores: éxito (rojo) y fallo (gris)
     */
    draw() {
        const ctx = this.ctx;
        const cx = this.centerX;
        const cy = this.centerY;
        const r = this.radius;
        const displayProbability = this.isSpinning && this.lockedProbability !== null
            ? this.lockedProbability
            : this.probability;

        // Limpiar canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.displaySize, this.displaySize);

        // Guardar estado
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.currentRotation);

        // Sector de ÉXITO (rojo) — ángulo proporcional a probabilidad
        const successAngle = displayProbability * 2 * Math.PI;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, successAngle);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Sector de FALLO (gris) — resto del círculo
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.arc(0, 0, r, successAngle, 2 * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Borde de la ruleta
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, 2 * Math.PI);
        ctx.stroke();

        // Línea divisoria
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(successAngle) * r, Math.sin(successAngle) * r);
        ctx.stroke();

        // Pointer (flecha en la parte superior)
        ctx.restore();
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r - 14);
        ctx.lineTo(cx - 10, cy - r + 2);
        ctx.lineTo(cx + 10, cy - r + 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Mostrar porcentaje de probabilidad en el centro
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 18px IBM Plex Sans';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${(displayProbability * 100).toFixed(0)}%`, cx, cy);
    }

    /**
     * Inicia el giro de la ruleta
     */
    spin(probability = this.probability) {
        if (this.isSpinning) return;

        this.probability = Math.max(0, Math.min(1, probability));
        this.lockedProbability = this.probability;
        this.isSpinning = true;
        this.spinResult = null;
        this.spinStartTime = Date.now();
        this.spinStartRotation = this.currentRotation;

        const messageElement = document.getElementById('wheelResultMessage');
        messageElement.style.display = 'none';

        // Determinar resultado basado en random y probabilidad
        const random = Math.random();
        this.spinResult = random < probability;

        // Calcular ángulo final basado en resultado
        // Si es exitoso: debe terminar en sector rojo (0 a successAngle)
        // Si es fallido: debe terminar en sector gris (successAngle a 2π)
        const successAngle = this.lockedProbability * 2 * Math.PI;
        let finalAngle;

        if (this.spinResult) {
            // Terminar en sector rojo: aleatorio dentro de [0, successAngle]
            finalAngle = Math.random() * successAngle;
        } else {
            // Terminar en sector gris: aleatorio dentro de [successAngle, 2π]
            finalAngle = successAngle + Math.random() * (2 * Math.PI - successAngle);
        }

        const normalizedCurrent = this.normalizeAngle(this.currentRotation);
        const normalizedTarget = this.normalizeAngle(this.pointerAngle - finalAngle);
        let delta = normalizedTarget - normalizedCurrent;
        if (delta < 0) delta += 2 * Math.PI;

        // Agregar 3-5 vueltas completas para que gire de verdad
        const fullRotations = (3 + Math.random() * 2) * 2 * Math.PI;
        this.targetRotation = this.currentRotation + fullRotations + delta;

        // Iniciar animación
        this.animateSpin();
    }

    /**
     * Anima el giro con easing suave (easingOutQuad)
     */
    animateSpin() {
        if (!this.isSpinning) return;

        const elapsed = Date.now() - this.spinStartTime;
        const progress = Math.min(elapsed / this.spinDuration, 1);

        // Easing out quad: t = 1 - (1-t)^2
        const easeProgress = 1 - Math.pow(1 - progress, 2);

        // Interpolar entre rotación actual y target
        this.currentRotation = this.spinStartRotation +
            (this.targetRotation - this.spinStartRotation) * easeProgress;

        this.draw();

        if (progress < 1) {
            requestAnimationFrame(() => this.animateSpin());
        } else {
            this.isSpinning = false;
            this.currentRotation = this.targetRotation % (2 * Math.PI);
            this.lockedProbability = null;
            this.draw();
            this.showResult();
        }
    }

    /**
     * Muestra el resultado del giro
     */
    showResult() {
        const messageElement = document.getElementById('wheelResultMessage');
        const probability = this.lockedProbability !== null
            ? this.lockedProbability
            : this.probability;
        const successAngle = probability * 2 * Math.PI;
        const pointerOnWheel = this.normalizeAngle(this.pointerAngle - this.currentRotation);
        const isSuccess = pointerOnWheel <= successAngle;

        this.spinResult = isSuccess;

        if (isSuccess) {
            messageElement.textContent = '🎯 ¡ATAQUE EXITOSO! 🎯';
            messageElement.style.color = '#2ecc71';
        } else {
            messageElement.textContent = '❌ Ataque fallido ❌';
            messageElement.style.color = '#e74c3c';
        }
        messageElement.style.display = 'block';
    }

    normalizeAngle(angle) {
        const tau = 2 * Math.PI;
        return ((angle % tau) + tau) % tau;
    }
}

let arbiter = null;
let blitzModel = null;
let wheelSpinner = null;

// Estado de la interfaz
const uiState = {
    activePlayerId: null,
    territoriesInput: 5,
    continentsSelected: [],
    lastProbability: null
};

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    initializeArbiter();
});

/**
 * Inicializa la aplicación del árbitro
 */
function initializeArbiter() {
    // Crear instancias
    arbiter = new GameArbiter();
    blitzModel = new BisectionModel();

    // Configurar event listeners
    setupTabNavigation();
    setupPlayerSection();
    setupReinforcementSection();
    setupBlitzSection();

    console.log('✓ RISK Arbiter initialized');
}

/**
 * Configura la navegación por pestañas
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // Desactivar todas las pestañas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activar pestaña seleccionada
            button.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');

            if (tabName === 'blitz' && wheelSpinner) {
                requestAnimationFrame(() => wheelSpinner.resizeCanvas());
            }
        });
    });
}

/**
 * ==================== SECCIÓN: JUGADORES ====================
 */
function setupPlayerSection() {
    const btnAdd = document.getElementById('btnAddPlayer');
    const inputName = document.getElementById('playerName');
    const selectColor = document.getElementById('playerColor');

    btnAdd.addEventListener('click', () => {
        const name = inputName.value.trim();
        const color = selectColor.value;

        if (!name) {
            alert('Ingresa el nombre del jugador');
            return;
        }

        const player = arbiter.addPlayer(name, color);
        if (player) {
            inputName.value = '';
            renderPlayersList();
            updatePlayerCountBadge();
            updateReinforcementsPlayersSelect();
        }
    });

    inputName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnAdd.click();
    });
}

/**
 * Renderiza la lista de jugadores
 */
function renderPlayersList() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';

    arbiter.getAllPlayers().forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';

        const reinforcementInfo = player.reinforcementInfo || { total: 0 };
        const totalTroops = reinforcementInfo.total;

        card.innerHTML = `
            <div class="player-card-name">${player.name}</div>
            <div class="player-card-color">${player.color.charAt(0).toUpperCase() + player.color.slice(1)}</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                <div>Territorios: ${player.territories || 0}</div>
                <div>Refuerzos: <strong>${totalTroops}</strong></div>
            </div>
            <button class="player-card-remove" onclick="removePlayer(${player.id})">Quitar</button>
        `;

        playersList.appendChild(card);
    });
}

/**
 * Elimina un jugador
 */
function removePlayer(playerId) {
    if (confirm('Quieres quitar este jugador?')) {
        arbiter.removePlayer(playerId);
        renderPlayersList();
        updatePlayerCountBadge();
        updateReinforcementsPlayersSelect();
    }
}

/**
 * Actualiza el badge de cantidad de jugadores
 */
function updatePlayerCountBadge() {
    const count = arbiter.players.length;
    document.getElementById('playercount').textContent = `Jugadores: ${count}`;
}

/**
 * ==================== SECCIÓN: REFUERZOS ====================
 */
function setupReinforcementSection() {
    const btnDecTerr = document.getElementById('btnDecTerr');
    const btnIncTerr = document.getElementById('btnIncTerr');
    const inputTerr = document.getElementById('playerTerritories');
    const btnCalculate = document.getElementById('btnCalculateRefuerzos');
    const selectPlayer = document.getElementById('activePlayer');

    // Botones de territorios
    btnIncTerr.addEventListener('click', () => {
        inputTerr.value = Math.min(42, parseInt(inputTerr.value) + 1);
    });

    btnDecTerr.addEventListener('click', () => {
        inputTerr.value = Math.max(1, parseInt(inputTerr.value) - 1);
    });

    // Cambio de jugador activo
    selectPlayer.addEventListener('change', () => {
        const playerId = parseInt(selectPlayer.value);
        if (playerId) {
            const player = arbiter.getPlayer(playerId);
            if (player) {
                uiState.activePlayerId = playerId;
                inputTerr.value = player.territories;
                updateContinentCheckboxes(player.continents);
            }
        }
    });

    // Botón de cálculo
    btnCalculate.addEventListener('click', calculateRefuerzos);

    // Actualizar select inicial
    updateReinforcementsPlayersSelect();
}

/**
 * Actualiza el select de jugadores en la sección de refuerzos
 */
function updateReinforcementsPlayersSelect() {
    const select = document.getElementById('activePlayer');
    select.innerHTML = '<option value="">Selecciona...</option>';

    arbiter.getAllPlayers().forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = `${player.name}`;
        select.appendChild(option);
    });
}

/**
 * Actualiza los checkboxes de continentes
 */
function updateContinentCheckboxes(selectedContinents = []) {
    const checkboxes = document.querySelectorAll('.continent-check');
    checkboxes.forEach(cb => {
        cb.checked = selectedContinents.includes(cb.value);
    });
}

/**
 * Calcula los refuerzos
 */
function calculateRefuerzos() {
    if (!uiState.activePlayerId) {
        alert('Selecciona un jugador primero');
        return;
    }

    const territories = parseInt(document.getElementById('playerTerritories').value) || 5;
    const continents = Array.from(document.querySelectorAll('.continent-check:checked')).map(cb => cb.value);

    const result = arbiter.calculateReinforcements(uiState.activePlayerId, territories, continents);

    // Mostrar resultado
    const resultCard = document.getElementById('reinforcementResult');
    resultCard.style.display = 'block';

    document.getElementById('reinforcementValue').textContent = result.total;

    // Actualizar datos del jugador
    const player = arbiter.getPlayer(uiState.activePlayerId);
    if (player) {
        player.territories = territories;
        player.continents = continents;
        renderPlayersList();
    }
}

/**
 * ==================== SECCIÓN: BLITZ ====================
 */
function setupBlitzSection() {
    const troopsAttacker = document.getElementById('troopsAttacker');
    const troopsDefender = document.getElementById('troopsDefender');
    const btnIncAtk = document.getElementById('btnIncAtk');
    const btnDecAtk = document.getElementById('btnDecAtk');
    const btnIncDef = document.getElementById('btnIncDef');
    const btnDecDef = document.getElementById('btnDecDef');
    const btnCalculate = document.getElementById('btnCalculate');
    const btnSpinWheel = document.getElementById('btnSpinWheel');

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

    // Permitir Enter
    troopsAttacker.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateBlitz();
    });

    troopsDefender.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateBlitz();
    });

    // Botón de cálculo
    btnCalculate.addEventListener('click', calculateBlitz);

    // Botón de girar ruleta
    btnSpinWheel.addEventListener('click', spinWheel);

    // Auto-calcular al cambiar valores
    troopsAttacker.addEventListener('change', calculateBlitz);
    troopsDefender.addEventListener('change', calculateBlitz);

    // Instanciar ruleta
    wheelSpinner = new WheelSpinner('wheelCanvas', 0.5);
}

/**
 * Calcula probabilidad de Blitz
 */
function calculateBlitz() {
    const attackerTroops = parseInt(document.getElementById('troopsAttacker').value) || 1;
    const defenderTroops = parseInt(document.getElementById('troopsDefender').value) || 1;

    if (attackerTroops < 1 || defenderTroops < 1) {
        return;
    }

    // Calcular razón
    const ratio = attackerTroops / defenderTroops;

    // Obtener probabilidad
    const probability = blitzModel.predictProbability(ratio);

    // Guardar probabilidad para el giro de ruleta
    uiState.lastProbability = probability;

    if (!wheelSpinner.isSpinning) {
        wheelSpinner.probability = probability;
        wheelSpinner.draw();
    }

    // Obtener recomendación
    const rec = blitzModel.getRecommendation(probability);

    // Actualizar UI
    const resultCard = document.getElementById('resultCard');
    resultCard.style.display = 'block';

    // Probabilidad
    document.getElementById('probValue').textContent = (probability * 100).toFixed(1);

    // Recomendación
    const recElement = document.getElementById('recommendation');
    recElement.textContent = rec.text;

    // Métricas
    document.getElementById('metricRatio').textContent = ratio.toFixed(2);
    document.getElementById('metricStrategy').textContent = rec.strategy;

    // Limpiar mensaje de resultado anterior
    const messageElement = document.getElementById('wheelResultMessage');
    messageElement.style.display = 'none';
}

/**
 * Dispara el giro de la ruleta
 */
function spinWheel() {
    if (!uiState.lastProbability && uiState.lastProbability !== 0) {
        alert('Primero calcula el Blitz para determinar la probabilidad');
        return;
    }

    if (wheelSpinner.isSpinning) {
        alert('La ruleta ya está girando. Espera a que termine.');
        return;
    }

    wheelSpinner.spin(uiState.lastProbability);
}

/**
 * ==================== UTILIDADES ====================
 */

/**
 * Convierte código de color a hex
 */
function getColorCode(colorName) {
    const colors = {
        red: '#e74c3c',
        blue: '#3498db',
        green: '#2ecc71',
        yellow: '#f39c12',
        purple: '#9b59b6',
        orange: '#e67e22'
    };
    return colors[colorName] || '#d4af37';
}
