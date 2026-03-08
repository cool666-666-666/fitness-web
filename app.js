(() => {
  const STORAGE_KEY = "fitness_records_web_v1";
  const quickActions = ["卧推", "深蹲", "硬拉", "引体向上", "平板支撑", "跑步"];

  const el = {
    tabs: Array.from(document.querySelectorAll(".tab")),
    views: {
      record: document.getElementById("record"),
      stats: document.getElementById("stats")
    },
    actionInput: document.getElementById("actionInput"),
    setsInput: document.getElementById("setsInput"),
    quickActions: document.getElementById("quickActions"),
    addBtn: document.getElementById("addBtn"),
    clearBtn: document.getElementById("clearBtn"),
    recordCount: document.getElementById("recordCount"),
    totalSets: document.getElementById("totalSets"),
    recordList: document.getElementById("recordList"),
    emptyTip: document.getElementById("emptyTip"),
    updatedAt: document.getElementById("updatedAt"),
    sTotalRecords: document.getElementById("sTotalRecords"),
    sTotalSets: document.getElementById("sTotalSets"),
    sAvgSets: document.getElementById("sAvgSets"),
    rankList: document.getElementById("rankList"),
    rankEmpty: document.getElementById("rankEmpty"),
    recordItemTpl: document.getElementById("recordItemTpl"),
    rankItemTpl: document.getElementById("rankItemTpl")
  };

  function nowText() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function loadRecords() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(data)) return [];
      return data.filter((x) => x && typeof x.action === "string" && Number.isFinite(Number(x.sets)));
    } catch {
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  let records = loadRecords();

  function totalSets(recordsData) {
    return recordsData.reduce((sum, item) => sum + Number(item.sets || 0), 0);
  }

  function renderQuickActions() {
    el.quickActions.innerHTML = "";
    quickActions.forEach((action) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.type = "button";
      btn.textContent = action;
      btn.addEventListener("click", () => {
        el.actionInput.value = action;
      });
      el.quickActions.appendChild(btn);
    });
  }

  function renderRecords() {
    const sorted = [...records].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const sets = totalSets(sorted);

    el.recordCount.textContent = String(sorted.length);
    el.totalSets.textContent = String(sets);
    el.updatedAt.textContent = `更新于 ${nowText()}`;

    el.recordList.innerHTML = "";
    el.emptyTip.style.display = sorted.length ? "none" : "block";

    sorted.forEach((item) => {
      const node = el.recordItemTpl.content.firstElementChild.cloneNode(true);
      node.querySelector("h4").textContent = item.action;
      node.querySelector("p").textContent = item.date;
      node.querySelector("strong").textContent = `${item.sets} 组`;
      node.querySelector(".danger").addEventListener("click", () => removeRecord(item.id));
      el.recordList.appendChild(node);
    });
  }

  function renderStats() {
    const sorted = [...records].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const sets = totalSets(sorted);
    const avg = sorted.length ? (sets / sorted.length).toFixed(1) : "0.0";

    el.sTotalRecords.textContent = String(sorted.length);
    el.sTotalSets.textContent = String(sets);
    el.sAvgSets.textContent = String(avg);

    const map = {};
    sorted.forEach((r) => {
      if (!map[r.action]) map[r.action] = { action: r.action, sets: 0, count: 0 };
      map[r.action].sets += Number(r.sets || 0);
      map[r.action].count += 1;
    });

    const rank = Object.values(map).sort((a, b) => b.sets - a.sets);
    const maxSets = rank[0]?.sets || 1;

    el.rankList.innerHTML = "";
    el.rankEmpty.style.display = rank.length ? "none" : "block";

    rank.forEach((item) => {
      const node = el.rankItemTpl.content.firstElementChild.cloneNode(true);
      node.querySelector("strong").textContent = item.action;
      node.querySelector("span").textContent = `${item.sets}组 · ${item.count}次`;
      node.querySelector(".fill").style.width = `${Math.max(12, Math.round((item.sets / maxSets) * 100))}%`;
      el.rankList.appendChild(node);
    });
  }

  function renderAll() {
    renderRecords();
    renderStats();
  }

  function addRecord() {
    const action = el.actionInput.value.trim();
    const sets = Number(el.setsInput.value);

    if (!action) {
      alert("请输入动作名称");
      return;
    }

    if (!Number.isInteger(sets) || sets <= 0 || sets > 999) {
      alert("组数必须是 1-999 的整数");
      return;
    }

    const date = nowText().slice(0, 10);
    records.unshift({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      action,
      sets,
      date,
      createdAt: Date.now()
    });

    saveRecords(records);
    el.actionInput.value = "";
    el.setsInput.value = "";
    renderAll();
  }

  function removeRecord(id) {
    if (!confirm("确认删除这条记录？")) return;
    records = records.filter((x) => x.id !== id);
    saveRecords(records);
    renderAll();
  }

  function clearAll() {
    if (!records.length) return;
    if (!confirm("确认清空全部记录？")) return;
    records = [];
    saveRecords(records);
    renderAll();
  }

  function switchTab(tab) {
    el.tabs.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.tab === tab));
    Object.keys(el.views).forEach((key) => {
      el.views[key].classList.toggle("hidden", key !== tab);
    });
  }

  function bindEvents() {
    el.tabs.forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
    el.addBtn.addEventListener("click", addRecord);
    el.clearBtn.addEventListener("click", clearAll);
    el.actionInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addRecord();
    });
    el.setsInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addRecord();
    });
  }

  renderQuickActions();
  bindEvents();
  renderAll();
})();
