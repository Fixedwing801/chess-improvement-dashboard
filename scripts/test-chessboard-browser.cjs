const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const screenshots = path.join(root, "test-screenshots");
fs.mkdirSync(screenshots, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = path.resolve(root, "." + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end("Not found"); return; }
    res.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(4173, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto("http://127.0.0.1:4173/chessboard-demo.html");
    await page.waitForSelector(".cl-square");
    await page.waitForFunction(() => [...document.querySelectorAll(".cl-piece-white")].every(img => img.complete && img.dataset.bgProcessed === "true"));
    await page.screenshot({ path: path.join(screenshots, "demo-desktop.png"), fullPage: true });
    assert.equal(await page.locator(".cl-square").count(), 64, "demo renders 64 squares");
    assert.match(await page.locator("#status").innerText(), /White to move/);

    await page.locator('[data-square="e2"]').click();
    assert.ok(await page.locator('[data-square="e4"]').evaluate(el => el.classList.contains("cl-target")), "e4 is a legal target");
    await page.locator('[data-square="e4"]').click();
    assert.match(await page.locator("#status").innerText(), /Black to move/);
    await page.locator("#back").click();
    assert.match(await page.locator("#status").innerText(), /White to move/);
    await page.locator("#forward").click();
    assert.match(await page.locator("#status").innerText(), /Black to move/);
    await page.locator("#flip").click();
    assert.equal(await page.locator(".cl-board-files span").nth(1).innerText(), "h", "flipped board starts with h-file");
    await page.locator("#reset").click();
    assert.match(await page.locator("#status").innerText(), /White to move/);

    // Start a fresh page for the mobile visual check so the earlier flip-control
    // interaction cannot leave the screenshot in Black orientation.
    await page.reload();
    await page.waitForSelector(".cl-square");
    await page.waitForFunction(() => [...document.querySelectorAll(".cl-piece-white")].every(img => img.complete && img.dataset.bgProcessed === "true"));
    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await page.locator(".cl-board").boundingBox();
    assert.ok(mobile && mobile.width <= 370 && mobile.width > 300, "board fits mobile viewport");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "mobile page has no horizontal overflow");
    await page.screenshot({ path: path.join(screenshots, "demo-mobile.png"), fullPage: true });

    await page.goto("http://127.0.0.1:4173/training-exercise-01.html");
    await page.waitForSelector(".cl-square");
    await page.waitForFunction(() => [...document.querySelectorAll(".cl-piece-white")].every(img => img.complete && img.dataset.bgProcessed === "true"));
    await page.screenshot({ path: path.join(screenshots, "exercise-desktop.png"), fullPage: true });
    assert.equal(await page.locator(".cl-square").count(), 64, "exercise renders 64 squares");
    await page.locator('[data-square="b4"]').click();
    assert.ok(!(await page.locator('[data-square="b4"]').evaluate(el => el.classList.contains("cl-selected"))), "black pieces cannot be selected");
    await page.locator("#hint").click();
    assert.match(await page.locator("#feedback").innerText(), /Be3/);
    await page.locator('[data-square="e3"]').click();
    assert.match(await page.locator("#feedback").innerText(), /Correct/);
    await page.locator("#undo").click();
    assert.match(await page.locator("#feedback").innerText(), /undone/i);
    await page.locator("#reset").click();
    assert.match(await page.locator("#feedback").innerText(), /Select a white piece/);

    // Exercise actual chess.js promotion through the shared component, including its callback.
    await page.setContent('<link rel="stylesheet" href="http://127.0.0.1:4173/assets/chessboard.css"><div id="board"></div>');
    await page.addScriptTag({ url: "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js" });
    await page.addScriptTag({ path: path.join(root, "assets/chessboard.js") });
    const promotion = await page.evaluate(() => {
      const game = new Chess("8/P7/8/8/8/8/8/4k2K w - - 0 1");
      ChessBoard.mount(document.getElementById("board"), {
        getGame: () => game,
        getPromotion: () => "n"
      });
      document.querySelector('[data-square="a7"]').click();
      document.querySelector('[data-square="a8"]').click();
      return { piece: game.get("a8"), history: game.history() };
    });
    assert.equal(promotion.piece.type, "n", "promotion callback selects knight");
    assert.deepEqual(promotion.history, ["a8=N"]);

    assert.deepEqual(pageErrors, [], "no uncaught browser errors");
    console.log("PASS: real Chromium tests for legal moves, history navigation, orientation, exercise feedback, selection guard, mobile layout and promotion.");
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
  server.close();
});
