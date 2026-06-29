//  DOM Elements 
const themeToggle = document.getElementById('theme-toggle');
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const aiSettings = document.getElementById('ai-settings');
const gameOverOverlay = document.getElementById('game-over-overlay');
const statusText = document.getElementById('status');
const overlayMsg = document.getElementById('overlay-msg');
const cells = document.querySelectorAll('.cell');

// Scores
const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreDrawsEl = document.getElementById('score-draws');

//  State Variables 
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let isGameActive = false;
let gameMode = "pvp";
let difficulty = "easy";
let startingPlayer = "X";
let scores = { X: 0, O: 0, Draws: 0 };
let aiPlayer = "O";

const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], 
    [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]
];

//  Theme Management 
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    themeToggle.textContent = document.body.classList.contains('light-theme') 
        ? '🌙 Dark Mode' : '☀️ Light Mode';
});

//  Menu Logic 
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        gameMode = e.target.value;
        if (gameMode === 'pvc') aiSettings.classList.remove('hidden');
        else aiSettings.classList.add('hidden');
    });
});

document.getElementById('btn-start').addEventListener('click', () => {
    gameMode = document.querySelector('input[name="mode"]:checked').value;
    difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    startingPlayer = document.querySelector('input[name="starting-player"]:checked').value;
    
    aiPlayer = startingPlayer === "X" ? "O" : "X";
    
    startNewGame();
    mainMenu.classList.add('hidden');
    gameScreen.classList.remove('hidden');
});

document.getElementById('btn-play-again').addEventListener('click', startNewGame);
document.getElementById('btn-main-menu').addEventListener('click', () => {
    gameOverOverlay.classList.add('hidden');
    gameScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    scores = { X: 0, O: 0, Draws: 0 };
    updateScoreBoard();
});

//  Game Logic 
function startNewGame() {
    board = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = startingPlayer;
    isGameActive = true;
    
    cells.forEach(cell => {
        cell.textContent = "";
        cell.className = "cell";
    });
    
    gameOverOverlay.classList.add('hidden');
    updateStatus();

    if (gameMode === 'pvc' && currentPlayer === aiPlayer) {
        setTimeout(makeComputerMove, 400);
    }
}

function updateStatus() {
    statusText.textContent = `Player ${currentPlayer}'s Turn`;
}

cells.forEach(cell => cell.addEventListener('click', (e) => {
    const index = e.target.getAttribute('data-index');
    if (board[index] !== "" || !isGameActive) return;
    if (gameMode === 'pvc' && currentPlayer === aiPlayer) return;

    processMove(index, currentPlayer);

    if (isGameActive && gameMode === 'pvc' && currentPlayer === aiPlayer) {
        setTimeout(makeComputerMove, 500);
    }
}));

function processMove(index, player) {
    board[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add(player.toLowerCase());
    
    if (checkWinOrDraw(player)) return;

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateStatus();
}

function checkWinOrDraw(player) {
    let winningLine = null;

    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            winningLine = condition;
            break;
        }
    }

    if (winningLine) {
        isGameActive = false;
        winningLine.forEach(i => cells[i].classList.add('highlight'));
        scores[player]++;
        endGame(`🎉 Player ${player} Wins! 🎉`);
        return true;
    }

    if (!board.includes("")) {
        isGameActive = false;
        scores.Draws++;
        endGame("🤝 It's a Draw! 🤝");
        return true;
    }
    return false;
}

function endGame(message) {
    updateScoreBoard();
    overlayMsg.textContent = message;
    setTimeout(() => {
        gameOverOverlay.classList.remove('hidden');
    }, 800);
}

function updateScoreBoard() {
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
    scoreDrawsEl.textContent = scores.Draws;
}

//  AI Logic 
function makeComputerMove() {
    if (!isGameActive) return;
    let moveIndex;

    if (difficulty === 'easy') {
        moveIndex = getRandomMove();
    } else if (difficulty === 'medium') {
        moveIndex = getMediumMove();
    } else {
        moveIndex = getBestMove();
    }

    processMove(moveIndex, aiPlayer);
}

function getAvailableMoves() {
    return board.map((val, idx) => val === "" ? idx : null).filter(val => val !== null);
}

function getRandomMove() {
    const moves = getAvailableMoves();
    return moves[Math.floor(Math.random() * moves.length)];
}

function getMediumMove() {
    const humanPlayer = aiPlayer === "X" ? "O" : "X";
    
    // 1. Try to win
    let move = findWinningMove(aiPlayer);
    if (move !== null) return move;
    
    // 2. Block human from winning
    move = findWinningMove(humanPlayer);
    if (move !== null) return move;
    
    // 3. Otherwise random
    return getRandomMove();
}

function findWinningMove(player) {
    const moves = getAvailableMoves();
    for (let i of moves) {
        board[i] = player;
        let isWinning = winConditions.some(cond => 
            board[cond[0]] === player && 
            board[cond[1]] === player && 
            board[cond[2]] === player
        );
        board[i] = "";
        if (isWinning) return i;
    }
    return null;
}

// Minimax for Hard mode
function getBestMove() {
    let bestScore = -Infinity;
    let move;
    const moves = getAvailableMoves();

    for (let i of moves) {
        board[i] = aiPlayer;
        let score = minimax(board, 0, false);
        board[i] = "";
        if (score > bestScore) {
            bestScore = score;
            move = i;
        }
    }
    return move;
}

function minimax(boardState, depth, isMaximizing) {
    const humanPlayer = aiPlayer === "X" ? "O" : "X";
    let result = checkWinnerForMinimax();
    
    if (result === aiPlayer) return 10 - depth;
    if (result === humanPlayer) return depth - 10;
    if (result === "tie") return 0;

    const moves = getAvailableMoves();

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i of moves) {
            boardState[i] = aiPlayer;
            let score = minimax(boardState, depth + 1, false);
            boardState[i] = "";
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i of moves) {
            boardState[i] = humanPlayer;
            let score = minimax(boardState, depth + 1, true);
            boardState[i] = "";
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
}

function checkWinnerForMinimax() {
    for (let cond of winConditions) {
        const [a, b, c] = cond;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (!board.includes("")) return "tie";
    return null;
}