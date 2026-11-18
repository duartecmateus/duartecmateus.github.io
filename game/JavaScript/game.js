// Grupo: 27, Número: 62796, Nome: Gabriel Lima, PL: 21
// Grupo: 27, Número: 59712, Nome: Miguel Moreira, PL: 21
// Grupo: 27, Número: 62019, Nome: Duarte Matheus, PL: 21

"use strict";

const EGG_COUNT     = 7;
const MIN_MATCH     = 3;
const SCORE_PER_EGG = 100;

/* ════════════════════════════════════════════════════
   EGGS — imagens dos ovos
   ════════════════════════════════════════════════════ */

/**
 * Construtor para gerir o array de caminhos das imagens dos ovos.
 * @constructor
 */
export function Eggs() {
    this.EGG_IMAGES = [
        'Imagens/IMG_1297.PNG',
        'Imagens/IMG_1299.PNG',
        'Imagens/IMG_1300.PNG',
        'Imagens/IMG_1302.PNG',
        'Imagens/IMG_1303.PNG',
        'Imagens/IMG_1305.PNG',
        'Imagens/IMG_1307.PNG',
        'Imagens/IMG_1311.PNG',
        'Imagens/IMG_1315.PNG',
        'Imagens/IMG_1312.PNG',
    ];
}

/**
 * Gera um índice aleatório correspondente a um tipo de ovo normal.
 * @returns {number} Índice numérico do ovo gerado (entre 0 e EGG_COUNT - 1).
 */
export function randomEgg() {
    return Math.floor(Math.random() * EGG_COUNT);
}


/* ════════════════════════════════════════════════════
   GRID — construção do tabuleiro
   @param {number} gridSize  Número de linhas/colunas (default 8)
   ════════════════════════════════════════════════════ */

/**
 * Construtor que representa e inicializa o tabuleiro de jogo.
 * @constructor
 * @param {number} gridSize - O tamanho do tabuleiro (número de linhas e colunas).
 */
export function Grid(gridSize = 8) {
    this.gridSize = gridSize;
    this.grid     = [];

    /**
     * Constrói e preenche a grelha inicial garantindo que não existem combinações iniciais.
     */
    this.buildGrid = function () {
        this.grid = [];
        for (let r = 0; r < this.gridSize; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.gridSize; c++) {
                let type;
                do {
                    type = randomEgg();
                } while (this.wouldCauseMatch(r, c, type));
                this.grid[r][c] = type;
            }
        }
    };

    /**
     * Verifica se colocar um determinado tipo de ovo numa célula causaria uma combinação imediata de 3.
     * @param {number} row - O índice da linha da célula.
     * @param {number} col - O índice da coluna da célula.
     * @param {number} type - O tipo/índice do ovo a testar.
     * @returns {boolean} Retorna true se causar uma combinação horizontal ou vertical, false caso contrário.
     */
    this.wouldCauseMatch = function (row, col, type) {
        if (col >= 2 &&
            this.grid[row][col - 1] === type &&
            this.grid[row][col - 2] === type) return true;
        if (row >= 2 &&
            this.grid[row - 1][col] === type &&
            this.grid[row - 2][col] === type) return true;
        return false;
    };
}

/* ════════════════════════════════════════════════════
   SWAP — troca de células (sem dependência do tamanho)
   ════════════════════════════════════════════════════ */

/**
 * Construtor responsável pela lógica de verificação e troca de peças.
 * @constructor
 * @param {Object} gridRef - Objeto de referência que contém a matriz do tabuleiro ({ grid: Array }).
 */
