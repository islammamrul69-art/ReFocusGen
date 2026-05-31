function isOverdue(t) {
  return !t.done && t.time && new Date(t.time) < new Date();
}

function buildDonut(completed, overdue, total, size, strokeWidth) {
  const r   = (size - strokeWidth) / 2;
  const cx  = size / 2;
  const cy  = size / 2;
  const C   = 2 * Math.PI * r;
  const pending = total - completed - overdue;

  const fontSize    = size >= 130 ? 22 : 15;
  const subFontSize = size >= 130 ? 12 : 10;
  const cy1 = cy + fontSize * 0.35;
  const cy2 = cy + fontSize * 0.35 + subFontSize + 3;

  const label = total > 0 ? `${completed}/${total}` : "0/0";
  const pct   = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (total === 0) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e4f0ee" stroke-width="${strokeWidth}"/>
      <text x="${cx}" y="${cy1}" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="${fontSize}" fill="#1a3a38">0/0</text>
      <text x="${cx}" y="${cy2}" text-anchor="middle" font-family="Poppins,sans-serif" font-size="${subFontSize}" fill="#888">0%</text>
    </svg>`;
  }

  const segs = (completed > 0 ? 1 : 0) + (overdue > 0 ? 1 : 0) + (pending > 0 ? 1 : 0);
  const G    = segs > 1 ? 3 : 0;

  const cLen = Math.max(0, (completed / total) * C - (completed > 0 ? G : 0));
  const oLen = Math.max(0, (overdue   / total) * C - (overdue   > 0 ? G : 0));
  const pLen = Math.max(0, (pending   / total) * C - (pending   > 0 ? G : 0));

  const degPx = 360 / C;
  const rotC  = -90;
  const rotO  = rotC + (cLen + (completed > 0 ? G : 0)) * degPx;
  const rotP  = rotO + (oLen + (overdue   > 0 ? G : 0)) * degPx;

  const arc = (len, color, rot) =>
    len > 0
      ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}"
           stroke-width="${strokeWidth}"
           stroke-dasharray="${len} ${C - len}"
           transform="rotate(${rot} ${cx} ${cy})"/>`
      : "";

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e4f0ee" stroke-width="${strokeWidth}"/>
    ${arc(cLen, "#4caf50", rotC)}
    ${arc(oLen, "#ef5350", rotO)}
    ${arc(pLen, "#ff9800", rotP)}
    <text x="${cx}" y="${cy1}" text-anchor="middle"
      font-family="Inter,sans-serif" font-weight="700" font-size="${fontSize}" fill="#1a3a38">${label}</text>
    <text x="${cx}" y="${cy2}" text-anchor="middle"
      font-family="Poppins,sans-serif" font-size="${subFontSize}" fill="#888">${pct}%</text>
  </svg>`;
}

function buildDetail(completed, overdue, total) {
  const pending = total - completed - overdue;
  let html = `<span class="detail-done">✓ ${completed} done</span>`;
  if (overdue > 0) html += `<span class="detail-overdue">⚠ ${overdue} overdue</span>`;
  html += `<span class="detail-left">⏳ ${pending} pending</span>`;
  return html;
}

function renderHome() {
  const emptyState = document.getElementById("empty-home");
  const mainContent = document.getElementById("mainContent");

  if (!emptyState) return;

  tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  if (tasks.length === 0) {
    emptyState.style.display = "flex";
    if (mainContent) mainContent.style.display = "none";
  } else {
    emptyState.style.display = "none";
    if (mainContent) mainContent.style.display = "block";
    renderDashboard();
  }
}

function renderDashboard() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const pFilter  = document.getElementById("filterPriority")?.value || "";
  const cFilter  = document.getElementById("filterCategory")?.value  || "";

  let filtered = tasks;
  if (pFilter) filtered = filtered.filter(t => t.level === pFilter);
  if (cFilter) filtered = filtered.filter(t => t.type  === cFilter);

  const overallDone    = filtered.filter(t => t.done).length;
  const overallOverdue = filtered.filter(t => isOverdue(t)).length;

  const od = document.getElementById("overallDonut");
  if (od) od.innerHTML = buildDonut(overallDone, overallOverdue, filtered.length, 140, 16);
  const odet = document.getElementById("overallDetail");
  if (odet) odet.innerHTML = buildDetail(overallDone, overallOverdue, filtered.length);

  const todayTasks   = filtered.filter(t => t.time && t.time.slice(0, 10) === todayStr);
  const todayDone    = todayTasks.filter(t => t.done).length;
  const todayOverdue = todayTasks.filter(t => isOverdue(t)).length;

  const td = document.getElementById("todayDonut");
  if (td) td.innerHTML = buildDonut(todayDone, todayOverdue, todayTasks.length, 140, 16);
  const tdet = document.getElementById("todayDetail");
  if (tdet) tdet.innerHTML = todayTasks.length === 0
    ? '<span class="detail-none">No tasks today</span>'
    : buildDetail(todayDone, todayOverdue, todayTasks.length);

  const levels = [
    { key: "easy",      label: "🟢 Easy"      },
    { key: "medium",    label: "🟡 Medium"    },
    { key: "hard",      label: "🔴 Hard"      },
    { key: "important", label: "⭐ Important" },
  ];
  const pg = document.getElementById("priorityGrid");
  if (pg) {
    const showLevels = pFilter ? levels.filter(l => l.key === pFilter) : levels;
    pg.className = showLevels.length === 1 ? "dash-grid dash-grid-single" : "dash-grid";
    pg.innerHTML = showLevels.map(({ key, label }) => {
      const group   = filtered.filter(t => t.level === key);
      const done    = group.filter(t => t.done).length;
      const overdue = group.filter(t => isOverdue(t)).length;
      return `<div class="dash-circle-wrap">
        ${buildDonut(done, overdue, group.length, 100, 12)}
        <div class="dash-circle-label">${label}</div>
        <div class="dash-detail">${group.length > 0 ? buildDetail(done, overdue, group.length) : '<span class="detail-none">No tasks</span>'}</div>
      </div>`;
    }).join("");
  }

  const cats = [
    { key: "Education", label: "🎓 Education" },
    { key: "Personal",  label: "🏠 Personal"  },
    { key: "Work",      label: "💼 Work"       },
    { key: "other",     label: "📌 Other"      },
  ];
  const cg = document.getElementById("categoryGrid");
  if (cg) {
    const showCats = cFilter ? cats.filter(c => c.key === cFilter) : cats;
    cg.className = showCats.length === 1 ? "dash-grid dash-grid-single" : "dash-grid";
    cg.innerHTML = showCats.map(({ key, label }) => {
      const group   = filtered.filter(t => t.type === key);
      const done    = group.filter(t => t.done).length;
      const overdue = group.filter(t => isOverdue(t)).length;
      return `<div class="dash-circle-wrap">
        ${buildDonut(done, overdue, group.length, 100, 12)}
        <div class="dash-circle-label">${label}</div>
        <div class="dash-detail">${group.length > 0 ? buildDetail(done, overdue, group.length) : '<span class="detail-none">No tasks</span>'}</div>
      </div>`;
    }).join("");
  }
}
