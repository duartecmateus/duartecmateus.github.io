/* Grupo: 27, Número: 62796, Nome: Gabriel Lima, PL: 21 */
/* Grupo: 27, Número: 59712, Nome: Miguel Moreira, PL: 21 */
/* Grupo: 27, Número: 62019, Nome: Duarte Matheus, PL: 21  */

"use strict";

import {
    Eggs, Grid, Swap, Matcher, Gravity, Score, Keyboard, DIFFICULTY_CONFIGS, GAME_MODES, SPECIAL_EGGS,
} from './game.js';

/* ════════════════════════════════════════════════════
   ESTADO GLOBAL
   ════════════════════════════════════════════════════ */
const eggs_classe = new Eggs();
const EGG_IMAGES  = eggs_classe.EGG_IMAGES;

/* Configuração do modo e dificuldade de jogo activa  */
let currentConfig  = null;
let currentMode    = null;
let movesLeft      = 0;

/* Instâncias dos módulos do jogo  */
let grid_classe    = null;
let gridRef        = null;
let swap_classe    = null;
let matcher_classe = null;
let gravity_classe = null;
let score_classe   = null;
let keyboard_classe = new Keyboard;

let selected    = null;
let hintTimeout  = null;
let hintCells    = [];
let isAnimating = false;
let gameOver    = false;

let cursor_row = 0;
let cursor_col = 0;

let piecesDiv, scoreEl, eggsCountEl, eggsBarEl, eggsHintEl;

/* ════════════════════════════════════════════════════
   EVENT LISTENER
   ════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const btnRestart = document.getElementById('btn_restart');
    if (btnRestart) {
        btnRestart.removeAttribute('onclick');
        btnRestart.addEventListener('click', () => restartGame(true));
    }

    const btnHint = document.getElementById('btn_hint');
    if (btnHint) {
        btnHint.addEventListener('click', showHint);
    }

    initGame();
});

/* ════════════════════════════════════════════════════
   INICIALIZAÇÃO
   ════════════════════════════════════════════════════ */

function initGame() {
    cacheDOMRefs();
    showDifficultyScreen();
}

function cacheDOMRefs() {
    piecesDiv   = document.querySelector('.pieces');
    scoreEl     = document.getElementById('score');
    eggsCountEl = document.getElementById('eggsCount');
    eggsBarEl   = document.getElementById('eggsBar');
    eggsHintEl  = document.getElementById('eggsHint');
}

/**
 * Inicializa a configuração do tabuleiro e os módulos do motor de jogo com base nos parâmetros selecionados.
 * @param {Object} config - Objeto de configuração da dificuldade ativa (ex: key, label, gridSize, totalEggs).
 * @param {Object} mode - Objeto que dita as restrições do modo de jogo selecionado (ex: key, label, maxMoves, timeLimitSeconds).
 */
function startWithConfig(config, mode) {
    currentConfig = config;
    currentMode   = mode;

    /* Recriar todos os módulos do jogo com os novos parâmetros */
    grid_classe    = new Grid(config.gridSize);
    gridRef        = { grid: grid_classe.grid };
    swap_classe    = new Swap(gridRef);
    matcher_classe = new Matcher(gridRef, config.gridSize);
    gravity_classe = new Gravity(gridRef, config.gridSize);
    score_classe   = new Score(config.totalEggs);

    /* Repor estado */
    selected    = null;
    isAnimating = false;
    gameOver    = false;
    cursor_row  = 0;
    cursor_col  = 0;
    movesLeft   = mode.maxMoves ?? 0;

    /* Actualizar a variável CSS --grid-size no contentor do tabuleiro.
       O CSS usa repeat(var(--grid-size), 1fr) e calc(100% / var(--grid-size))
       para ajustar automaticamente colunas e linhas de fundo. */
    const gameGrid = document.querySelector('.game_grid');
    if (gameGrid) gameGrid.style.setProperty('--grid-size', config.gridSize);

    buildGrid();
    renderGrid();
    updateDifficultyLabel();
    updateHUD();
    startTimer();
    resetHintCooldown();
}

function updateDifficultyLabel() {
    const el = document.getElementById('difficulty-label');
    if (el && currentConfig) el.textContent = currentConfig.label;
}

