let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
function setActive(link) {
  document.querySelectorAll(".navbar-link").forEach((l) => l.classList.remove("active"));
  link.classList.add("active");
}
function updateNavActive() {
  const page = window.location.pathname.split("/").pop();
  document.querySelectorAll(".navbar-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === page || (page === "" && href === "Index.html")) {
      link.classList.add("active");
    }
  });
}

function applyTheme() {
  const theme = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark-mode", theme === "dark");
}

function setTheme(theme) {
  localStorage.setItem("theme", theme);
  applyTheme();
  const light = document.getElementById("themeLight");
  const dark  = document.getElementById("themeDark");
  if (light) light.classList.toggle("active", theme === "light");
  if (dark)  dark.classList.toggle("active",  theme === "dark");
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

  const label = total > 0
    ? `${completed}/${total}`
    : "0/0";
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

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

  const degPx  = 360 / C;
  const rotC   = -90;
  const rotO   = rotC + (cLen + (completed > 0 ? G : 0)) * degPx;
  const rotP   = rotO + (oLen + (overdue   > 0 ? G : 0)) * degPx;

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

function renderAddPage() {
  const addBtn = document.getElementById("add-btn");
  if (!addBtn) return;

  const params = new URLSearchParams(window.location.search);
  const editIndex = params.get("edit");
  const preview = document.getElementById("taskpreview");

  if (editIndex !== null && tasks[editIndex]) {
    const t = tasks[editIndex];
    document.getElementById("taskwork").value = t.name || "";
    document.getElementById("time").value = t.time || "";
    document.getElementById("tasklevel").value = t.level || "";
    document.getElementById("worktype").value = t.type || "";
    addBtn.textContent = "Update Task";
  }

  addBtn.addEventListener("click", () => {
    const name  = document.getElementById("taskwork").value.trim();
    const time  = document.getElementById("time").value;
    const level = document.getElementById("tasklevel").value;
    const type  = document.getElementById("worktype").value;

    if (!name)  { showToast("Please enter a task name!", "error");     return; }
    if (!level) { showToast("Please select a task level!", "error");   return; }
    if (!type)  { showToast("Please select a work category!", "error"); return; }

    const task = { name, time, level, type, done: false };
    const currentEditIndex = new URLSearchParams(window.location.search).get("edit");

    if (currentEditIndex !== null && tasks[currentEditIndex]) {
      task.done = tasks[currentEditIndex].done;
      tasks[currentEditIndex] = task;
      showToast("Task updated!", "success");
    } else {
      tasks.push(task);
      showToast("Task created!", "success");
    }

    saveTasks();
    clearForm();
    renderPreview(preview);
  });

  renderPreview(preview);
}

function clearForm() {
  document.getElementById("taskwork").value = "";
  document.getElementById("time").value = "";
  document.getElementById("tasklevel").value = "";
  document.getElementById("worktype").value = "";
  const addBtn = document.getElementById("add-btn");
  if (addBtn) addBtn.textContent = "Create Task";
  history.replaceState(null, "", "Add.html");
}

function buildTimeBar(task) {
  if (!task.time || task.done) return "";

  const now      = new Date();
  const deadline = new Date(task.time);
  const msLeft   = deadline - now;

  let pct, colorClass, label;

  if (msLeft < 0) {
    const hoursOver = Math.round(Math.abs(msLeft) / 3_600_000);
    const daysOver  = Math.floor(hoursOver / 24);
    label      = daysOver > 0 ? `⚠️ ${daysOver}d overdue` : `⚠️ ${hoursOver}h overdue`;
    pct        = 0;
    colorClass = "tbar-overdue";
  } else {
    const hoursLeft = msLeft / 3_600_000;
    const daysLeft  = hoursLeft / 24;
    const windowDays = 7;
    pct = Math.min(100, Math.round((daysLeft / windowDays) * 100));
    if (pct > 50)      { colorClass = "tbar-ok";     label = `${Math.round(daysLeft)}d left`; }
    else if (pct > 15) { colorClass = "tbar-warn";   label = `${Math.round(hoursLeft)}h left`; }
    else               { colorClass = "tbar-urgent"; label = `${Math.round(hoursLeft)}h left`; }
    if (hoursLeft < 1) label = "< 1h left";
  }

  return `<div class="task-time-bar-wrap">
    <div class="task-time-bar-outer">
      <div class="task-time-bar-inner ${colorClass}" style="width:${pct}%"></div>
    </div>
    <span class="task-time-label ${colorClass}-text">${label}</span>
  </div>`;
}

function renderPreview(container) {
  if (!container) return;
  container.innerHTML = "";

  if (tasks.length === 0) {
    container.innerHTML = '<p class="preview-empty">No tasks yet. Create your first one above!</p>';
    return;
  }

  tasks.forEach((task, index) => {
    const overdue = isOverdue(task);

    const card = document.createElement("div");
    card.className = "card-task preview-card"
      + (task.done  ? " task-fade"    : "")
      + (overdue    ? " task-overdue" : "");

    card.innerHTML = `
      <h3 class="taskh">${task.done ? '<span class="tick-mark">✓</span>' : ""}${task.name}${overdue ? ' <span class="overdue-badge">OVERDUE</span>' : ""}</h3>
      <div class="details-html">
        <span class="taskother">🗓 ${task.time ? new Date(task.time).toLocaleString() : "No date"}</span>
        <span class="taskother">⚡ ${task.level || "—"}</span>
        <span class="category-tag">📁 ${task.type || "—"}</span>
      </div>
      ${buildTimeBar(task)}
      <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;">
        <button class="done" onclick="toggleDonePreview(${index})">${task.done ? "Undo" : "Done"}</button>
        <button class="edit" onclick="editTaskPreview(${index})">Edit</button>
        <button class="delete" onclick="deleteTaskPreview(${index})">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleDonePreview(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
  renderPreview(document.getElementById("taskpreview"));
}

function editTaskPreview(index) {
  const t = tasks[index];
  document.getElementById("taskwork").value = t.name || "";
  document.getElementById("time").value = t.time || "";
  document.getElementById("tasklevel").value = t.level || "";
  document.getElementById("worktype").value = t.type || "";
  const addBtn = document.getElementById("add-btn");
  if (addBtn) addBtn.textContent = "Update Task";
  history.replaceState(null, "", "Add.html?edit=" + index);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteTaskPreview(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderPreview(document.getElementById("taskpreview"));
}

let focusTimerInterval = null;
let focusDurationSecs  = 0;
let focusRemainingSecs = 0;
let focusAudioCtx      = null;
let focusTaskIndex     = -1;
const FOCUS_C = 2 * Math.PI * 84; 

function openFocusSetup() {
  tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  if (tasks.length === 0) {
    showToast("Create a task first!", "error");
    return;
  }
  const sel = document.getElementById("focusTaskSelect");
  if (sel) {
    sel.innerHTML = tasks.map((t, i) =>
      `<option value="${i}">${t.name} (${t.level || "—"} · ${t.type || "—"})</option>`
    ).join("");
  }
  document.getElementById("focusSetupOverlay").style.display = "flex";
}

function closeFocusSetup() {
  document.getElementById("focusSetupOverlay").style.display = "none";
}

function setFocusDuration(mins, btn) {
  document.getElementById("focusDuration").value = mins;
  document.querySelectorAll(".focus-preset").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function startFocusMode() {
  const taskIdx = parseInt(document.getElementById("focusTaskSelect").value);
  const mins    = parseInt(document.getElementById("focusDuration").value);
  const sound   = document.getElementById("focusSound").checked;

  if (isNaN(mins) || mins < 1) {
    showToast("Enter a valid duration!", "error");
    return;
  }

  const task = tasks[taskIdx];
  focusTaskIndex     = taskIdx;
  focusDurationSecs  = mins * 60;
  focusRemainingSecs = focusDurationSecs;

  closeFocusSetup();

  document.getElementById("focusTaskName").textContent = task.name;
  document.getElementById("focusTaskMeta").textContent =
    `⚡ ${task.level || "—"}  ·  📁 ${task.type || "—"}`;

  document.getElementById("focusScreen").style.display = "flex";

  if (sound) startFocusSound();

  updateFocusTick();
  focusTimerInterval = setInterval(() => {
    focusRemainingSecs--;
    if (focusRemainingSecs <= 0) {
      focusRemainingSecs = 0;
      clearInterval(focusTimerInterval);
      focusTimerInterval = null;
      stopFocusSound();
      if (focusTaskIndex >= 0 && tasks[focusTaskIndex]) {
        tasks[focusTaskIndex].done = true;
        saveTasks();
      }
      updateFocusTick();
      showToast("🎉 Focus complete! Task marked as done!", "success");
    } else {
      updateFocusTick();
    }
  }, 1000);
}

function updateFocusTick() {
  const elapsed  = focusDurationSecs - focusRemainingSecs;
  const pctDone  = focusDurationSecs > 0 ? Math.round((elapsed / focusDurationSecs) * 100) : 0;
  const pctLeft  = 100 - pctDone;

  const mins = Math.floor(focusRemainingSecs / 60);
  const secs = focusRemainingSecs % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const timeEl = document.getElementById("focusTimeDisplay");
  if (timeEl) timeEl.textContent = timeStr;

  const pctEl = document.getElementById("focusPercentText");
  if (pctEl) pctEl.textContent = `${pctDone}% done  ·  ${pctLeft}% left`;

  const doneLabel = document.getElementById("focusDoneLabel");
  const leftLabel = document.getElementById("focusLeftLabel");
  if (doneLabel) doneLabel.textContent = `✓ ${pctDone}% complete`;
  if (leftLabel) leftLabel.textContent = `⏳ ${pctLeft}% remaining`;

  const ring = document.getElementById("focusRing");
  if (ring) {
    const filled = focusDurationSecs > 0 ? (elapsed / focusDurationSecs) * FOCUS_C : 0;
    ring.setAttribute("stroke-dasharray", `${filled} ${FOCUS_C - filled}`);
    ring.setAttribute("stroke", pctDone >= 100 ? "#4caf50" : "#4ba899");
  }

  const bar = document.getElementById("focusBarInner");
  if (bar) bar.style.width = pctDone + "%";
}

function stopFocusMode() {
  if (focusTimerInterval) {
    clearInterval(focusTimerInterval);
    focusTimerInterval = null;
  }
  stopFocusSound();
  document.getElementById("focusScreen").style.display = "none";
}

function startFocusSound() {
  try {
    focusAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = focusAudioCtx.sampleRate;
    const bufLen = sampleRate * 3;
    const buf = focusAudioCtx.createBuffer(1, bufLen, sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = focusAudioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lowpass = focusAudioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 600;

    const gain = focusAudioCtx.createGain();
    gain.gain.value = 0.08;

    src.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(focusAudioCtx.destination);
    src.start();
  } catch (e) {}
}

function stopFocusSound() {
  if (focusAudioCtx) {
    try { focusAudioCtx.close(); } catch (e) {}
    focusAudioCtx = null;
  }
}

function showToast(message, type) {
  const existing = document.getElementById("toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.className = "toast toast-" + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("toast-show"), 10);
  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  updateNavActive();
  renderHome();
  renderAddPage();
});
