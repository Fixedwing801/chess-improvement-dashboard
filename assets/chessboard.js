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
    k: '<path d="M46 5h8v9h9v8h-9v8h-8v-8h-9v-8h9z M30 39c0-8 9-13 20-13s20 5 20 13l-5 7 8 27H27l8-27z M23 73h54l8 12H15z"/>',
    q: '<path d="M19 26l13 16 10-22 8 20 8-20 10 22 13-16-7 43H26z M17 72h66l7 13H10z M16 16a5 5 0 1 0 10 0 5 5 0 1 0-10 0 M44 10a5 5 0 1 0 10 0 5 5 0 1 0-10 0 M72 16a5 5 0 1 0 10 0 5 5 0 1 0-10 0"/>',
    r: '<path d="M17 12h13v12h8V12h12v12h8V12h13v20H17z M25 32h50l-4 10 5 31H24l5-31z M19 73h62l7 12H12z"/>',
    b: '<path d="M50 8c-12 10-21 22-21 34 0 10 7 17 16 21l-8 10h26l-8-10c9-4 16-11 16-21C71 30 62 18 50 8z M50 19l-5 23 10 7 M20 73h60l7 12H13z"/>',
    n: '<path d="M22 72c5-10 8-18 8-28 0-15 10-27 25-35l7 10 15 8-8 10 9 10-11 8-3 17z M35 30l12 2-5 7 M54 27l-4 4 M18 73h62l7 12H11z"/>',
    p: '<path d="M50 12c-10 0-17 8-17 18 0 8 4 14 11 18l-7 24h26l-7-24c7-4 11-10 11-18 0-10-7-18-17-18z M20 73h60l7 12H13z"/>'
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