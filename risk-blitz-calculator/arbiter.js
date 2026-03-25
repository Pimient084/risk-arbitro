/**
 * RISK Game Arbiter — Lógica central del árbitro
 * Gestiona jugadores, territorios, continentes, y cálculo de refuerzos
 */

class GameArbiter {
    constructor() {
        this.players = [];
        this.nextPlayerId = 1;

        // Definición de continentes y sus territorios
        this.continents = {
            NA: { name: 'Norteamérica', bonus: 5, territories: 9 },
            SA: { name: 'Sudamérica', bonus: 2, territories: 4 },
            EU: { name: 'Europa', bonus: 5, territories: 7 },
            AF: { name: 'África', bonus: 3, territories: 6 },
            AS: { name: 'Asia', bonus: 7, territories: 12 },
            AU: { name: 'Australia', bonus: 2, territories: 4 }
        };

        // Cartas de bonificación
        this.cardBonus = {
            1: 2,    // 1 conjunto = 2 tropas (obsoleto)
            2: 5,    // 2 conjuntos = 5 tropas (obsoleto)
            3: 10,   // 3 conjuntos = 10 tropas
            4: 15,   // 4 conjuntos = 15 tropas
            5: 20    // 5+ conjuntos = 20 tropas
        };
    }

    /**
     * Agrega un jugador al juego
     */
    addPlayer(name, color) {
        if (!name || !color) return null;

        const player = {
            id: this.nextPlayerId++,
            name: name,
            color: color,
            territories: 0,
            continents: [],
            troops: 0
        };

        this.players.push(player);
        return player;
    }

    /**
     * Elimina un jugador
     */
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
    }

    /**
     * Obtiene jugador por ID
     */
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }

    /**
     * Calcula refuerzos para un jugador
     * Fórmula oficial de Risk:
     * - Base: ⌊ territorios / 3 ⌋ (mínimo 3)
     * - Continentes: sumar bonos de los que controla completamente
     * - Cartas: si canjea x conjuntos, sumar bonus
     */
    calculateReinforcements(playerId, territoriesControlled, continentsControlled = [], cardSets = 0) {
        let total = 0;

        // 1. Refuerzos por territorios
        const territoryBonus = Math.max(3, Math.floor(territoriesControlled / 3));
        total += territoryBonus;

        // 2. Bonos de continentes
        let continentBonus = 0;
        for (const continentCode of continentsControlled) {
            if (this.continents[continentCode]) {
                continentBonus += this.continents[continentCode].bonus;
            }
        }
        total += continentBonus;

        // 3. Bonos de cartas (si canjea)
        if (cardSets > 0 && this.cardBonus[cardSets]) {
            total += this.cardBonus[cardSets];
        }

        return {
            total: total,
            breakdown: {
                territories: territoryBonus,
                continents: continentBonus,
                cards: cardSets > 0 ? this.cardBonus[cardSets] || 0 : 0
            },
            territoryCount: territoriesControlled,
            continuentsControlled: continentsControlled,
            cardSets: cardSets
        };
    }

    /**
     * Verifica si un jugador controla un continente completo
     */
    controlsContinentCompletely(playerId, continentCode) {
        // En esta versión simple, asumimos que es verdadero si el jugador lo marca
        const player = this.getPlayer(playerId);
        if (!player) return false;
        return player.continents.includes(continentCode);
    }

    /**
     * Obtiene información de todos los jugadores
     */
    getAllPlayers() {
        return this.players.map(p => ({
            ...p,
            reinforcementInfo: this.calculateReinforcements(p.id, p.territories, p.continents)
        }));
    }

    /**
     * Obtiene estadísticas del juego
     */
    getGameStats() {
        const totalTerritories = this.players.reduce((sum, p) => sum + p.territories, 0);
        const continentsControlled = {};

        for (const continent in this.continents) {
            continentsControlled[continent] = this.players.filter(p => p.continents.includes(continent)).length;
        }

        return {
            totalPlayers: this.players.length,
            totalTerritoriesAssigned: totalTerritories,
            territoriesRemaining: 42 - totalTerritories,
            continentsControlled: continentsControlled
        };
    }
}

// Exportar clase
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameArbiter;
}
