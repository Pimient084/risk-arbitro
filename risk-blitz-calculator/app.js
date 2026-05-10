/**
 * RISK Arbiter — Application Controller
 * Gestiona eventos, lógica de interfaz y coordinación entre módulos
 */

let arbiter = null;
let blitzModel = null;

// Estado de la interfaz
const uiState = {
    activePlayerId: null,
    territoriesInput: 5,
    continentsSelected: []
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

    // Auto-calcular al cambiar valores
    troopsAttacker.addEventListener('change', calculateBlitz);
    troopsDefender.addEventListener('change', calculateBlitz);
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
