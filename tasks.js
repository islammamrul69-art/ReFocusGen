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
    const hoursLeft  = msLeft / 3_600_000;
    const daysLeft   = hoursLeft / 24;
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
      + (task.done ? " task-fade"    : "")
      + (overdue   ? " task-overdue" : "");

    card.innerHTML = `
      <h3 class="taskh">${task.done ? '<span class="tick-mark">✓</span>' : ""}${task.name}${overdue ? ' <span class="overdue-badge">OVERDUE</span>' : ""}</h3>
      <div class="details-html">
        <span class="taskother">🗓 ${task.time ? new Date(task.time).toLocaleString() : "No date"}</span>
        <span class="taskother">⚡ ${task.level || "—"}</span>
        <span class="category-tag">📁 ${task.type || "—"}</span>
      </div>
      ${buildTimeBar(task)}
      <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;">
        <button class="done"   onclick="toggleDonePreview(${index})">${task.done ? "Undo" : "Done"}</button>
        <button class="edit"   onclick="editTaskPreview(${index})">Edit</button>
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
  document.getElementById("taskwork").value  = t.name  || "";
  document.getElementById("time").value      = t.time  || "";
  document.getElementById("tasklevel").value = t.level || "";
  document.getElementById("worktype").value  = t.type  || "";
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

function clearForm() {
  document.getElementById("taskwork").value  = "";
  document.getElementById("time").value      = "";
  document.getElementById("tasklevel").value = "";
  document.getElementById("worktype").value  = "";
  const addBtn = document.getElementById("add-btn");
  if (addBtn) addBtn.textContent = "Create Task";
  history.replaceState(null, "", "Add.html");
}

function renderAddPage() {
  const addBtn = document.getElementById("add-btn");
  if (!addBtn) return;

  const params    = new URLSearchParams(window.location.search);
  const editIndex = params.get("edit");
  const preview   = document.getElementById("taskpreview");

  if (editIndex !== null && tasks[editIndex]) {
    const t = tasks[editIndex];
    document.getElementById("taskwork").value  = t.name  || "";
    document.getElementById("time").value      = t.time  || "";
    document.getElementById("tasklevel").value = t.level || "";
    document.getElementById("worktype").value  = t.type  || "";
    addBtn.textContent = "Update Task";
  }

  addBtn.addEventListener("click", () => {
    const name  = document.getElementById("taskwork").value.trim();
    const time  = document.getElementById("time").value;
    const level = document.getElementById("tasklevel").value;
    const type  = document.getElementById("worktype").value;

    if (!name)  { showToast("Please enter a task name!", "error");      return; }
    if (!level) { showToast("Please select a task level!", "error");    return; }
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