export function Swap(gridRef) {
    this.gridRef = gridRef;

    /**
     * Verifica se duas coordenadas no tabuleiro são adjacentes (partilham um lado).
     * @param {number} r1 - Linha da primeira célula.
     * @param {number} c1 - Coluna da primeira célula.
     * @param {number} r2 - Linha da segunda célula.
     * @param {number} c2 - Coluna da segunda célula.
     * @returns {boolean} True se forem adjacentes na horizontal ou vertical, false caso contrário.
     */
    this.isAdjacent = function (r1, c1, r2, c2) {
        return (
            (Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 0) ||
            (Math.abs(r1 - r2) === 0 && Math.abs(c1 - c2) === 1)
        );
    };

    /**
     * Efetua a troca de posições entre duas peças diretamente na matriz do jogo.
     * @param {number} r1 - Linha da primeira célula.
     * @param {number} c1 - Coluna da primeira célula.
     * @param {number} r2 - Linha da segunda célula.
     * @param {number} c2 - Coluna da segunda célula.
     */
    this.swapInGrid = function (r1, c1, r2, c2) {
        const grid   = this.gridRef.grid;
        const tmp    = grid[r1][c1];
        grid[r1][c1] = grid[r2][c2];
        grid[r2][c2] = tmp;
    };
}

/* ════════════════════════════════════════════════════
   MATCHER — deteção de combinações
   ════════════════════════════════════════════════════ */

   
/**
 * Construtor responsável por analisar o tabuleiro à procura de combinações válidas ou jogadas possíveis.
 * @constructor
 * @param {Object} gridRef - Objeto de referência que contém a matriz do tabuleiro ({ grid: Array }).
 * @param {number} [gridSize=8] - O tamanho atual do tabuleiro.
 */
export function Matcher(gridRef, gridSize = 8) {
    this.gridRef  = gridRef;
    this.gridSize = gridSize;
    this.SPECIAL_INDICES = new Set([7, 8]);

    /**
     * Procura no tabuleiro todas as combinações horizontais e verticais de 3 ou mais ovos iguais.
     * @returns {MatchResult} Objeto contendo os arrays de células combinadas e de bónus.
     */
    this.findAllMatches = function () {
        const grid       = this.gridRef.grid;
        const GS         = this.gridSize;
        const matched    = new Set();
        const bonusCells = new Set();

        /* --- Matches Horizontais --- */
        for (let l = 0; l < GS; l++) {
            let c = 0;
            while (c < GS) {
                const type = grid[l][c];
                let end = c;
                while (end + 1 < GS && grid[l][end + 1] === type) end++;
                const length = end - c + 1;
                if (length >= MIN_MATCH) {
                    for (let k = c; k <= end; k++) {
                        matched.add(`${l},${k}`);
                        if (length >= 4) bonusCells.add(`${l},${k}`);
                    }
                }
                c = end + 1;
            }
        }

        /* --- Matches Verticais --- */
        for (let c = 0; c < GS; c++) {
            let l = 0;
            while (l < GS) {
                const type = grid[l][c];
                let end = l;
                while (end + 1 < GS && grid[end + 1][c] === type) end++;
                const length = end - l + 1;
                if (length >= MIN_MATCH) {
                    for (let k = l; k <= end; k++) {
                        matched.add(`${k},${c}`);
                        if (length >= 4) bonusCells.add(`${k},${c}`);
                    }
                }
                l = end + 1;
            }
        }

        const matched_arr    = Array.from(matched);
        const bonusCells_arr = Array.from(bonusCells);

        return {
            cells: matched_arr.map(m    => ({ row: Number(m.split(',')[0]), col: Number(m.split(',')[1]) })),
            bonus: bonusCells_arr.map(m => ({ row: Number(m.split(',')[0]), col: Number(m.split(',')[1]) })),
        };
    };

    /**
     * Verifica se existe pelo menos um movimento válido no tabuleiro que resulte num match.
     * @returns {boolean} True se houver pelo menos uma jogada possível, false caso contrário (Deadlock).
     */
    this.hasPossibleMove = function () {
        const grid = this.gridRef.grid;
        const GS   = this.gridSize;

        const swap = (r1, c1, r2, c2) => {
            const t      = grid[r1][c1];
            grid[r1][c1] = grid[r2][c2];
            grid[r2][c2] = t;
        };

        for (let r = 0; r < GS; r++) {
            for (let c = 0; c < GS; c++) {
                if (c + 1 < GS) {
                    swap(r, c, r, c + 1);
                    const found = this._hasMatch();
                    swap(r, c + 1, r, c);
                    if (found) return true;
                }
                if (r + 1 < GS) {
                    swap(r, c, r + 1, c);
                    const found = this._hasMatch();
                    swap(r + 1, c, r, c);
                    if (found) return true;
                }
            }
        }
        return false;
    };

    /**
     * Procura e devolve o primeiro par de células adjacentes que pode ser trocado para formar um match.
     * @returns {Array<{row: number, col: number}>|null} Array com os dois objetos de coordenada da jogada ou null se não houver.
     */
    this.findHint = function () {
        const grid = this.gridRef.grid;
        const GS   = this.gridSize;

        const swap = (r1, c1, r2, c2) => {
            const t      = grid[r1][c1];
            grid[r1][c1] = grid[r2][c2];
            grid[r2][c2] = t;
        };

        for (let r = 0; r < GS; r++) {
            for (let c = 0; c < GS; c++) {
                if (c + 1 < GS) {
                    swap(r, c, r, c + 1);
                    const found = this._hasMatch();
                    swap(r, c + 1, r, c);
                    if (found) return [{ row: r, col: c }, { row: r, col: c + 1 }];
                }
                if (r + 1 < GS) {
                    swap(r, c, r + 1, c);
                    const found = this._hasMatch();
                    swap(r + 1, c, r, c);
                    if (found) return [{ row: r, col: c }, { row: r + 1, col: c }];
                }
            }
        }
        return null;
    };

    /**
     * Varrimento interno rápido que valida a existência imediata de qualquer match.
     * Ignora células vazias (null) e índices de ovos especiais.
     * @returns {boolean} True se encontrar algum alinhamento de 3 peças iguais, false caso contrário.
     */
    this._hasMatch = function () {
        const grid = this.gridRef.grid;
        const GS   = this.gridSize;

        for (let r = 0; r < GS; r++) {
            for (let c = 0; c <= GS - MIN_MATCH; c++) {
                const type = grid[r][c];
                if (type === null || this.SPECIAL_INDICES.has(type)) continue;
                if (type === grid[r][c + 1] && type === grid[r][c + 2]) return true;
            }
        }

        for (let c = 0; c < GS; c++) {
            for (let r = 0; r <= GS - MIN_MATCH; r++) {
                const type = grid[r][c];
                if (type === null || this.SPECIAL_INDICES.has(type)) continue;
                if (type === grid[r + 1][c] && type === grid[r + 2][c]) return true;
            }
        }

        return false;
    };
}