/* ════════════════════════════════════════════════════
   ECRÃ DE ESCOLHA DE DIFICULDADE
   ════════════════════════════════════════════════════ */

function showDifficultyScreen() {

    const existing = document.getElementById('difficulty-overlay');
    if (existing) existing.remove();

    let selectedMode = null;

    const overlay = document.createElement('div');
    overlay.id = 'difficulty-overlay';
    overlay.innerHTML = `
        <div id="difficulty-modal">
            <h2>🥚 Choose the dificulty</h2>

            <div class="difficulty-presets">
                <button class="diff-btn mode-btn ${selectedMode === 'normal'   ? 'active' : ''}" data-mode="normal">
                    <span class="diff-label"> Normal</span>
                    <span class="diff-desc">Reach the limit of eggs</span>
                </button>
                <button class="diff-btn mode-btn ${selectedMode === 'timed'    ? 'active' : ''}" data-mode="timed">
                    <span class="diff-label">⏱ Time Trial</span>
                    <span class="diff-desc">2 minutes to score as much as possible</span>
                </button>
                <button class="diff-btn mode-btn ${selectedMode === 'cautious' ? 'active' : ''}" data-mode="cautious">
                    <span class="diff-label"> Cautious</span>
                    <span class="diff-desc">Only 15 moves</span>
                </button>
            </div>

            <div id="difficulty-section" style="display:none">
                <div class="difficulty-presets">
                    <button class="diff-btn diff-easy" data-diff="easy">
                        <span class="diff-label">Easy</span>
                        <span class="diff-desc">8 × 8 · 20 eggs</span>
                    </button>
                    <button class="diff-btn diff-medium" data-diff="medium">
                        <span class="diff-label">Normal</span>
                        <span class="diff-desc">9 × 9 · 25 eggs</span>
                    </button>
                    <button class="diff-btn diff-hard" data-diff="hard">
                        <span class="diff-label">Hard</span>
                        <span class="diff-desc">10 × 10 · 30 eggs</span>
                    </button>
                </div>

                <div class="difficulty-custom">
                    <h3>⚙️ Personalize</h3>
                    <div class="custom-inputs">
                        <div class="custom-field">
                            <label>Grid Size</label>
                            <input type="number" id="custom-size"
                                min="5" max="10" value="8"
                                title="Entre 5 e 10">
                        </div>
                        <div class="custom-field">
                            <label>Eggs to eliminate</label>
                            <input type="number" id="custom-eggs"
                                min="5" max="500" value="20"
                                title="Entre 5 e 500">
                        </div>
                    </div>
                    <button id="btn-custom-start">▶ Start personalized Grid</button>
                    <p class="custom-error" id="custom-error"></p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Escolha do modo — revela a secção de dificuldade
    overlay.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedMode = btn.dataset.mode;
            overlay.querySelector('#difficulty-section').style.display = 'block';
        });
    });

    /* Botões de dificuldade pré-definida */
    overlay.querySelectorAll('.diff-btn[data-diff]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!selectedMode) return;
            overlay.remove();
            startWithConfig(DIFFICULTY_CONFIGS[btn.dataset.diff], GAME_MODES[selectedMode]);
        });
    });

    /* Botão personalizado */
    overlay.querySelector('#btn-custom-start').addEventListener('click', () => {
        const sizeInput  = overlay.querySelector('#custom-size');
        const eggsInput  = overlay.querySelector('#custom-eggs');
        const errorEl    = overlay.querySelector('#custom-error');
        const gridSize   = parseInt(sizeInput.value, 10);
        const totalEggs  = parseInt(eggsInput.value, 10);

        if (isNaN(gridSize) || gridSize < 5 || gridSize > 10) {
            errorEl.textContent = 'O tamanho deve ser entre 5 e 10.';
            return;
        }
        if (isNaN(totalEggs) || totalEggs < 5 || totalEggs > 500) {
            errorEl.textContent = 'As joias devem ser entre 5 e 500.';
            return;
        }

        errorEl.textContent = '';
        overlay.remove();
        startWithConfig({
            key:       `custom_${gridSize}x${gridSize}_${totalEggs}`,
            label:     `Personalized ${gridSize}×${gridSize} · ${totalEggs} eggs`,
            gridSize,
            totalEggs,
        }, GAME_MODES[selectedMode]);
    });
}

/* ════════════════════════════════════════════════════
   CAUTIOUS MODE FUNCTIONALITIES
   ════════════════════════════════════════════════════ */

/**
 * Evento disparado para processar e atualizar o decréscimo de movimentos no modo 'Cautious'.
 * Encerra o jogo caso os movimentos válidos acabem.
 */
function checkMovesLeft() {
    if (currentMode?.key !== 'cautious') return;
    movesLeft--;
    updateHUD();
    if (movesLeft <= 0) {
        gameOver = true;
        clearInterval(timerInterval);
        saveGameStats();
        showEndScreen(true);
    }
}

/* ════════════════════════════════════════════════════
   GRID
   ════════════════════════════════════════════════════ */

function buildGrid() {
    grid_classe.buildGrid();
    gridRef.grid = grid_classe.grid;
}

function renderGrid() {
    if (!currentConfig) return;
    const GS = currentConfig.gridSize;

    piecesDiv.innerHTML = '';

    for (let r = 0; r < GS; r++) {
        for (let c = 0; c < GS; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (gridRef.grid[r][c] !== null) {
                const img = document.createElement('img');
                img.src = EGG_IMAGES[gridRef.grid[r][c]];
                img.alt = `Egg type ${gridRef.grid[r][c]}`;
                cell.appendChild(img);
            }

            if (selected && selected.row === r && selected.col === c)
                cell.classList.add('selected');

            if (cursor_row === r && cursor_col === c)
                cell.classList.add('cursor');

            cell.addEventListener('click', () => handleCellClick(r, c));
            piecesDiv.appendChild(cell);
        }
    }
}

/* ════════════════════════════════════════════════════
   CLICKING — interação com células
   ════════════════════════════════════════════════════ */

/**
 * Controla os cliques nas células do tabuleiro do jogo, gerindo a seleção e a tentativa de troca de peças.
 * @param {number} row - O índice da linha da célula clicada.
 * @param {number} col - O índice da coluna da célula clicada.
 */
function handleCellClick(row, col) {
    if (isAnimating || gameOver) return;

    if (selected && selected.row === row && selected.col === col) {
        clearSelection();
        return;
    }

    if (!selected) {
        selectCell(row, col);
        return;
    }

    if (swap_classe.isAdjacent(selected.row, selected.col, row, col)) {
        attemptSwap(selected.row, selected.col, row, col);
        clearSelection();
    } else {
        clearSelection();
        selectCell(row, col);
    }
}

/**
 * Realiza a seleção visual de uma célula específica no ecrã e guarda o estado da mesma.
 * @param {number} row - O índice da linha a selecionar.
 * @param {number} col - O índice da coluna a selecionar.
 */
function selectCell(row, col) {
    selected = { row, col };
    const cell = piecesDiv.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell) cell.classList.add('selected');
}

function clearSelection() {
    if (selected) {
        const cell = piecesDiv.querySelector(
            `[data-row="${selected.row}"][data-col="${selected.col}"]`
        );
        if (cell) cell.classList.remove('selected');
    }
    selected = null;
}

/**
 * Tenta efetuar a troca de duas peças no ecrã e no tabuleiro, aplicando as regras dos ovos especiais ou efetuando rollback caso não gere um match válido.
 * @param {number} r1 - Linha da primeira peça.
 * @param {number} c1 - Coluna da primeira peça.
 * @param {number} r2 - Linha da segunda peça.
 * @param {number} c2 - Coluna da segunda peça.
 */
function attemptSwap(r1, c1, r2, c2) {
    isAnimating = true;

    animateSwap(r1, c1, r2, c2, () => {
        swap_classe.swapInGrid(r1, c1, r2, c2);

        // Verificar se alguma das peças trocadas é especial
        const t1 = gridRef.grid[r1][c1];
        const t2 = gridRef.grid[r2][c2];

        if (t1 === SPECIAL_EGGS.NINJA.typeIndex || t2 === SPECIAL_EGGS.NINJA.typeIndex) {
            const [sr, sc] = t1 === SPECIAL_EGGS.NINJA.typeIndex ? [r1, c1] : [r2, c2];
            activateNinja(sr, sc);
            return;
        }

        if (t1 === SPECIAL_EGGS.OSTRICH.typeIndex || t2 === SPECIAL_EGGS.OSTRICH.typeIndex) {
            const [sr, sc] = t1 === SPECIAL_EGGS.OSTRICH.typeIndex ? [r1, c1] : [r2, c2];
            activateOstrich(sr, sc);
            return;
        }

        const matches = matcher_classe.findAllMatches();
        renderGrid();

        if (matches.cells.length > 0) {
            processMatches(matches);
        } else {
            animateSwap(r2, c2, r1, c1, () => {
                swap_classe.swapInGrid(r2, c2, r1, c1);
                renderGrid();
                isAnimating = false;
            }, true);
        }
    });
}

/* ════════════════════════════════════════════════════
   PROCESSAMENTO DE MATCHES (cascata)
   ════════════════════════════════════════════════════ */

/**
 * Processa em loop/cascata as animações de eliminação de peças combinadas, incrementa as pontuações e aplica a gravidade.
 * @param {Object} matches - Objeto retornado pela classe Matcher contendo as propriedades `{ cells, bonus }`.
 */
function processMatches(matches) {
    const cells = matches.cells;
    const bonus = matches.bonus;
    isAnimating = true;

    cells.forEach(({ row, col }) => {
        const cell = piecesDiv.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add(
                bonus.some(b => b.row === row && b.col === col)
                    ? 'matched-bonus'
                    : 'matched'
            );
        }
    });

    setTimeout(() => {
        cells.forEach(({ row, col }) => { gridRef.grid[row][col] = null; });

        const pointsGained = score_classe.calculatePoints(cells);
        score_classe.addPoints(pointsGained);
        score_classe.addEggs(cells.length);

        spawnSpecialEggs(bonus);

        updateHUD();
        gravity_classe.applyGravity();
        gravity_classe.refillGrid();
        renderGrid();

        setTimeout(() => {
            const next = matcher_classe.findAllMatches();
            if (next.cells.length > 0) {
                processMatches(next);
            } else {
                isAnimating = false;
                checkGameOver();
                checkPossibleMoves();
                resetHintCooldown();
                checkMovesLeft();
            }
        }, 350);

    }, 450);
}

/* ════════════════════════════════════════════════════
   SPECIAL EGGS — spawn após match de 4+
   ════════════════════════════════════════════════════ */

/**
 * Analisa e insere de forma randómica os ovos especiais (Ninja ou Avestruz) nas células onde ocorreram combinações de bónus de 4 ou mais peças.
 * @param {Array<{row: number, col: number}>} bonusCells - Array contendo as coordenadas das células de bónus elegíveis.
 */
function spawnSpecialEggs(bonusCells) {
    if (bonusCells.length === 0) return;

    const GS    = currentConfig.gridSize;
    const grid  = gridRef.grid;

    // Para cada célula bonus, tenta spawnar um especial numa posição válida
    bonusCells.forEach(({ row, col }) => {
        // Verifica horizontalmente: null à esquerda e à direita
        if (col > 0 && col < GS - 1 &&
            grid[row][col - 1] === null && grid[row][col + 1] === null) {
            grid[row][col] = pickSpecial();
            return;
        }
        // Verifica verticalmente: null em cima e em baixo
        if (row > 0 && row < GS - 1 &&
            grid[row - 1][col] === null && grid[row + 1][col] === null) {
            grid[row][col] = pickSpecial();
            return;
        }
    });
}

/**
 * Escolhe de forma pseudo-aleatória (50% de probabilidade) o índice correspondente a um ovo especial.
 * @returns {number} Retorna o ID numérico do ovo especial Ninja (7) ou Avestruz (8).
 */
function pickSpecial() {
    return Math.random() < 0.5
        ? SPECIAL_EGGS.NINJA.typeIndex
        : SPECIAL_EGGS.OSTRICH.typeIndex;
}

/* ════════════════════════════════════════════════════
   SPECIAL EGG EFFECTS
   ════════════════════════════════════════════════════ */

/**
 * Ativa o poder especial do ovo Ninja, recolhendo e eliminando todas as células daquela linha.
 * @param {number} row - Linha da explosão.
 * @param {number} col - Coluna da explosão.
 */
function activateNinja(row, col) {
    const GS   = currentConfig.gridSize;
    const grid = gridRef.grid;

    // Elimina a linha inteira
    const cells = [];
    for (let c = 0; c < GS; c++) {
        if (grid[row][c] !== null) {
            cells.push({ row, col: c });
        }
    }

    applySpecialEffect(cells);
}

/**
 * Ativa o poder especial do ovo Avestruz, recolhendo e destruindo todas as peças num raio 3x3 em torno da coordenada.
 * @param {number} row - Linha central do impacto.
 * @param {number} col - Coluna central do impacto.
 */
function activateOstrich(row, col) {
    const GS   = currentConfig.gridSize;
    const grid = gridRef.grid;

    // Elimina 3×3 à volta
    const cells = [];
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < GS && c >= 0 && c < GS && grid[r][c] !== null) {
                cells.push({ row: r, col: c });
            }
        }
    }

    applySpecialEffect(cells);
}

/**
 * Aplica os efeitos visuais, atribuição de pontos de bónus de destruição em cascata e reaplicação do motor de gravidade para os Ovos Especiais.
 * @param {Array<{row: number, col: number}>} cells - Lista de células afetadas pela habilidade especial.
 */
function applySpecialEffect(cells) {
    // Destacar visualmente
    cells.forEach(({ row, col }) => {
        const cell = piecesDiv.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) cell.classList.add('matched-bonus');
    });

    setTimeout(() => {
        cells.forEach(({ row, col }) => { gridRef.grid[row][col] = null; });

        const pointsGained = score_classe.calculatePoints(cells, cells); // tudo como bonus
        score_classe.addPoints(pointsGained);
        score_classe.addEggs(cells.length);

        updateHUD();
        gravity_classe.applyGravity();
        gravity_classe.refillGrid();
        renderGrid();

        setTimeout(() => {
            const next = matcher_classe.findAllMatches();
            if (next.cells.length > 0) {
                processMatches(next);
            } else {
                isAnimating = false;
                checkGameOver();
                checkPossibleMoves();
                resetHintCooldown();
                checkMovesLeft();
            }
        }, 350);
    }, 450);
}

/* ════════════════════════════════════════════════════
   ANIMAÇÕES CSS
   ════════════════════════════════════════════════════ */

/**
 * Executa as animações de transição CSS para simular o deslize físico de duas peças adjacentes antes do processamento lógico da grelha.
 * @param {number} r1 - Linha do elemento original.
 * @param {number} c1 - Coluna do elemento original.
 * @param {number} r2 - Linha do elemento adjacente destino.
 * @param {number} c2 - Coluna do elemento adjacente destino.
 * @param {Function} callback - Função a executar imediatamente após o término da transição de tempo.
 * @param {boolean} reverse - Define se a animação em curso é um efeito de retrocesso (rollback).
 */
function animateSwap(r1, c1, r2, c2, callback, reverse = false) {
    const cell1 = piecesDiv.querySelector(`[data-row="${r1}"][data-col="${c1}"]`);
    const cell2 = piecesDiv.querySelector(`[data-row="${r2}"][data-col="${c2}"]`);

    if (!cell1 || !cell2) { callback(); return; }

    const rect1 = cell1.getBoundingClientRect();
    const rect2 = cell2.getBoundingClientRect();
    const dx = rect2.left - rect1.left;
    const dy = rect2.top  - rect1.top;

    const DURATION = reverse ? 280 : 180;
    const easing   = reverse ? 'cubic-bezier(0.36,0.07,0.19,0.97)' : 'ease';

    cell1.style.zIndex   = '20';
    cell2.style.zIndex   = '20';
    cell1.style.position = 'relative';
    cell2.style.position = 'relative';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            cell1.style.transition = `transform ${DURATION}ms ${easing}`;
            cell2.style.transition = `transform ${DURATION}ms ${easing}`;
            cell1.style.transform  = `translate(${dx}px, ${dy}px)`;
            cell2.style.transform  = `translate(${-dx}px, ${-dy}px)`;
        });
    });

    setTimeout(() => {
        [cell1, cell2].forEach(c => {
            c.style.transition = '';
            c.style.transform  = '';
            c.style.zIndex     = '';
            c.style.position   = '';
        });
        callback();
    }, DURATION + 30);
}

/* ════════════════════════════════════════════════════
   HINT BUTTON
   ════════════════════════════════════════════════════ */

function resetHintCooldown() {
    const btn = document.getElementById('btn_hint');
    if (!btn) return;

    btn.disabled = true;
    btn.classList.add('hint-cooldown');

    clearTimeout(hintTimeout);
    hintTimeout = setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove('hint-cooldown');
    }, 10000);
}

function showHint() {
    if (isAnimating || gameOver) return;

    hintCells.forEach(({ row, col }) => {
        const cell = piecesDiv.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) cell.classList.remove('hint-cell');
    });
    hintCells = [];

    const pair = matcher_classe.findHint();
    if (!pair) return;

    score_classe.addPoints(-5);
    updateHUD();

    hintCells = pair;
    pair.forEach(({ row, col }) => {
        const cell = piecesDiv.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) cell.classList.add('hint-cell');
    });

    setTimeout(() => {
        hintCells.forEach(({ row, col }) => {
            const cell = piecesDiv.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) cell.classList.remove('hint-cell');
        });
        hintCells = [];
    }, 2000);
}

/* ════════════════════════════════════════════════════
   HUD — TIMER, SCORE, EGGS
   ════════════════════════════════════════════════════ */

let timerSeconds  = 0;
let timerInterval = null;

function startTimer() {
    clearInterval(timerInterval);
    timerSeconds  = 0;
    timerInterval = setInterval(() => {
        timerSeconds++;

        if (currentMode?.key === 'timed') {
            const remaining = currentMode.timeLimitSeconds - timerSeconds;
            updateTimerDisplay(remaining);
            if (remaining <= 0) {
                clearInterval(timerInterval);
                gameOver = true;
                saveGameStats();
                showEndScreen(true);
            }
        } else {
            updateTimerDisplay();
        }
    }, 1000);
}

/**
 * Formata e atualiza a componente HTML do relógio/timer HUD dependendo se o modo ativo possui ou não contagem decrescente (Time Trial).
 * @param {number} [overrideSeconds] - Quantidade exata de segundos restantes em falta (usado no modo Time Trial).
 */
function updateTimerDisplay(overrideSeconds) {
    const t   = overrideSeconds ?? timerSeconds;
    const min    = Math.floor(t / 60).toString().padStart(1, '0');
    const sec    = (t % 60).toString().padStart(2, '0');
    const timerEl = document.querySelector('#timer-container .value');
    if (timerEl) timerEl.textContent = `${min}:${sec}`;
}

function updateHUD() {
    if (!currentConfig || !score_classe) return;
    const totalEggs = currentConfig.totalEggs;

    if (scoreEl)     scoreEl.textContent     = score_classe.score.toLocaleString('pt-PT');
    if (eggsCountEl) eggsCountEl.textContent = score_classe.eggsScrambled;
    if (eggsBarEl)   eggsBarEl.style.width   = `${(score_classe.eggsScrambled / totalEggs) * 100}%`;

    if (eggsHintEl) {
        if (currentMode?.key === 'cautious') {
            eggsHintEl.textContent = `${movesLeft} moves left!`;
        } else {
            const remaining = totalEggs - score_classe.eggsScrambled;
            eggsHintEl.textContent = remaining > 0
                ? `${remaining} eggs to go!`
                : '🎉 All scrambled!';    
        }

        if (currentMode?.key === 'timed') {
            eggsHintEl.textContent = '🎉 All scrambled!'; 
        }
        
    }

    updateHeatMeter();
}

function updateHeatMeter() {
    const level    = Math.min(5, Math.floor(score_classe.score / 1000));
    const segments = document.querySelectorAll('.heat_bar_seg');
    segments.forEach((seg, i) => {
        seg.className = 'heat_bar_seg ' + (i < level ? 'on' : 'off');
    });
}

/* ════════════════════════════════════════════════════
   DEADLOCK
   ════════════════════════════════════════════════════ */

function checkPossibleMoves() {
    if (gameOver) return;
    if (matcher_classe.hasPossibleMove()) return;

    showNoMovesNotice(() => {
        buildGrid();
        renderGrid();
    });
}

/**
 * Apresenta um painel animado temporário no ecrã avisando o jogador de que não existem combinações possíveis e que a grelha vai sofrer um Reshuffle.
 * @param {Function} onDone - Função de callback executada quando a animação termina (geralmente reconstrói a Grid).
 */
function showNoMovesNotice(onDone) {
    const notice = document.createElement('div');
    notice.id = 'no-moves-notice';
    notice.textContent = 'No moves left — reshuffling!';
    document.body.appendChild(notice);

    void notice.offsetWidth;
    notice.classList.add('visible');

    setTimeout(() => {
        notice.classList.remove('visible');
        setTimeout(() => {
            notice.remove();
            onDone();
        }, 1000);
    }, 2000);
}


/* ════════════════════════════════════════════════════
   FIM DE JOGO
   ════════════════════════════════════════════════════ */

function checkGameOver() {
    if (currentMode?.key === 'cautious' || currentMode?.key === 'timed') return;
    if (score_classe.isComplete()) {
        gameOver = true;
        clearInterval(timerInterval);
        saveGameStats();
        showEndScreen(true);
    }
}
/* ════════════════════════════════════════════════════
   ECRÃ FINAL — inclui tabela de pontuações
   ════════════════════════════════════════════════════ */

/**
 * Cria dinamicamente o Modal e overlay de Fim de Jogo ("Game Over" ou "Vitória") com estatísticas e botões de navegação.
 * @param {boolean} won - Estado booleano indicando true se o utilizador venceu o nível, false se perdeu por tempo/movimentos.
 */
function showEndScreen(won) {
    const overlay = document.createElement('div');
    overlay.id = 'game-overlay';
    const time = document.querySelector('#timer-container .value')?.textContent

    overlay.innerHTML = `
        <div id="game-modal">
            <p class="modal-emoji">${won ? '🥚🎉' : '😢'}</p>
            <h2>${won ? 'ALL SCRAMBLED!' : 'GAME OVER'}</h2>
            <p class="modal-config">${currentConfig.label}</p>
            <p class="modal-score">Score: <strong>${score_classe.score.toLocaleString('pt-PT')}</strong></p>
            <p class="modal-time">Time: <strong>${time|| '0:00'}</strong></p>
            <div class="modal-buttons">
                <button id="modal-btn-restart">↺ JOGAR NOVAMENTE</button>
                <button class="secondary" id="modal-btn-change">🎲 MUDAR DIFICULDADE</button>
                <button class="secondary" id="modal-btn-leaderboard">🏆 LEADERBOARD</button>
                <button class="secondary" id="modal-btn-quit">✕ SAIR</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    /* Reiniciar com a mesma configuração */
    overlay.querySelector('#modal-btn-restart').addEventListener('click', () => {
        overlay.remove();
        restartGame(false);
    });

    /* Voltar à escolha de dificuldade */
    overlay.querySelector('#modal-btn-change').addEventListener('click', () => {
        overlay.remove();
        restartGame(true);
    });

    /* Sair */
    overlay.querySelector('#modal-btn-quit').addEventListener('click', () => {
        window.location.href = './home.html';
    });

    /* Leaderboard */
    overlay.querySelector('#modal-btn-leaderboard').addEventListener('click', () => {
        window.location.href = './history.html#leader';
    });
}

