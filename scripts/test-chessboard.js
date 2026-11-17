const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this._className = "";
    this.classList = {
      add: (...names) => {
        const current = new Set(this._className.split(/\s+/).filter(Boolean));
        names.forEach(name => current.add(name));
        this._className = [...current].join(" ");
      },
      contains: name => this._className.split(/\s+/).includes(name)
    };
  }
  set className(value) { this._className = value; }
  get className() { return this._className; }
  append(...elements) { this.children.push(...elements); }
  replaceChildren(...elements) { this.children = [...elements]; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  click() { if (this.listeners.click) this.listeners.click(); }
}

const document = {
  createElement: tag => new FakeElement(tag),
  createElementNS: (_namespace, tag) => new FakeElement(tag)
};
const window = {};
const source = fs.readFileSync("assets/chessboard.js", "utf8");
assert(!source.includes("images.chesscomfiles.com"), "piece artwork must not rely on the old external CDN");
vm.runInNewContext(source, { window, document });

const state = {
  e2: { color: "w", type: "p" },
  e7: { color: "b", type: "p" }
};
let sideToMove = "w";
const game = {
  get: square => state[square] || null,
  turn: () => sideToMove,
  moves: ({ square }) => square === "e2" && sideToMove === "w"
    ? [{ from: "e2", to: "e4" }]
    : square === "e7" && sideToMove === "b"
      ? [{ from: "e7", to: "e5" }]
      : [],
  move: ({ from, to }) => {
    const legal = (from === "e2" && to === "e4" && sideToMove === "w") ||
      (from === "e7" && to === "e5" && sideToMove === "b");
    if (!legal) return null;
    const piece = state[from];
    delete state[from];
    state[to] = piece;
    sideToMove = sideToMove === "w" ? "b" : "w";
    return { from, to, color: piece.color, piece: piece.type };
  }
};

const root = new FakeElement("div");
let moved = null;
const board = window.ChessBoard.mount(root, {
  getGame: () => game,
  canSelectPiece: piece => piece.color === "w",
  onMove: move => { moved = move; }
});
const shell = root.children[0];
const grid = shell.children[1];
assert.equal(grid.children.length, 64, "renders all 64 squares");
assert.equal(grid.children[0].dataset.square, "a8", "white orientation starts at a8");
assert(grid.children.find(square => square.dataset.square === "e2").children[0], "renders a local SVG piece");

grid.children.find(square => square.dataset.square === "e2").click();
console.log("e4 target debug:", grid.children.find(square => square.dataset.square === "e4").className);
assert(grid.children.find(square => square.dataset.square === "e4").classList.contains("cl-target"), "shows legal target");
grid.children.find(square => square.dataset.square === "e4").click();
assert.deepEqual(moved && [moved.from, moved.to], ["e2", "e4"], "sends legal move to host callback");
assert.equal(game.get("e4").type, "p", "updates supplied game state");

grid.children.find(square => square.dataset.square === "e7").click();
assert(!grid.children.find(square => square.dataset.square === "e7").classList.contains("cl-selected"),
  "honours host selection guard for the opponent's piece");

assert.equal(board.flip(), "black", "flips orientation");
assert.equal(grid.children[0].dataset.square, "h1", "black orientation starts at h1");
board.setHint("e4", "e5");
assert(grid.children.find(square => square.dataset.square === "e4").classList.contains("cl-hint"), "renders hint highlight");
board.clearHint();
board.setLastMove({ from: "e2", to: "e4" });
assert(grid.children.find(square => square.dataset.square === "e4").classList.contains("cl-last"), "renders last-move highlight");
board.destroy();
assert.equal(root.children.length, 0, "destroy clears mounted board");
console.log("Chessboard component tests passed.");
