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
  const elapsed = focusDurationSecs - focusRemainingSecs;
  const pctDone = focusDurationSecs > 0 ? Math.round((elapsed / focusDurationSecs) * 100) : 0;
  const pctLeft = 100 - pctDone;

  const mins    = Math.floor(focusRemainingSecs / 60);
  const secs    = focusRemainingSecs % 60;
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
    const buf  = focusAudioCtx.createBuffer(1, bufLen, sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = focusAudioCtx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;

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
