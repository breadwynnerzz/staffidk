const DOCS = [
  {
    group: "Introduction",
    pages: [
      { title: "Staff Introduction", slug: "staff-introduction", file: "docs/staff-introduction.md" },
      { title: "Staff Expectations", slug: "staff-expectations", file: "docs/staff-expectations.md" },
      { title: "Important Internal Information", slug: "important-internal-information", file: "docs/important-internal-information.md" }
    ]
  },
  {
    group: "Structure",
    pages: [
      { title: "Staff Hierarchy", slug: "staff-hierarchy", file: "docs/staff-hierarchy.md" },
      { title: "Leadership Expectations", slug: "leadership-expectations", file: "docs/leadership-expectations.md" },
      { title: "Professionalism Standards", slug: "professionalism-standards", file: "docs/professionalism-standards.md" }
    ]
  },
  {
    group: "Roles",
    pages: [
      { title: "Moderator Responsibilities", slug: "moderator-responsibilities", file: "docs/moderator-responsibilities.md" },
      { title: "Administrator Responsibilities", slug: "administrator-responsibilities", file: "docs/administrator-responsibilities.md" },
      { title: "Communication Expectations", slug: "communication-expectations", file: "docs/communication-expectations.md" },
      { title: "Activity Requirements", slug: "activity-requirements", file: "docs/activity-requirements.md" }
    ]
  },
  {
    group: "Operations",
    pages: [
      { title: "Ticket Handling Procedures", slug: "ticket-handling-procedures", file: "docs/ticket-handling-procedures.md" },
      { title: "Report Handling", slug: "report-handling", file: "docs/report-handling.md" },
      { title: "Escalation Procedures", slug: "escalation-procedures", file: "docs/escalation-procedures.md" },
      { title: "Conflict Resolution", slug: "conflict-resolution", file: "docs/conflict-resolution.md" },
      { title: "Administrative Commands", slug: "administrative-commands", file: "docs/administrative-commands.md" }
    ]
  },
  {
    group: "Discipline",
    pages: [
      { title: "Punishment Guidelines", slug: "punishment-guidelines", file: "docs/punishment-guidelines.md" },
      { title: "Warning System", slug: "warning-system", file: "docs/warning-system.md" },
      { title: "Abuse of Permissions", slug: "abuse-of-permissions", file: "docs/abuse-of-permissions.md" },
      { title: "Internal Conduct", slug: "internal-conduct", file: "docs/internal-conduct.md" },
      { title: "Community Interaction", slug: "community-interaction", file: "docs/community-interaction.md" },
      { title: "Inactivity Policies", slug: "inactivity-policies", file: "docs/inactivity-policies.md" },
      { title: "Suspension & Removal Policies", slug: "suspension-removal-policies", file: "docs/suspension-removal-policies.md" }
    ]
  }
];

const flatDocs = DOCS.flatMap((group) => group.pages.map((page) => ({ ...page, group: group.group })));
const docCache = new Map();
let searchIndex = flatDocs.map((page) => ({ ...page, content: "" }));

const sidebar = document.getElementById("sidebar");
const sidebarNav = document.getElementById("sidebar-nav");
const sidebarScrim = document.getElementById("sidebar-scrim");
const docContent = document.getElementById("docContent");
const pageNav = document.getElementById("pageNav");
const pageTransition = document.getElementById("page-transition");
const docProgress = document.getElementById("doc-progress");
const toc = document.getElementById("toc");
const sidebarFilter = document.getElementById("sidebar-filter");
const searchModal = document.getElementById("search-modal");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

const PAGE_ICONS = {
  "staff-introduction": "📖",
  "staff-expectations": "📋",
  "important-internal-information": "🔒",
  "staff-hierarchy": "🏛️",
  "leadership-expectations": "⭐",
  "professionalism-standards": "🤝",
  "moderator-responsibilities": "🛡️",
  "administrator-responsibilities": "⚙️",
  "communication-expectations": "💬",
  "activity-requirements": "📈",
  "ticket-handling-procedures": "🎫",
  "report-handling": "🚩",
  "escalation-procedures": "⬆️",
  "conflict-resolution": "⚖️",
  "administrative-commands": "⌨",
  "punishment-guidelines": "⛔",
  "warning-system": "⚠️",
  "abuse-of-permissions": "🚫",
  "internal-conduct": "🔐",
  "community-interaction": "🌐",
  "inactivity-policies": "⌛",
  "suspension-removal-policies": "📄"
};

