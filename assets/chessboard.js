/* Reusable Chess Improvement Lab board.
 * Requires a chess.js-compatible game object supplied by the host page.
 */
(() => {
  "use strict";
  const FILES = "abcdefgh";
  const PIECES = { k:"king", q:"queen", r:"rook", b:"bishop", n:"knight", p:"pawn" };
  // Traditional Staunton silhouettes: broad bases, recognisable crowns,
  // horse-head knights and mitred bishops. Kept as local SVG for reliability.
  const PIECE_ART = {
    k: '<path d="M46 4h8v10h10v8H54v10h-8V22H36v-8h10z M50 32c-15 0-27 8-30 20-2 8 2 15 9 20l-7 7h56l-7-7c7-5 11-12 9-20-3-12-15-20-30-20z M18 78h64l8 9H10z"/><path d="M31 49c-5 6-4 13 2 18l-5 8h13c-5-8-6-16-4-25z" fill="#9b9da0" stroke="none"/>',
    q: '<path d="M18 25l12 13 9-21 11 22 11-22 9 21 12-13-8 45H26z M17 72h66l8 14H9z"/><path d="M13 15a5 5 0 1 0 10 0 5 5 0 1 0-10 0 M44 8a5 5 0 1 0 10 0 5 5 0 1 0-10 0 M75 15a5 5 0 1 0 10 0 5 5 0 1 0-10 0"/><path d="M31 43l9-20 8 22-5 26H30z" fill="#a4a5a7" stroke="none"/>',
    r: '<path d="M15 12h14v13h8V12h13v13h8V12h14v22H15z M25 34h50l-5 9 6 30H24l6-30z M18 73h64l8 13H10z"/><path d="M36 43h28l-3 27H33z" fill="#a3a4a6" stroke="none"/>',
    b: '<path d="M50 7C38 19 27 32 28 45c1 11 8 17 17 21l-9 9h28l-9-9c9-4 16-10 17-21C73 32 62 19 50 7z M18 76h64l8 11H10z"/><path d="M50 17l-7 25 9 9-5 15h12l-5-19 5-12z" fill="#a2a4a6" stroke="none"/><path d="M49 15l-7 28" fill="none" stroke="#30343a" stroke-width="4"/>',
    n: '<path d="M20 76c6-10 10-20 10-31 0-16 10-29 25-37l8 10 15 8-8 11 10 11-12 10-4 18z M18 77h64l8 10H10z"/><path d="M35 31c7-10 15-16 23-19l7 10-8 7c10 8 17 17 14 29-2 8-8 13-17 16l-23-1c8-10 11-19 10-27z" fill="#a1a3a6" stroke="none"/><path d="M37 31q5-6 12-5" fill="none" stroke="#30343a" stroke-width="4"/><circle cx="40" cy="31" r="2.8" fill="#30343a" stroke="none"/>',
    p: '<path d="M50 12c-11 0-18 8-18 19 0 8 4 14 11 18l-7 24H64l-7-24c7-4 11-10 11-18 0-11-7-19-18-19z M20 73h60l8 14H12z"/><path d="M39 50c4 5 8 8 14 10l10 13H37l6-23z" fill="#a2a4a6" stroke="none"/>'
  };

  function mount(root, options = {}) {
    if (!root) throw new Error("ChessBoard.mount requires a root element.");
    if (typeof options.getGame !== "function") throw new Error("ChessBoard requires getGame().");
    let orientation = options.orientation === "black" ? "black" : "white";
    let selected = null, targets = [], lastMove = null, hint = null;
    const shell = document.createElement("div"); shell.className = "cl-board-shell";
    const rankLabels = document.createElement("div"); rankLabels.className = "cl-board-ranks";
    const board = document.createElement("div"); board.className = "cl-board";
    board.setAttribute("role", "group"); board.setAttribute("aria-label", "Interactive chessboard");
    const files = document.createElement("div"); files.className = "cl-board-files";
    shell.append(rankLabels, board, files); root.replaceChildren(shell);

    function squareOrder() {
      return {
        ranks: orientation === "white" ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8],
        filesInOrder: orientation === "white" ? [...FILES] : [...FILES].reverse()
      };
    }
    function render() {
      const game = options.getGame(); if (!game) return;
      const order = squareOrder();
      rankLabels.replaceChildren(); files.replaceChildren(); board.replaceChildren();
      order.ranks.forEach(rank => { const el=document.createElement("span"); el.textContent=String(rank); rankLabels.append(el); });
      files.append(document.createElement("span"));
      order.filesInOrder.forEach(file => { const el=document.createElement("span"); el.textContent=file; files.append(el); });
      order.ranks.forEach(rank => order.filesInOrder.forEach(file => {
        const square=file+rank, piece=game.get(square), cell=document.createElement("button");
        cell.type="button"; cell.className="cl-square "+((FILES.indexOf(file)+rank)%2?"cl-dark":"cl-light");
        cell.dataset.square=square;
        cell.setAttribute("aria-label",square+(piece?", "+(piece.color==="w"?"White ":"Black ")+PIECES[piece.type]:", empty"));
        if(selected===square) cell.classList.add("cl-selected");
        if(targets.includes(square)){cell.classList.add("cl-target");if(piece)cell.classList.add("cl-capture");}
        if(lastMove&&(lastMove.from===square||lastMove.to===square))cell.classList.add("cl-last");
        if(hint&&(hint.from===square||hint.to===square))cell.classList.add("cl-hint");
        if(piece){
          const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
          svg.setAttribute("viewBox","0 0 100 100");svg.setAttribute("class","cl-piece "+(piece.color==="w"?"cl-piece-white":"cl-piece-black"));
          svg.setAttribute("aria-hidden","true");svg.setAttribute("focusable","false");svg.innerHTML=PIECE_ART[piece.type];cell.append(svg);
        }
        cell.addEventListener("click",()=>handleSquare(square));board.append(cell);
      }));
      if(typeof options.onRender==="function")options.onRender(game);
    }
    function handleSquare(square){
      const game=options.getGame();
      if(selected){
        const move=game.move({from:selected,to:square,promotion:typeof options.getPromotion==="function"?options.getPromotion(selected,square,game):(options.promotion||"q")});
        if(move){lastMove={from:move.from,to:move.to};selected=null;targets=[];hint=null;if(typeof options.onMove==="function")options.onMove(move,game);render();return;}
      }
      const piece=game.get(square);
      if(piece&&piece.color===game.turn()&&(typeof options.canSelectPiece!=="function"||options.canSelectPiece(piece,square,game))){
        selected=square;targets=game.moves({square,verbose:true}).map(move=>move.to);
      }else{selected=null;targets=[];}
      if(typeof options.onSelection==="function")options.onSelection(selected,targets.slice());render();
    }
    render();
    return {
      render,
      setOrientation(value){orientation=value==="black"?"black":"white";render();},
      flip(){orientation=orientation==="white"?"black":"white";render();return orientation;},
      setHint(from,to){hint={from,to};selected=from;targets=[to];render();},
      clearHint(){hint=null;selected=null;targets=[];render();},
      setLastMove(move){lastMove=move?{from:move.from,to:move.to}:null;render();},
      destroy(){root.replaceChildren();}
    };
  }
  window.ChessBoard={mount};
})();