/* ════════════════════════════════════════════════════
   RESTART
   ════════════════════════════════════════════════════ */

/**
 * @param {boolean} chooseDifficulty  Se true, mostra o ecrã de dificuldade; se false, reinicia com a configuração actual.
 */
function restartGame(chooseDifficulty = false) {
    const overlay = document.getElementById('game-overlay');
    if (overlay) overlay.remove();

    clearInterval(timerInterval);

    selected    = null;
    isAnimating = false;
    gameOver    = false;

    if (chooseDifficulty || !currentConfig || !currentMode) {
        showDifficultyScreen();
    } else {
        /* Reiniciar com a mesma configuração */
        score_classe.reset(currentConfig.totalEggs);
        cursor_row = 0;
        cursor_col = 0;
        movesLeft  = currentMode.maxMoves ?? 0;

        updateHUD();
        buildGrid();
        renderGrid();
        startTimer();
        resetHintCooldown();
    }
}

/* ════════════════════════════════════════════════════
   KEYBOARD NAVIGATION
   ════════════════════════════════════════════════════ */

/**
 * Altera a posição interna do cursor virtual controlado via teclado respeitando as fronteiras definidas do tabuleiro de jogo.
 * @param {number} cr - Variação/Delta do índice da linha (-1 para subir, 1 para descer, 0 para manter).
 * @param {number} cc - Variação/Delta do índice da coluna (-1 para a esquerda, 1 para a direita, 0 para manter).
 */
