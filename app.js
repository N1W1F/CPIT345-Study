const chapters = [
  { index: 1, title: "What Is a DBA?", short: "The DBA Protocol", start: 1, end: 8, glyph: "◈", tag: "ADMINISTRATION" },
  { index: 2, title: "Creating the Database Environment", short: "Environment Setup", start: 9, end: 15, glyph: "▤", tag: "INFRASTRUCTURE" },
  { index: 3, title: "Data and Storage Management", short: "Storage Systems", start: 16, end: 21, glyph: "◇", tag: "STORAGE" },
  { index: 4, title: "Metadata Management", short: "Metadata Control", start: 22, end: 26, glyph: "◎", tag: "METADATA" },
  { index: 5, title: "Database Connectivity", short: "Connect the Systems", start: 27, end: 34, glyph: "⌘", tag: "CONNECTIVITY" }
];

const $ = selector => document.querySelector(selector);
const storageKey = "cpit345-dbquest-completed-v2";
let pages = [];
let currentPage = 1;
let completed = new Set();
let searchTerm = "";

try {
  const current = localStorage.getItem(storageKey);
  completed = new Set(current === null
    ? JSON.parse(localStorage.getItem("cpit345-dbquest-completed-v1") || "[]").filter(number => number <= 15)
    : JSON.parse(current));
} catch { completed = new Set(); }

function chapterFor(pageNumber) { return chapters.find(chapter => pageNumber >= chapter.start && pageNumber <= chapter.end) || chapters[0]; }
function pageNumberLabel(number) { return String(number).padStart(2, "0"); }
function clampPage(number) { return Math.max(1, Math.min(pages.length || 34, number)); }
function saveProgress() { localStorage.setItem(storageKey, JSON.stringify([...completed].sort((a,b) => a-b))); }

function setProgress() {
  const count = [...completed].filter(number => number >= 1 && number <= pages.length).length;
  const percent = Math.round((count / pages.length) * 100);
  $("#sideProgressFill").style.width = `${percent}%`;
  $("#sideProgressText").textContent = `${count} / ${pages.length} pages completed`;
  $("#totalProgress").textContent = `${percent}%`;
  document.querySelectorAll("[data-progress-chapter]").forEach(element => {
    const chapter = chapters[Number(element.dataset.progressChapter) - 1];
    const chapterDone = Array.from({length: chapter.end - chapter.start + 1}, (_,i) => chapter.start + i).filter(n => completed.has(n)).length;
    element.textContent = `${chapterDone}/${chapter.end - chapter.start + 1} COMPLETE`;
  });
  document.querySelectorAll(".chapter-check").forEach(element => {
    const chapter = chapters[Number(element.dataset.chapterCheck) - 1];
    element.textContent = Array.from({length: chapter.end - chapter.start + 1}, (_,i) => chapter.start + i).every(n => completed.has(n)) ? "✓" : "";
  });
}

function renderNavigation() {
  $("#chapterNav").innerHTML = chapters.map(chapter => `<a class="chapter-link" href="#reader" data-jump="${chapter.start}" data-chapter-link="${chapter.index}"><span class="chapter-num">${pageNumberLabel(chapter.index)}</span><span class="chapter-name">${chapter.short}</span><span class="chapter-check" data-chapter-check="${chapter.index}"></span></a>`).join("");
  $("#missionGrid").innerHTML = chapters.map(chapter => `<button class="mission-card ${chapter.index === 1 ? "featured" : ""}" data-jump="${chapter.start}" type="button"><div class="card-top"><span class="card-index">MISSION ${pageNumberLabel(chapter.index)} / 05</span><span>${chapter.tag}</span></div><div class="card-glyph" aria-hidden="true">${chapter.glyph}</div><h3>${chapter.title}</h3><div class="card-bottom"><span>PAGES ${pageNumberLabel(chapter.start)}—${pageNumberLabel(chapter.end)} &nbsp; <span data-progress-chapter="${chapter.index}"></span></span><span class="arrow">↗</span></div></button>`).join("");
  $("#railChapters").innerHTML = chapters.map(chapter => `<div class="rail-chapter"><button class="rail-chapter-header" type="button" data-jump="${chapter.start}" data-rail-header="${chapter.index}"><b>${pageNumberLabel(chapter.index)}</b><span>${chapter.title}</span></button><div class="rail-pages">${Array.from({length:chapter.end-chapter.start+1},(_,i) => chapter.start+i).map(n => `<button type="button" class="rail-page" data-jump="${n}" data-rail-page="${n}"><span>PAGE ${pageNumberLabel(n)}</span><span class="done" data-page-done="${n}"></span></button>`).join("")}</div></div>`).join("");
}