// Build the GitBook-style sidebar from the same route registry used by the router.
function renderSidebar() {
  sidebarNav.innerHTML = DOCS.map(
    (section) => `
      <details class="nav-section" open>
        <summary>${escapeHtml(section.group)}</summary>
        ${section.pages
          .map(
            (page) => `
              <a class="nav-link" href="#/${page.slug}" data-slug="${page.slug}">
                <span class="nav-icon">${PAGE_ICONS[page.slug] || "📄"}</span>
                ${escapeHtml(page.title)}
              </a>
            `
          )
          .join("")}
      </details>
    `
  ).join("");
}

// Hash routing keeps the site GitHub Pages and Cloudflare Pages friendly.
function getCurrentSlug() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return flatDocs.some((page) => page.slug === hash) ? hash : "staff-introduction";
}

// Load markdown on demand, render it, and update document navigation state.
async function loadPage(slug = getCurrentSlug()) {
  const page = flatDocs.find((item) => item.slug === slug) || flatDocs[0];

  document.title = `${page.title} | Brick City RP Staff Handbook`;
  setActiveLink(page.slug);
  closeSidebar();
  pageTransition.style.animation = "none";
  pageTransition.offsetHeight;
  pageTransition.style.animation = "";

  try {
    const markdown = await getMarkdown(page);
    docContent.innerHTML = renderMarkdown(markdown);
    renderPageNav(page.slug);
    renderToc();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    docContent.innerHTML = renderMarkdown(`# Page unavailable\n\n> [!DANGER]\n> This documentation page could not be loaded. Confirm the markdown file exists at \`${page.file}\`.`);
    renderToc();
  }
}

// Cache markdown responses so large handbook pages stay fast after first load.
async function getMarkdown(page) {
  if (docCache.has(page.slug)) return docCache.get(page.slug);
  const response = await fetch(page.file);
  if (!response.ok) throw new Error(`Unable to load ${page.file}`);
  const markdown = await response.text();
  docCache.set(page.slug, markdown);
  return markdown;
}

function setActiveLink(slug) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.slug === slug);
  });
}

// Previous and next links are generated from the route order above.
function renderPageNav(slug) {
  const index = flatDocs.findIndex((page) => page.slug === slug);
  const previous = flatDocs[index - 1];
  const next = flatDocs[index + 1];

  pageNav.innerHTML = `
    ${previous ? `<a class="pager-link" href="#/${previous.slug}"><small>Previous</small>${escapeHtml(previous.title)}</a>` : "<div></div>"}
    ${next ? `<a class="pager-link next" href="#/${next.slug}"><small>Next</small>${escapeHtml(next.title)}</a>` : "<div></div>"}
  `;
}

function renderToc() {
  const headings = [...docContent.querySelectorAll("h2, h3")];
  toc.innerHTML = headings.length
    ? headings.map((heading) => `<a href="#${heading.id}">${heading.textContent}</a>`).join("")
    : `<span class="empty-toc">No sections</span>`;
}

