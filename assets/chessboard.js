/* Reusable Chess Improvement Lab board.
 * Requires a chess.js-compatible game object supplied by the host page.
 */
(() => {
  "use strict";
  const FILES = "abcdefgh";
  const PIECES = { k:"king", q:"queen", r:"rook", b:"bishop", n:"knight", p:"pawn" };
  const PIECE_ART = {
    k: '<path d="M50 8v19 M39 17h22 M35 33h30l-4 12 12 33H27l12-33z M22 78h56l7 10H15z"/>',
    q: '<path d="M22 30l13 16 15-25 15 25 13-16-5 39H27z M25 69h50l7 10H18z M17 18a5 5 0 1 0 10 0 5 5 0 1 0-10 0 M45 13a5 5 0 1 0 10 0 5 5 0 1 0-10 0 M73 18a5 5 0 1 0 10 0 5 5 0 1 0-10 0"/>',
    r: '<path d="M24 15h13v13h8V15h10v13h8V15h13v28H24z M31 43h38l-5 30H36z M25 73h50l8 12H17z"/>',
    b: '<path d="M50 8c-7 10-16 15-16 27 0 8 6 14 13 18L34 72h32L53 53c8-4 13-10 13-18C66 23 57 17 50 8z M25 72h50l8 13H17z"/><path d="M43 25l14 16" fill="none"/>',
    n: '<path d="M24 78c5-10 7-20 5-30-2-12 4-23 17-31l5-7 4 11 14 9-7 9 8 10-9 6-3 23z M23 78h52l8 10H15z M46 28l10 2"/>',
    p: '<path d="M50 13c-10 0-17 8-17 18 0 8 5 14 12 17L34 72h32L55 48c7-3 12-9 12-17 0-10-7-18-17-18z M25 72h50l8 13H17z"/>'
  };

  function mount(root, options = {}) {
    if (!root) throw new Error("ChessBoard.mount requires a root element.");
    if (typeof options.getGame !== "function") throw new Error("ChessBoard requires getGame().");

    let orientation = options.orientation === "black" ? "black" : "white";
    let selected = null;
    let targets = [];
    let lastMove = null;
    let hint = null;

    const shell = document.createElement("div");
    shell.className = "cl-board-shell";
    const rankLabels = document.createElement("div");
    rankLabels.className = "cl-board-ranks";
    const board = document.createElement("div");
    board.className = "cl-board";
    board.setAttribute("role", "group");
    board.setAttribute("aria-label", "Interactive chessboard");
    const files = document.createElement("div");
    files.className = "cl-board-files";
    shell.append(rankLabels, board, files);
    root.replaceChildren(shell);

    function squareOrder() {
      const ranks = orientation === "white" ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8];
      const filesInOrder = orientation === "white" ? [...FILES] : [...FILES].reverse();
      return { ranks, filesInOrder };
    }

    function render() {
      const game = options.getGame();
      if (!game) return;
      const order = squareOrder();
      rankLabels.replaceChildren();
      files.replaceChildren();
      board.replaceChildren();

      order.ranks.forEach(rank => {
        const label = document.createElement("span");
        label.textContent = String(rank);
        rankLabels.append(label);
      });
      files.append(document.createElement("span"));
      order.filesInOrder.forEach(file => {
        const label = document.createElement("span");
        label.textContent = file;
        files.append(label);
      });

      order.ranks.forEach(rank => order.filesInOrder.forEach(file => {
        const square = file + rank;
        const piece = game.get(square);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cl-square " + ((FILES.indexOf(file) + rank) % 2 ? "cl-dark" : "cl-light");
        cell.dataset.square = square;
        cell.setAttribute("aria-label", square + (piece ? ", " + (piece.color === "w" ? "White " : "Black ") + PIECES[piece.type] : ", empty"));
        if (selected === square) cell.classList.add("cl-selected");
        if (targets.includes(square)) {
          cell.classList.add("cl-target");
          if (piece) cell.classList.add("cl-capture");
        }
        if (lastMove && (lastMove.from === square || lastMove.to === square)) cell.classList.add("cl-last");
        if (hint && (hint.from === square || hint.to === square)) cell.classList.add("cl-hint");

        if (piece) {
          const image = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          image.setAttribute("viewBox", "0 0 100 100");
          image.setAttribute("class", "cl-piece " + (piece.color === "w" ? "cl-piece-white" : "cl-piece-black"));
          image.setAttribute("aria-hidden", "true");
          image.setAttribute("focusable", "false");
          image.innerHTML = PIECE_ART[piece.type];
          cell.append(image);
        }
        cell.addEventListener("click", () => handleSquare(square));
        board.append(cell);
      }));
      if (typeof options.onRender === "function") options.onRender(game);
    }

    function handleSquare(square) {
      const game = options.getGame();
      if (selected) {
        const move = game.move({
          from: selected,
          to: square,
          promotion: typeof options.getPromotion === "function" ? options.getPromotion(selected, square, game) : (options.promotion || "q")
        });
        if (move) {
          lastMove = { from: move.from, to: move.to };
          selected = null;
          targets = [];
          hint = null;
          if (typeof options.onMove === "function") options.onMove(move, game);
          render();
          return;
        }
      }
      const piece = game.get(square);
      if (piece && piece.color === game.turn() &&
          (typeof options.canSelectPiece !== "function" || options.canSelectPiece(piece, square, game))) {
        selected = square;
        targets = game.moves({ square, verbose: true }).map(move => move.to);
      } else {
        selected = null;
        targets = [];
      }
      if (typeof options.onSelection === "function") options.onSelection(selected, targets.slice());
      render();
    }

    render();
    return {
      render,
      setOrientation(value) {
        orientation = value === "black" ? "black" : "white";
        render();
      },
      flip() {
        orientation = orientation === "white" ? "black" : "white";
        render();
        return orientation;
      },
      setHint(from, to) {
        hint = { from, to };
        selected = from;
        targets = [to];
        render();
      },
      clearHint() {
        hint = null;
        selected = null;
        targets = [];
        render();
      },
      setLastMove(move) {
        lastMove = move ? { from: move.from, to: move.to } : null;
        render();
      },
      destroy() {
        root.replaceChildren();
      }
    };
  }

  window.ChessBoard = { mount };
})();