/* ════════════════════════════════════════════════════
   GRAVITY — queda e reabastecimento da grelha
   ════════════════════════════════════════════════════ */

/**
 * Construtor responsável por aplicar o efeito de gravidade física e preenchimento de novas peças no tabuleiro.
 * @constructor
 * @param {Object} gridRef - Objeto de referência que contém a matriz do tabuleiro ({ grid: Array }).
 * @param {number} [gridSize=8] - O tamanho do tabuleiro.
 */
export function Gravity(gridRef, gridSize = 8) {
    this.gridRef  = gridRef;
    this.gridSize = gridSize;

    /**
     * Faz com que as peças acima de espaços vazios (null) caiam para as posições inferiores.
     */
    this.applyGravity = function () {
        const grid = this.gridRef.grid;
        const GS   = this.gridSize;
        for (let c = 0; c < GS; c++) {
            let writeRow = GS - 1;
            for (let r = GS - 1; r >= 0; r--) {
                if (grid[r][c] !== null) {
                    grid[writeRow][c] = grid[r][c];
                    if (writeRow !== r) grid[r][c] = null;
                    writeRow--;
                }
            }
            for (let r = writeRow; r >= 0; r--) {
                grid[r][c] = null;
            }
        }
    };

    /**
     * Preenche todos os espaços vazios (null) restantes no topo com novos ovos aleatórios normais.
     */
    this.refillGrid = function () {
        const grid = this.gridRef.grid;
        const GS   = this.gridSize;
        for (let r = 0; r < GS; r++) {
            for (let c = 0; c < GS; c++) {
                if (grid[r][c] === null) {
                    grid[r][c] = randomEgg();
                }
            }
        }
    };
}

/* ════════════════════════════════════════════════════
   SCORE — pontuação e contagem de ovos
   ════════════════════════════════════════════════════ */