function getPageTitle(pageNumber) {
  const chapter = chapterFor(pageNumber);
  if (pageNumber === chapter.start) return chapter.title;
  const lines = pages[pageNumber - 1].text.split("\n").map(line => line.trim()).filter(Boolean);
  const heading = lines.find(line => /^\d+(?:\.\d+)*\.\s+\S/.test(line));
  return heading ? heading.replace(/^\d+(?:\.\d+)*\.\s+/, "") : `Source Page ${pageNumberLabel(pageNumber)}`;
}

function appendHighlighted(target, line) {
  if (!searchTerm) { target.textContent = line; return; }
  const lower = line.toLocaleLowerCase();
  const query = searchTerm.toLocaleLowerCase();
  let position = 0;
  while (position < line.length) {
    const index = lower.indexOf(query, position);
    if (index < 0) { target.append(document.createTextNode(line.slice(position))); break; }
    target.append(document.createTextNode(line.slice(position, index)));
    const mark = document.createElement("mark");
    mark.className = "search-hit";
    mark.textContent = line.slice(index, index + searchTerm.length);
    target.append(mark);
    position = index + searchTerm.length;
  }
}

function renderSourceText(pageNumber) {
  const article = $("#guidePage");
  article.replaceChildren();
  const lines = pages[pageNumber - 1].text.split("\n");
  lines.forEach((line, index) => {
    const element = document.createElement("div");
    element.className = "source-line";
    const trimmed = line.trim();
    if (index === 0 && /^\d+$/.test(trimmed)) element.classList.add("page-num");
    else if (/^Chapter \d+\s*-/.test(trimmed)) element.classList.add("chapter-heading");
    else if (/^\d+(?:\.\d+)*\.\s+\S/.test(trimmed)) element.classList.add("heading");
    else if (/^(Key Points|Exam Focus|Definition|Example|Memorize|Important):/.test(trimmed)) element.classList.add("signal");
    appendHighlighted(element, line);
    article.append(element);
  });
}

function renderPage(pageNumber, scroll = false) {
  if (!pages.length) return;
  currentPage = clampPage(pageNumber);
  const chapter = chapterFor(currentPage);
  $("#readerChapterIndex").textContent = `MISSION ${pageNumberLabel(chapter.index)} / 05`;
  $("#readerPageCounter").textContent = `PAGE ${pageNumberLabel(currentPage)} / ${pages.length}`;
  $("#readerKicker").textContent = `CHAPTER ${pageNumberLabel(chapter.index)} — SOURCE PAGE ${pageNumberLabel(currentPage)}`;
  $("#pageTitle").textContent = getPageTitle(currentPage);
  $("#chapterRange").textContent = `PAGES ${pageNumberLabel(chapter.start)}—${pageNumberLabel(chapter.end)}`;
  $("#pageHash").textContent = `END OF SOURCE PAGE ${pageNumberLabel(currentPage)}`;
  $("#prevPage").disabled = currentPage <= 1;
  $("#nextPage").disabled = currentPage >= pages.length;
  const isComplete = completed.has(currentPage);
  $("#markButton").classList.toggle("complete", isComplete);
  $("#markButton").innerHTML = isComplete ? "<span>◆</span> COMPLETED" : "<span>◇</span> MARK COMPLETE";
  renderSourceText(currentPage);
  $("#pageDots").innerHTML = Array.from({length:chapter.end-chapter.start+1},(_,i) => chapter.start+i).map(n => `<button type="button" title="Page ${n}" aria-label="Go to page ${n}" class="${n === currentPage ? "active" : ""} ${completed.has(n) ? "done" : ""}" data-jump="${n}"></button>`).join("");
  document.querySelectorAll("[data-rail-page]").forEach(button => button.classList.toggle("active", Number(button.dataset.railPage) === currentPage));
  const rail = $("#railChapters");
  const activeRailPage = rail.querySelector(`[data-rail-page="${currentPage}"]`);
  if (activeRailPage && activeRailPage.offsetParent !== null) {
    const item = activeRailPage.getBoundingClientRect();
    const viewport = rail.getBoundingClientRect();
    if (item.top < viewport.top + 44) rail.scrollTop += item.top - viewport.top - 44;
    else if (item.bottom > viewport.bottom - 10) rail.scrollTop += item.bottom - viewport.bottom + 10;
  }
  document.querySelectorAll("[data-rail-header]").forEach(button => button.classList.toggle("active", Number(button.dataset.railHeader) === chapter.index));
  document.querySelectorAll("[data-chapter-link]").forEach(link => link.classList.toggle("active", Number(link.dataset.chapterLink) === chapter.index));
  document.querySelectorAll("[data-page-done]").forEach(element => element.textContent = completed.has(Number(element.dataset.pageDone)) ? "✓" : "");
  $("#breadcrumbCurrent").textContent = `MISSION ${pageNumberLabel(chapter.index)} / PAGE ${pageNumberLabel(currentPage)}`;
  history.replaceState(null, "", `#page-${currentPage}`);
  if (scroll) $("#reader").scrollIntoView({behavior:"smooth",block:"start"});
}