function moveCursor(cr, cc) {
    const GS = currentConfig.gridSize;
    cursor_row = Math.max(0 , Math.min(GS -1, cursor_row + cr));
    cursor_col = Math.max(0 , Math.min(GS -1, cursor_col + cc));
}

document.addEventListener('keydown', (e) => {
    if (gameOver || isAnimating || !currentConfig) return;

    const move = keyboard_classe.getKeyMove(e.key)

    if (move) {
        moveCursor(move[0], move[1]);
        renderGrid();
        return;
    }

    if (e.key === ' ') {
        e.preventDefault();
        handleCellClick(cursor_row, cursor_col);
    }
});

/* ════════════════════════════════════════════════════
   LEADERBOARD  (por configuração, guardado em localStorage)
   ════════════════════════════════════════════════════ */
/**
 * Ordena a lista global de utilizadores registados com base nos seus pontos totais acumulados e atualiza a respetiva classificação de Rank mundial.
 * @param {Array<Object>} users - Array contendo os objetos de dados de todos os utilizadores no LocalStorage.
 */
function updateLocalRanks(users) {
    const sortedUsers = [...users].sort((a, b) => {
        const pointsA = Number(a.stats?.totalPoints || 0);
        const pointsB = Number(b.stats?.totalPoints || 0);
        return pointsB - pointsA;
    });

    sortedUsers.forEach((user, index) => {
        if (!user.stats) user.stats = {};
        user.stats.worldRank = index + 1;
    });
}

