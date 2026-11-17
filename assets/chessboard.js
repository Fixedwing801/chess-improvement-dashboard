/* Reusable Chess Improvement Lab board.
 * Requires a chess.js-compatible game object supplied by the host page.
 */
(() => {
  "use strict";
  const FILES = "abcdefgh";
  const PIECES = { k:"king", q:"queen", r:"rook", b:"bishop", n:"knight", p:"pawn" };

  function mount(root, options = {}) {
    if (!root) throw new Error("ChessBoard.mount requires a root element.");
    if (typeof options.getGame !== "function") throw new Error("ChessBoard requires getGame().");

    let orientation = options.orientation === "black" ? "black" : "white";
    let selected = null;
    let targets = [];
    let lastMove = null;
    let hint = null;
    const pieceBase = options.pieceBase || "https://images.chesscomfiles.com/chess-themes/pieces/classic/150/";

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
          const image = document.createElement("img");
          image.className = "cl-piece";
          image.alt = "";
          image.draggable = false;
          image.src = pieceBase + piece.color + piece.type + ".png";
          image.onerror = () => { image.replaceWith(document.createTextNode(piece.type.toUpperCase())); };
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
      if (piece && piece.color === game.turn()) {
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