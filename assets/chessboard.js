/* Reusable Chess Improvement Lab board.
 * Requires a chess.js-compatible game object supplied by the host page.
 */
(() => {
  "use strict";
  const FILES = "abcdefgh";
  const PIECES = { k:"king", q:"queen", r:"rook", b:"bishop", n:"knight", p:"pawn" };
  // Staunton artwork adapted from DeepMind OpenSpiel (Apache-2.0).
  const slab = half => {
    const l=50-half,r=50+half;
    return `M50 87.5H${r-3}Q${r} 87.5 ${r} 84.5V83.5Q${r} 80.5 ${r-3} 80.5H${l+3}Q${l} 80.5 ${l} 83.5V84.5Q${l} 87.5 ${l+3} 87.5Z`;
  };
  const circle = (x,y,r) => `M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 -${2*r} 0z`;
  const PIECE_ART = {
    p:[[slab(28),"body"],["M40 51.5C37.5 61.5 32 71 24.5 80.5H75.5C68 71 62.5 61.5 60 51.5Z","body"],["M36 43.5H64Q68 43.5 68 47.5Q68 51.5 64 51.5H36Q32 51.5 32 47.5Q32 43.5 36 43.5Z","body"],[circle(50,30,13.5),"body"],["M36 51.5H64M24.5 80.5H75.5","inner"]],
    r:[[slab(29),"body"],["M24 80.5H76V76.5C70 75.5 64.5 72 64.5 67L63.5 40.5C63.5 36.5 68 34 72 33.5V18H64.5V24H55.5V18H44.5V24H35.5V18H28V33.5C32 34 36.5 36.5 36.5 40.5L35.5 67C35.5 72 30 75.5 24 76.5Z","body"],["M24 80.5H76M36.5 40.5H63.5M28 33.5H72","line"]],
    b:[["M22 87.5H78Q81 87.5 81 85C81 82.5 77.5 81.5 73.5 80.5H26.5C22.5 81.5 19 82.5 19 85Q19 87.5 22 87.5Z","body"],["M40 67.5C40 74 34.5 78 26.5 80.5H73.5C65.5 78 60 74 60 67.5Z","body"],["M36 60.5H64Q67.5 60.5 67.5 64Q67.5 67.5 64 67.5H36Q32.5 67.5 32.5 64Q32.5 60.5 36 60.5Z","body"],["M38.5 60.5C27 54 26.5 40.5 35.5 31.5C40.5 26.5 46.5 22 50 17C53.5 22 59.5 26.5 64.5 31.5C73.5 40.5 73 54 61.5 60.5Z","body"],[circle(50,12,5.5),"body"],["M59 34.5L45.5 50","line"],["M36 60.5H64M36 67.5H64M26.5 80.5H73.5","inner"]],
    n:[[slab(28),"body"],["M31 80.5C31.5 76.5 33 72.5 37 68.5C41 64.5 45 59.5 45.5 52.5C42.5 55.5 38.5 58.5 33 59C30 59.3 27.5 58 26 56C23 57 19 57.2 16.5 56C13.5 54.5 12.5 51 13.5 48.5C15 45 18.5 42.5 22 39.5C28.5 35 34.5 29.5 38 21.5C38.5 16 39 12 40.5 9C43 12 45 14.5 45.5 17.5C46.5 15 48.5 12.5 50.5 11.5C51.5 14 52 16.5 52.5 19.5C62 21.5 70.5 29 74 40C78 52 77 66 75 80.5Z","body"],[circle(37,31.5,2.4),"dot"],[circle(17.5,50,1.5),"dot"],["M54 25.5C62 28 67.5 34 70 42.5C72.5 51 72.5 62 71 74M45.5 52.5C44.5 48 41.5 45 37.5 43.5","line"],["M31 80.5H75","inner"]],
    q:[[slab(30),"body"],["M23 80.5H77C70 79 65.5 74 64.5 68C64 64.5 64.5 62 66 59.5C73 53.5 81 44 85 30Q78 40 73 42.5Q71 34 68.5 23Q63.5 34 58.5 40Q54 32 50 19Q46 32 41.5 40Q36.5 34 31.5 23Q29 34 27 42.5Q22 40 15 30C19 44 27 53.5 34 59.5C35.5 62 36 64.5 35.5 68C34.5 74 30 79 23 80.5Z","body"],[[circle(15,27,4.6),circle(31.5,19.5,4.6),circle(50,14.5,4.6),circle(68.5,19.5,4.6),circle(85,27,4.6)].join(""),"body"],["M34 59.5C44.5 56.5 55.5 56.5 66 59.5M35.5 68C45 66 55 66 64.5 68M23 80.5H77","line"]],
    k:[[slab(30),"body"],["M47.5 22V15H42V10H47.5V4.5H52.5V10H58V15H52.5V22Z","body"],["M25 80.5C29 79 31 76 30.5 72L28 64C20 60.5 15 54 15 46.5C15 37.9 21.9 31 30.5 31C37 31 42.5 34.5 45 40C47 41.5 53 41.5 55 40C57.5 34.5 63 31 69.5 31C78.1 31 85 37.9 85 46.5C85 54 80 60.5 72 64L69.5 72C69 76 71 79 75 80.5Z","body"],["M50 21.5C54.5 23.5 58 27.5 58 32.5C58 37 54.5 40.5 50 41.5C45.5 40.5 42 37 42 32.5C42 27.5 45.5 23.5 50 21.5Z","body"],["M21 49C21 42 25.5 37.5 31 37M79 49C79 42 74.5 37.5 69 37M44.5 42C38 47 34.5 55 34 62.5M55.5 42C62 47 65.5 55 66 62.5","line"],["M28 64C42.5 60.5 57.5 60.5 72 64M30.5 72C43.5 70 56.5 70 69.5 72M25 80.5H75","line"]]
  };


  // Remove only edge-connected near-black background pixels from white-piece PNGs.
  // Black outline pixels enclosed by the artwork are preserved.
  function removeEdgeBlackBackground(img) {
    if (img.dataset.bgProcessed === "true") return;
    try {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) return;
      const canvas = document.createElement("canvas"); canvas.width=w; canvas.height=h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img,0,0,w,h);
      const data=ctx.getImageData(0,0,w,h).data;
      const seen=new Uint8Array(w*h), stack=[];
      const isBackground=(i)=>data[i*4]<35&&data[i*4+1]<35&&data[i*4+2]<35&&data[i*4+3]>0;
      const push=(x,y)=>{const n=y*w+x;if(!seen[n]&&isBackground(n)){seen[n]=1;stack.push(n);}};
      for(let x=0;x<w;x++){push(x,0);push(x,h-1);}
      for(let y=0;y<h;y++){push(0,y);push(w-1,y);}
      while(stack.length){const n=stack.pop(),x=n%w,y=(n/w)|0;
        data[n*4+3]=0;
        if(x>0)push(x-1,y);if(x<w-1)push(x+1,y);if(y>0)push(x,y-1);if(y<h-1)push(x,y+1);
      }
      // Preserve all connected artwork: the source pieces include legitimate
      // detached details. Remove tiny isolated alpha fragments only, then
      // neutralise gold/brown chroma while preserving luminance and alpha.
      const labels=new Int32Array(w*h);
      let id=0;
      const componentSizes=[];
      for(let start=0;start<w*h;start++){
        if(labels[start]||data[start*4+3]===0)continue;
        id++; stack.push(start); labels[start]=id; let size=0;
        while(stack.length){
          const n=stack.pop(),x=n%w,y=(n/w)|0; size++;
          const visit=(m)=>{if(!labels[m]&&data[m*4+3]>0){labels[m]=id;stack.push(m);}};
          if(x>0)visit(n-1);if(x<w-1)visit(n+1);if(y>0)visit(n-w);if(y<h-1)visit(n+w);
        }
        componentSizes[id]=size;
      }
      const largest=Math.max(...componentSizes.slice(1));
      const minComponent=Math.max(24,Math.floor(largest*0.00015));
      for(let i=0;i<w*h;i++){
        const j=i*4;
        if(labels[i]&&componentSizes[labels[i]]<minComponent){data[j+3]=0;continue;}
        const r=data[j],g=data[j+1],b=data[j+2],a=data[j+3];
        // White Staunton artwork must be neutral white/grey, not sepia.
        // Convert every retained pixel (not just strongly chromatic pixels)
        // to luminance; this removes subtle tan casts without changing shape,
        // alpha, outlines, highlights or detached legitimate details.
        if(a>0){
          const gray=Math.round(0.299*r+0.587*g+0.114*b);
          // Keep near-black contour pixels as outlines, but remap the
          // original sepia/grey fill to a clean warm white. Grayscale alone
          // preserved the source's dark midtones and made white pieces look
          // charcoal in the browser screenshots.
          const neutral=gray<48?gray:Math.round(218+(gray-48)*37/207);
          data[j]=data[j+1]=data[j+2]=neutral;
        }
      }
      ctx.putImageData(new ImageData(data,w,h),0,0);
      img.dataset.bgProcessed="true"; img.src=canvas.toDataURL("image/png");
    } catch (err) { console.warn("Chessboard background transparency processing skipped",err); }
  }

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
          svg.setAttribute("viewBox","0 0 100 100");
          svg.setAttribute("class","cl-piece "+(piece.color==="w"?"cl-piece-white":"cl-piece-black"));
          svg.setAttribute("aria-hidden","true");
          svg.setAttribute("focusable","false");
          const group=document.createElementNS("http://www.w3.org/2000/svg","g");
          group.setAttribute("stroke-width","3.3");group.setAttribute("stroke-linecap","round");group.setAttribute("stroke-linejoin","round");
          PIECE_ART[piece.type].forEach(([d,paint])=>{
            if(paint==="inner"&&piece.color==="w")return;
            const path=document.createElementNS("http://www.w3.org/2000/svg","path");
            path.setAttribute("d",d);
            if(paint==="body"){path.setAttribute("fill",piece.color==="w"?"#f7f6f2":"#55565a");path.setAttribute("stroke","#30343a");}
            else if(paint==="dot"){path.setAttribute("fill",piece.color==="w"?"#30343a":"#e5e5e5");path.setAttribute("stroke","none");}
            else {path.setAttribute("fill","none");path.setAttribute("stroke",piece.color==="w"?"#30343a":"#e5e5e5");}
            group.append(path);
          });
          svg.append(group);
          cell.append(svg);
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