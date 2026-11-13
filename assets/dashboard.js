(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const root = $("content");
const fmt = (n) => Number(n || 0).toLocaleString("en-GB");
const num = (n, digits=1) => n == null ? "—" : Number(n).toFixed(digits);
function make(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = String(text);
  return e;
}
function panel(title, tag) {
  const p = make("section", "panel");
  const h = make("div", "panel-head");
  h.append(make("h2", "", title));
  if (tag) h.append(make("span", "panel-tag", tag));
  p.append(h);
  return p;
}
function metric(label, value, detail) {
  const c = make("article", "card");
  c.append(make("span", "metric-label", label));
  c.append(make("strong", "metric-value", value));
  if (detail) c.append(make("span", "metric-detail", detail));
  return c;
}
function note(text) { return make("p", "note", text); }
function bars(items, valueKey="average_cpl", countKey="games") {
  const wrap = make("div", "bar-list");
  if (!items || !items.length) { wrap.append(make("p", "", "No data available yet.")); return wrap; }
  const max = Math.max(1, ...items.map(x => Number(x[valueKey]) || 0));
  items.forEach((item, i) => {
    const row = make("div", "bar-row");
    row.append(make("span", "bar-label", item.name || "Other"));
    const track = make("div", "track");
    const fill = make("div", "fill" + (i % 2 ? " gold" : ""));
    fill.style.width = Math.max(0, Math.min(100, (Number(item[valueKey]) || 0) / max * 100)) + "%";
    track.append(fill);
    row.append(track);
    const detail = item[valueKey] == null ? "—" : num(item[valueKey]) + " CPL";
    row.append(make("strong", "bar-value", detail));
    wrap.append(row);
    if (countKey && item[countKey] != null) row.title = fmt(item[countKey]) + " games";
  });
  return wrap;
}
function table(headers, rows) {
  const wrap = make("div", "table-wrap");
  const t = make("table");
  const thead = make("thead"), hr = make("tr");
  headers.forEach((h, i) => hr.append(make("th", i ? "num" : "", h)));
  thead.append(hr); t.append(thead);
  const tbody = make("tbody");
  rows.forEach(row => {
    const tr = make("tr");
    row.forEach((value, i) => {
      const td = make("td", i ? "num" : "", value);
      tr.append(td);
    });
    tbody.append(tr);
  });
  t.append(tbody); wrap.append(t); return wrap;
}
function record(d) {
  return d.results.wins + " wins · " + d.results.draws + " draws · " + d.results.losses + " losses";
}
function renderOverview(d) {
  const g=d.games, r=d.results;
  const hero=make("section","hero");
  hero.append(make("p","kicker","Current baseline"));
  hero.append(make("h2","","A growing picture of your chess performance"));
  hero.append(make("p","","The analysis now combines "+fmt(g.analysed)+" games. Your current score rate is "+num(r.score_rate_pct,1)+"%."));
  root.append(hero);
  const grid=make("div","grid");
  grid.append(metric("Games analysed",fmt(g.analysed),fmt(g.discovered)+" discovered"));
  grid.append(metric("Score rate",num(r.score_rate_pct,1)+"%",record(d)));
  grid.append(metric("Your average CPL",num(d.accuracy.user_average_cpl),"Lower is better; engine estimate"));
  grid.append(metric("Opponent average CPL",num(d.accuracy.opponent_average_cpl),"Same analysis method"));
  root.append(grid);
  const progress=panel("Historical import","Coverage");
  const pct=100*g.analysed/Math.max(1,g.discovered);
  progress.append(make("p","",""+fmt(g.analysed)+" of "+fmt(g.discovered)+" games analysed; "+fmt(g.waiting)+" awaiting analysis."));
  const bar=make("div","progress"), fill=make("div","progress-fill");
  fill.style.width=pct+"%"; bar.append(fill); progress.append(bar);
  progress.append(make("p","metric-detail",num(pct,1)+"% complete. The historical archive is processed in batches."));
  root.append(progress);
  const phase=panel("Performance by game phase","Lower CPL is better");
  phase.append(bars(d.phases,"average_cpl","games_with_data"));
  phase.append(note("Phase sample counts can overlap because one game may contain opening, middlegame and endgame moves."));
  root.append(phase);
  const summary=panel("Results","Current analysed sample");
  summary.append(table(["Outcome","Games"],[["Wins",fmt(r.wins)],["Draws",fmt(r.draws)],["Losses",fmt(r.losses)]]));
  root.append(summary);
}
function renderPerformance(d) {
  const g=make("div","grid");
  g.append(metric("Average user CPL",num(d.accuracy.user_average_cpl),"Across analysed games"));
  g.append(metric("Average opponent CPL",num(d.accuracy.opponent_average_cpl),"Same Stockfish method"));
  g.append(metric("White CPL",num((d.colours.find(x=>x.name==="White")||{}).average_cpl),"White-side average"));
  g.append(metric("Black CPL",num((d.colours.find(x=>x.name==="Black")||{}).average_cpl),"Black-side average"));
  root.append(g);
  const p=panel("Performance by phase","Lower CPL is better");
  p.append(bars(d.phases,"average_cpl","games_with_data"));
  p.append(note("The middlegame currently has the highest average CPL. Treat this as a review priority, not proof of a specific tactical or positional weakness."));
  root.append(p);
  const t=panel("Performance by time control","Average CPL");
  t.append(bars(d.time_controls));
  t.append(note("Samples differ in opponent strength and position difficulty. Daily has a very small sample; avoid drawing conclusions from it."));
  root.append(t);
  const c=panel("Performance by colour","Average CPL");
  c.append(bars(d.colours));
  root.append(c);
  const r=panel("Results","Analysed games");
  r.append(table(["Outcome","Games"],[["Wins",fmt(d.results.wins)],["Draws",fmt(d.results.draws)],["Losses",fmt(d.results.losses)],["Score rate",num(d.results.score_rate_pct,1)+"%"]]));
  root.append(r);
}
function renderOpenings(d) {
  const p=panel("Opening repertoire snapshot","Up to 30 most-played lines");
  p.append(make("p","","Use this as a map of the positions you reach, not as an automatic recommendation. Compare score and CPL together, and review the actual plans behind each line."));
  const threshold=(d.safeguards&&d.safeguards.opening_sample_warning_below_games)||10;
  const rows=(d.openings||[]).map(o=>[
    o.name,
    fmt(o.games),
    num(o.score_pct,1)+"%",
    num(o.average_cpl),
    o.games<threshold?"Preliminary":"Usable sample"
  ]);
  const wrap=table(["Opening","Games","Score","Avg CPL","Sample"],rows);
  p.append(wrap);
  p.append(note("Lines below "+threshold+" games are preliminary. Results can be affected by opponent strength, colour and game circumstances; they are not causal measures of opening quality."));
  root.append(p);
}
function renderMistakes(d) {
  const phase=(d.phases||[]).slice().sort((a,b)=>(b.average_cpl||0)-(a.average_cpl||0));
  const top=phase[0];
  const hero=make("section","hero");
  hero.append(make("p","kicker","Aggregate error indicators"));
  hero.append(make("h2","",top?top.name+" is the current highest-CPL phase":"More data is needed"));
  hero.append(make("p","",top?"Average CPL is "+num(top.average_cpl)+" across "+fmt(top.games_with_data)+" games with phase data. This identifies where to review first; it does not identify the cause of each mistake.":"Phase data is not available yet."));
  root.append(hero);
  const p=panel("Average CPL by phase","Lower is better");
  p.append(bars(d.phases,"average_cpl","games_with_data"));
  root.append(p);
  const t=panel("Average CPL by time control","Lower is better");
  t.append(bars(d.time_controls));
  root.append(t);
  const c=panel("Average CPL by colour","Lower is better");
  c.append(bars(d.colours));
  root.append(c);
  root.append(note("This public view contains aggregate statistics only. Individual blunders, game links, positions and move-level review records remain private. To diagnose recurring mistake types, use the private game reports and verified positions."));
}
function renderTraining(d) {
  const phase=(d.phases||[]).slice().sort((a,b)=>(b.average_cpl||0)-(a.average_cpl||0))[0];
  const hero=make("section","hero");
  hero.append(make("p","kicker","Current training emphasis"));
  hero.append(make("h2","",phase?"Prioritise "+phase.name.toLowerCase()+" decisions":"Build a consistent calculation routine"));
  hero.append(make("p","",phase?"The aggregate phase figures suggest allocating extra review time to "+phase.name.toLowerCase()+" positions. Use your private exercise set to work through specific examples.":"Use a balanced plan while the analysis sample develops."));
  root.append(hero);
  const p=panel("Weekly training allocation","Five hours");
  const plan=[
    ["Tactics and calculation","90 min","Calculate forcing replies, identify opponent threats and solve selected positions from your private game reviews."],
    ["Game review","75 min","Review two recent games without an engine first, then compare candidate moves with the engine report."],
    ["Opening work","60 min","Study plans and recurring structures in the openings you play most often."],
    ["Positional and endgame","45 min","Practise piece activity, pawn structures, king activity and conversion technique."],
    ["Practical Blitz","30 min","Play focused games and apply one deliberate thinking routine."]
  ];
  plan.forEach(x=>{
    const row=make("div","training-row");
    row.append(make("strong","",x[0]),make("span","training-time",x[1]),make("p","",x[2]));
    p.append(row);
  });
  root.append(p);
  const routine=panel("Move-by-move thinking routine","Apply during Blitz");
  const ol=make("ol");
  ["What did my opponent's last move threaten?","Are any pieces loose or tactically vulnerable?","What are my forcing candidate moves: checks, captures and threats?","What is the opponent's strongest reply to my intended move?","Only then choose and play."].forEach(x=>ol.append(make("li","",x)));
  routine.append(ol); root.append(routine);
  root.append(note("The public dashboard deliberately does not publish personal game positions or exercise FENs. Open the private analysis reports for the individual review queue."));
}
function renderProgress(d) {
  const g=d.games, r=d.results;
  const pct=100*g.analysed/Math.max(1,g.discovered);
  const p=panel("Historical archive coverage","Current snapshot");
  p.append(make("div","metric-value",num(pct,1)+"%"));
  p.append(make("p","",""+fmt(g.analysed)+" analysed of "+fmt(g.discovered)+" discovered; "+fmt(g.waiting)+" awaiting analysis."));
  const bar=make("div","progress"), fill=make("div","progress-fill"); fill.style.width=pct+"%"; bar.append(fill); p.append(bar);
  root.append(p);
  const grid=make("div","grid");
  grid.append(metric("Wins",fmt(r.wins),""));
  grid.append(metric("Draws",fmt(r.draws),""));
  grid.append(metric("Losses",fmt(r.losses),""));
  grid.append(metric("Score rate",num(r.score_rate_pct,1)+"%","Wins plus half draws"));
  root.append(grid);
  const base=panel("Current performance baseline","Not a historical trend");
  base.append(table(["Measure","Current value"],[
    ["Average user CPL",num(d.accuracy.user_average_cpl)+" cp"],
    ["Opponent average CPL",num(d.accuracy.opponent_average_cpl)+" cp"],
    ["Score rate",num(r.score_rate_pct,1)+"%"],
    ["Analysed games",fmt(g.analysed)]
  ]));
  root.append(base);
  root.append(note("A rolling trend chart is not shown yet because the public export currently stores one aggregate snapshot rather than a dated history series. Adding time-series aggregates is a recommended next improvement."));
}
async function load() {
  try {
    const response=await fetch("./dashboard-data.json",{cache:"no-store"});
    if (!response.ok) throw new Error("HTTP "+response.status);
    const d=await response.json();
    if (!d.games || !d.results || !d.accuracy) throw new Error("Dashboard data schema is incomplete");
    $("updated").textContent="Data updated · "+new Date(d.updated_at).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"})+" UTC";
    const page=document.body.dataset.page;
    const render={overview:renderOverview,performance:renderPerformance,openings:renderOpenings,mistakes:renderMistakes,training:renderTraining,progress:renderProgress}[page]||renderOverview;
    render(d);
    $("data-status").textContent="Aggregate data loaded. Individual games and move-level records are not published.";
  } catch (err) {
    root.replaceChildren(make("div","error","Dashboard data could not be loaded. Please refresh later. "+err.message));
    $("updated").textContent="Data unavailable";
    $("data-status").textContent="No figures have been substituted.";
  }
}
load();
})();