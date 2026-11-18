# Reusable chessboard component

The shared board renderer lives in `assets/chessboard.js` and its responsive presentation in `assets/chessboard.css`.

## Dependencies

The host page supplies a chess.js-compatible game object. The board itself has no dependency on a piece-image CDN: all six piece types are drawn as local inline SVG silhouettes, with light pieces in warm white and dark pieces in charcoal, both outlined for contrast.

## Basic integration

```html
<link rel="stylesheet" href="assets/chessboard.css">
<div id="board"></div>
<script src="path/to/chess.js"></script>
<script src="assets/chessboard.js"></script>
<script>
  const game = new Chess();
  const board = ChessBoard.mount(document.getElementById("board"), {
    getGame: () => game,
    orientation: "white",
    onMove: (move, currentGame) => console.log(move, currentGame.fen())
  });
</script>
```

## Options

- `getGame()`: required; returns the current chess.js-compatible game.
- `orientation`: `"white"` (default) or `"black"`.
- `canSelectPiece(piece, square, game)`: optional guard to restrict which side or pieces the user can select. Return `true` to allow selection.
- `getPromotion(from, to, game)`: optional callback returning the promotion piece type.
- `promotion`: default promotion type when no callback is supplied; defaults to `"q"`.
- `onMove(move, game)`: called after a legal move.
- `onSelection(square, targets)`: called when selection changes.
- `onRender(game)`: called after each render.

## Board methods

- `render()`
- `setOrientation("white" | "black")`
- `flip()`
- `setHint(from, to)`
- `clearHint()`
- `setLastMove(move | null)`
- `destroy()`

## Behaviour and boundaries

- The component renders all 64 squares, coordinate labels and legal destination/capture indicators.
- The host owns move history, navigation, clocks, puzzle validation and feedback.
- The default promotion is a queen; hosts needing a choice should implement `getPromotion`.
- The board is designed to fit within a fluid container, with a maximum width of 680px and smaller coordinate gutters on narrow screens.
- Run `node scripts/test-chessboard.js` for dependency-free component interaction tests.