function openSearch() { $("#searchOverlay").hidden = false; document.body.style.overflow = "hidden"; $("#searchInput").focus(); }
function closeSearch() { $("#searchOverlay").hidden = true; document.body.style.overflow = ""; $("#searchTrigger").focus(); }

function makeSnippet(text, term) {
  const index = text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
  const start = Math.max(0, index - 75);
  const end = Math.min(text.length, index + term.length + 125);
  return `${start ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ")}${end < text.length ? "…" : ""}`;
}

function renderSearchResults() {
  const term = $("#searchInput").value.trim();
  const container = $("#searchResults");
  container.replaceChildren();
  if (!term) { container.innerHTML = '<div class="search-empty">Enter a term to search the entire study guide.</div>'; return; }
  const matches = pages.filter(page => page.text.toLocaleLowerCase().includes(term.toLocaleLowerCase()));
  if (!matches.length) { container.innerHTML = `<div class="search-empty">No matches found in the ${pages.length} source pages.</div>`; return; }
  matches.forEach(page => {
    const chapter = chapterFor(page.number);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.dataset.searchPage = page.number;
    const overline = document.createElement("div");
    overline.className = "result-overline";
    overline.textContent = `MISSION ${pageNumberLabel(chapter.index)} • PAGE ${pageNumberLabel(page.number)} • ${chapter.title.toUpperCase()}`;
    const snippet = document.createElement("div");
    snippet.className = "result-snippet";
    snippet.textContent = makeSnippet(page.text, term);
    button.append(overline, snippet);
    container.append(button);
  });
}

document.addEventListener("click", event => {
  const jump = event.target.closest("[data-jump]");
  if (jump) {
    event.preventDefault();
    searchTerm = "";
    $("#sidebar").classList.remove("open");
    $("#menuButton").setAttribute("aria-expanded", "false");
    renderPage(Number(jump.dataset.jump), true);
  }
  const result = event.target.closest("[data-search-page]");
  if (result) {
    searchTerm = $("#searchInput").value.trim();
    $("#searchOverlay").hidden = true;
    document.body.style.overflow = "";
    renderPage(Number(result.dataset.searchPage), true);
  }
});

$("#markButton").addEventListener("click", () => {
  if (completed.has(currentPage)) completed.delete(currentPage); else completed.add(currentPage);
  saveProgress(); setProgress(); renderPage(currentPage);
});
$("#prevPage").addEventListener("click", () => renderPage(currentPage - 1, true));
$("#nextPage").addEventListener("click", () => renderPage(currentPage + 1, true));
$("#searchTrigger").addEventListener("click", openSearch);
$("#closeSearch").addEventListener("click", closeSearch);
$("#searchBackdrop").addEventListener("click", closeSearch);
$("#searchInput").addEventListener("input", renderSearchResults);
$("#menuButton").addEventListener("click", () => { const open = $("#sidebar").classList.toggle("open"); $("#menuButton").setAttribute("aria-expanded", String(open)); });
$("#continueButton").addEventListener("click", event => { event.preventDefault(); renderPage(currentPage, true); });

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("#searchOverlay").hidden) closeSearch();
  if (event.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) { event.preventDefault(); openSearch(); }
  if (!$("#searchOverlay").hidden || ["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (event.key === "ArrowRight" && currentPage < pages.length) renderPage(currentPage + 1);
  if (event.key === "ArrowLeft" && currentPage > 1) renderPage(currentPage - 1);
});

fetch("guide-pages.json")
  .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
  .then(data => {
    pages = data;
    if (pages.length !== 34) throw new Error("Source page count mismatch");
    renderNavigation(); setProgress();
    const hashPage = Number(location.hash.match(/^#page-(\d+)$/)?.[1]);
    const savedIncomplete = pages.find(page => !completed.has(page.number))?.number || 1;
    renderPage(hashPage || savedIncomplete);
    if (hashPage) $("#reader").scrollIntoView();
  })
  .catch(error => { $("#guidePage").textContent = `Unable to load the source archive: ${error.message}`; });