/**
 * Construtor responsável por gerir a pontuação, o progresso e objetivos do jogo.
 * @constructor
 * @param {number} [totalEggs=100] - Quantidade total de ovos a eliminar necessária para vencer.
 */
export function Score(totalEggs = 100) {
    this.totalEggs     = totalEggs;
    this.score         = 0;
    this.eggsScrambled = 0;

    /**
     * Calcula o total de pontos obtido por uma jogada com base nas células eliminadas e bónus.
     * @param {Array<{row: number, col: number}>} cells - Células totais eliminadas.
     * @returns {number} O total de pontos ganho nesta jogada específica.
     */
    this.calculatePoints = function (cells) {
        const n = cells.length;
        return 10 * (n - 2);
    };

    /**
     * Adiciona os pontos calculados ao score total acumulado do jogador.
     * @param {number} points - Quantidade de pontos a somar.
     */
    this.addPoints = function (points) {
        this.score += points;
    };

    /**
     * Incrementa o contador de ovos eliminados (sem ultrapassar o objetivo limite).
     * @param {number} count - Número de ovos eliminados a somar.
     */
    this.addEggs = function (count) {
        this.eggsScrambled = Math.min(this.totalEggs, this.eggsScrambled + count);
    };

    /**
     * Verifica se o objetivo de eliminação de ovos do nível foi atingido.
     * @returns {boolean} True se os ovos eliminados forem iguais ou superiores ao objetivo, false caso contrário.
     */
    this.isComplete = function () {
        return this.eggsScrambled >= this.totalEggs;
    };

    /**
     * Repõe a pontuação e os ovos eliminados de volta a 0, permitindo redefinir o objetivo.
     * @param {number} [newTotalEggs] - O novo objetivo de eliminação de ovos (opcional).
     */
    this.reset = function (newTotalEggs) {
        if (newTotalEggs !== undefined) this.totalEggs = newTotalEggs;
        this.score         = 0;
        this.eggsScrambled = 0;
    };
}

/* ════════════════════════════════════════════════════
   CONFIGURAÇÕES DE DIFICULDADE
   ════════════════════════════════════════════════════ */

export const DIFFICULTY_CONFIGS = {
    easy: {
        key:       'easy',
        label:     'Easy',
        gridSize:  8,
        totalEggs: 20,
    },
    medium: {
        key:       'medium',
        label:     'Normal',
        gridSize:  9,
        totalEggs: 25,
    },
    hard: {
        key:       'hard',
        label:     'Hard',
        gridSize:  10,
        totalEggs: 30,
    },
};

/* ════════════════════════════════════════════════════
   CONFIGURAÇÕES DE MODO
   ════════════════════════════════════════════════════ */

export const GAME_MODES = {
    normal: {
        key: 'normal',
        label: 'Normal',
    },
    timed: {
        key: 'timed',
        label: 'Against the time',
        timeLimitSeconds: 120,
    },
    cautious: {
        key: 'cautious',
        label: 'Caution',
        maxMoves: 15,
    },
};

/* ════════════════════════════════════════════════════
   KEYBOARD NAVIGATION
   ════════════════════════════════════════════════════ */

/**
 * Construtor auxiliar para mapear inputs de teclas de teclado físico em direções bidimensionais.
 * @constructor
 */
export function Keyboard() {
    
    /**
     * Traduz uma tecla pressionada (WASD) num vetor de movimento [linha, coluna].
     * @param {string} key - O valor da propriedade `key` do evento de teclado (ex: 'w', 'a', 's', 'd').
     * @returns {Array<number>|null} Array contendo `[deltaRow, deltaCol]` ou null se for uma tecla inválida.
     */
    this.getKeyMove = function(key){
        const moves = {
            'w': [-1, 0],
            's': [1, 0],
            'a': [0, -1],
            'd': [0, 1],
        }
        return moves[key] ?? null;
    }
}

/* ════════════════════════════════════════════════════
   SPECIAL EGGS CONFIGURATION
   ════════════════════════════════════════════════════ */

export const SPECIAL_EGGS = {
    NINJA: {
        id: 'ninja',   typeIndex: 7,
    },
    OSTRICH: {
        id: 'ostrich', typeIndex: 8,
    },
};