function saveGameStats() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) return;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.email === loggedInUser.email);
    if (userIndex === -1) return;

    if (!users[userIndex].stats) {
        users[userIndex].stats = {
            worldRank: 1,
            gamesPlayed: 0,
            timePlayedSeconds: 0,
            totalPoints: 0,
            modeHighScores: {
                normal: 0,
                timed: 0,
                cautious: 0
            }
        };
    }

    const s = users[userIndex].stats;

    if (!s.modeHighScores) {
        s.modeHighScores = {
            normal: 0,
            timed: 0,
            cautious: 0
        };
    }

    s.gamesPlayed = Number(s.gamesPlayed || 0) + 1;
    s.timePlayedSeconds = Number(s.timePlayedSeconds || 0) + timerSeconds;
    s.totalPoints = Number(s.totalPoints || 0) + score_classe.score;

    const modeKey = currentMode?.key || 'normal';
    s.modeHighScores[modeKey] = Math.max(
        Number(s.modeHighScores[modeKey] || 0),
        score_classe.score
    );

    updateLocalRanks(users);

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('loggedInUser', JSON.stringify(users[userIndex]));

    const name = loggedInUser.username || loggedInUser.email || 'Anónimo';
    saveToLeaderboard(currentConfig, {
        name,
        score: score_classe.score,
        time: timerSeconds,
        date: new Date().toLocaleDateString('pt-PT'),
    });
}

/**
 * Obtém a tabela de pontuações para uma configuração específica.
 * @param  {object} config
 * @returns {Array}  Array de entradas { name, score, time, date }
 */
function getLeaderboard(config) {
    return JSON.parse(localStorage.getItem(`leaderboard_${config.key}`)) || [];
}

/**
 * Guarda uma nova entrada na tabela de pontuações da configuração activa.
 * Mantém apenas as 10 melhores pontuações, ordenadas por score decrescente.
 */
function saveToLeaderboard(config, entry) {
    let board = getLeaderboard(config);
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 10);
    localStorage.setItem(`leaderboard_${config.key}`, JSON.stringify(board));
}