// Lightweight markdown renderer for handbook pages, tables, alerts, code blocks, and lists.
function renderMarkdown(markdown) {
  const blocks = [];
  const stash = (html) => {
    const key = `@@BLOCK_${blocks.length}@@`;
    blocks.push(html);
    return key;
  };

  let source = markdown.replace(/\r\n/g, "\n").trim();

  source = source.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_, language, code) =>
    stash(`<pre><code class="language-${escapeHtml(language)}">${escapeHtml(code.trim())}</code></pre>`)
  );

  source = source.replace(/((?:^\|.*\|\n?)+)/gm, (table) => {
    const rows = table
      .trim()
      .split("\n")
      .filter((row) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(row));

    if (rows.length < 2) return table;

    const htmlRows = rows.map((row, index) => {
      const cells = row
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim());
      const tag = index === 0 ? "th" : "td";
      return `<tr>${cells.map((cell) => `<${tag}>${inlineMarkdown(cell)}</${tag}>`).join("")}</tr>`;
    });

    return stash(`<table><tbody>${htmlRows.join("")}</tbody></table>`);
  });

  source = source.replace(/^(#{1,3})\s+(.+)$/gm, (_, marks, text) => {
    const level = marks.length;
    const id = slugify(text);
    return `<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`;
  });

  source = source.replace(/^>\s?\[!(NOTE|WARNING|DANGER|SUCCESS)\]\n((?:>\s?.+\n?)+)/gim, (_, type, body) => {
    const clean = body.replace(/^>\s?/gm, "").trim();
    const label = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    return stash(`<blockquote class="${type.toLowerCase()}"><p><strong>${label}:</strong> ${inlineMarkdown(clean)}</p></blockquote>`);
  });

  source = source.replace(/^>\s?(.+)$/gm, (_, text) => stash(`<blockquote><p>${inlineMarkdown(text)}</p></blockquote>`));

  source = source.replace(/(?:^|\n)((?:[-*]\s+.+\n?)+)/g, (match, list) => {
    const items = list
      .trim()
      .split("\n")
      .map((item) => item.replace(/^[-*]\s+/, "").trim())
      .map((item) => `<li>${inlineMarkdown(item)}</li>`)
      .join("");
    return `\n${stash(`<ul>${items}</ul>`)}\n`;
  });

  const paragraphs = source
    .split(/\n{2,}/)
    .map((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return "";
      if (/^<h[1-3]|^@@BLOCK_/.test(trimmed)) return trimmed;
      return `<p>${inlineMarkdown(trimmed).replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return blocks.reduce((html, block, index) => html.replaceAll(`@@BLOCK_${index}@@`, block), paragraphs);
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
  sidebarScrim.hidden = false;
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
  sidebarScrim.hidden = true;
}

function openSearch() {
  searchModal.hidden = false;
  searchModal.setAttribute("aria-hidden", "false");
  searchInput.value = "";
  renderSearchResults("");
  requestAnimationFrame(() => searchInput.focus());
}

function closeSearch() {
  searchModal.hidden = true;
  searchModal.setAttribute("aria-hidden", "true");
}

// Search uses the asynchronously preloaded markdown index when available.
function renderSearchResults(query) {
  const normalized = query.toLowerCase().trim();
  const matches = searchIndex.filter((page) => {
    const haystack = `${page.title} ${page.group} ${page.content}`.toLowerCase();
    return !normalized || haystack.includes(normalized);
  });

  searchResults.innerHTML = matches.length
    ? matches
        .map(
          (page) => `
            <a class="search-result" href="#/${page.slug}" data-search-result>
              <strong>${escapeHtml(page.title)}</strong>
              <span>${escapeHtml(page.group)} documentation</span>
            </a>
          `
        )
        .join("")
    : `<div class="empty-state">No matching pages found.</div>`;
}

renderSidebar();
loadPage();
buildSearchIndex();

window.addEventListener("hashchange", () => loadPage());
document.getElementById("menu-toggle").addEventListener("click", openSidebar);
sidebarScrim.addEventListener("click", closeSidebar);
document.getElementById("search-trigger").addEventListener("click", openSearch);
document.getElementById("close-search").addEventListener("click", closeSearch);
searchInput.addEventListener("input", (event) => renderSearchResults(event.target.value));
searchResults.addEventListener("click", (event) => {
  if (event.target.closest("[data-search-result]")) closeSearch();
});
sidebarFilter.addEventListener("input", (event) => filterSidebar(event.target.value));

window.addEventListener("keydown", (event) => {
  const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
  if (isSearchShortcut) {
    event.preventDefault();
    openSearch();
  }

  if (event.key === "Escape") {
    closeSearch();
    closeSidebar();
  }
});

// Preload page text after the first render so search can match page content, not only titles.
async function buildSearchIndex() {
  const indexedPages = await Promise.all(
    flatDocs.map(async (page) => {
      try {
        return { ...page, content: await getMarkdown(page) };
      } catch {
        return { ...page, content: "" };
      }
    })
  );

  searchIndex = indexedPages;
}

function filterSidebar(query) {
  const normalized = query.toLowerCase().trim();
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.hidden = normalized && !link.textContent.toLowerCase().includes(normalized);
  });
}

window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
  docProgress.style.width = `${progress}%`;
});
