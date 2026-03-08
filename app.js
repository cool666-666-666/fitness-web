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
    setRepsInput: document.getElementById("setRepsInput"),
    setWeightsInput: document.getElementById("setWeightsInput"),
    quickActions: document.getElementById("quickActions"),
    addBtn: document.getElementById("addBtn"),
    clearBtn: document.getElementById("clearBtn"),
    recordCount: document.getElementById("recordCount"),
    totalSets: document.getElementById("totalSets"),
    totalReps: document.getElementById("totalReps"),
    totalVolume: document.getElementById("totalVolume"),
    recordList: document.getElementById("recordList"),
    emptyTip: document.getElementById("emptyTip"),
    updatedAt: document.getElementById("updatedAt"),
    queryAction: document.getElementById("queryAction"),
    queryRange: document.getElementById("queryRange"),
    queryList: document.getElementById("queryList"),
    queryEmpty: document.getElementById("queryEmpty"),
    sTotalRecords: document.getElementById("sTotalRecords"),
    sTotalSets: document.getElementById("sTotalSets"),
    sTotalReps: document.getElementById("sTotalReps"),
    sTotalVolume: document.getElementById("sTotalVolume"),
    sAvgSets: document.getElementById("sAvgSets"),
    rankList: document.getElementById("rankList"),
    rankEmpty: document.getElementById("rankEmpty"),
    recordItemTpl: document.getElementById("recordItemTpl"),
    rankItemTpl: document.getElementById("rankItemTpl")
  };

  const queryState = {
    action: "",
    days: 30
  };

  function nowText() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function isValidPositiveInt(n) {
    return Number.isInteger(n) && n > 0 && n <= 999;
  }

  function isValidWeight(n) {
    return Number.isFinite(n) && n > 0 && n <= 9999;
  }

  function parseNumberList(text, validator) {
    const parts = String(text || "")
      .split(/[\s,，、\/|]+/)
      .map((x) => x.trim())
      .filter(Boolean);

    if (!parts.length) return [];
    const list = parts.map((x) => Number(x));
    if (!list.every(validator)) return null;
    return list;
  }

  function parseSetReps(text) {
    return parseNumberList(text, isValidPositiveInt);
  }

  function parseSetWeights(text) {
    return parseNumberList(text, isValidWeight);
  }

  function listSum(list) {
    return list.reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function formatNumber(n) {
    if (!Number.isFinite(n)) return "0";
    return Number(n.toFixed(2)).toString();
  }

  function getRecordTotalReps(item) {
    if (Array.isArray(item.repsList) && item.repsList.length) {
      return listSum(item.repsList);
    }
    const reps = Number(item.reps || 0);
    return isValidPositiveInt(reps) ? Number(item.sets || 0) * reps : 0;
  }

  function getRecordTotalVolume(item) {
    if (Array.isArray(item.repsList) && Array.isArray(item.weightsList) && item.repsList.length && item.weightsList.length) {
      const len = Math.min(item.repsList.length, item.weightsList.length);
      let volume = 0;
      for (let i = 0; i < len; i += 1) {
        volume += Number(item.repsList[i] || 0) * Number(item.weightsList[i] || 0);
      }
      return volume;
    }
    return 0;
  }

  function normalizeRecord(item) {
    const sets = Number(item?.sets);
    if (typeof item?.action !== "string" || !isValidPositiveInt(sets)) return null;

    const rawRepsList = Array.isArray(item?.repsList) ? item.repsList.map((x) => Number(x)) : [];
    const repsList = rawRepsList.length && rawRepsList.every(isValidPositiveInt)
      ? rawRepsList
      : [];

    const rawWeightsList = Array.isArray(item?.weightsList) ? item.weightsList.map((x) => Number(x)) : [];
    const weightsList = rawWeightsList.length && rawWeightsList.every(isValidWeight)
      ? rawWeightsList
      : [];

    const rawReps = Number(item?.reps);
    const reps = isValidPositiveInt(rawReps) ? rawReps : 0;

    return {
      ...item,
      sets,
      reps,
      repsList,
      weightsList
    };
  }

  function loadRecords() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(data)) return [];
      return data.map(normalizeRecord).filter(Boolean);
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

  function totalReps(recordsData) {
    return recordsData.reduce((sum, item) => sum + getRecordTotalReps(item), 0);
  }

  function totalVolume(recordsData) {
    return recordsData.reduce((sum, item) => sum + getRecordTotalVolume(item), 0);
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

  function renderQueryActions() {
    const actions = Array.from(new Set(records.map((r) => r.action))).sort((a, b) => a.localeCompare(b, "zh-CN"));
    const previous = queryState.action;

    el.queryAction.innerHTML = "";

    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "全部动作";
    el.queryAction.appendChild(allOpt);

    actions.forEach((action) => {
      const opt = document.createElement("option");
      opt.value = action;
      opt.textContent = action;
      el.queryAction.appendChild(opt);
    });

    if (actions.includes(previous)) {
      el.queryAction.value = previous;
    } else {
      queryState.action = "";
      el.queryAction.value = "";
    }
  }

  function getRecentRecords() {
    const now = Date.now();
    const cutoff = queryState.days > 0 ? now - queryState.days * 24 * 60 * 60 * 1000 : 0;

    return records
      .filter((item) => {
        if (queryState.action && item.action !== queryState.action) return false;
        if (cutoff && Number(item.createdAt || 0) < cutoff) return false;
        return true;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  function renderRecentQuery() {
    const list = getRecentRecords();
    el.queryList.innerHTML = "";
    el.queryEmpty.style.display = list.length ? "none" : "block";

    list.forEach((item) => {
      const li = document.createElement("li");
      li.className = "query-item";

      const repsText = item.repsList.length ? item.repsList.join("/") : "-";
      const weightsText = item.weightsList.length ? item.weightsList.map((w) => formatNumber(w)).join("/") : "-";
      const volume = getRecordTotalVolume(item);

      li.innerHTML = `<strong>${item.action}</strong><span>${item.date} · ${item.sets}组 · 次数 ${repsText} · 重量 ${weightsText}kg · 容量 ${formatNumber(volume)}kg</span>`;
      el.queryList.appendChild(li);
    });
  }

  function renderRecords() {
    const sorted = [...records].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const sets = totalSets(sorted);
    const reps = totalReps(sorted);
    const volume = totalVolume(sorted);

    el.recordCount.textContent = String(sorted.length);
    el.totalSets.textContent = String(sets);
    el.totalReps.textContent = String(reps);
    el.totalVolume.textContent = formatNumber(volume);
    el.updatedAt.textContent = `更新于 ${nowText()}`;

    el.recordList.innerHTML = "";
    el.emptyTip.style.display = sorted.length ? "none" : "block";

    sorted.forEach((item) => {
      const node = el.recordItemTpl.content.firstElementChild.cloneNode(true);
      const repsText = item.repsList.length ? item.repsList.join("/") : "-";
      const weightsText = item.weightsList.length ? item.weightsList.map((w) => formatNumber(w)).join("/") : "-";

      node.querySelector("h4").textContent = item.action;
      node.querySelector("p").textContent = `${item.date} · 次数 ${repsText} · 重量 ${weightsText}kg`;
      node.querySelector("strong").textContent = `${item.sets}组 · ${getRecordTotalReps(item)}次 · ${formatNumber(getRecordTotalVolume(item))}kg`;
      node.querySelector(".danger").addEventListener("click", () => removeRecord(item.id));
      el.recordList.appendChild(node);
    });
  }

  function renderStats() {
    const sorted = [...records].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const sets = totalSets(sorted);
    const reps = totalReps(sorted);
    const volume = totalVolume(sorted);
    const avg = sorted.length ? (sets / sorted.length).toFixed(1) : "0.0";

    el.sTotalRecords.textContent = String(sorted.length);
    el.sTotalSets.textContent = String(sets);
    el.sTotalReps.textContent = String(reps);
    el.sTotalVolume.textContent = formatNumber(volume);
    el.sAvgSets.textContent = String(avg);

    const map = {};
    sorted.forEach((r) => {
      if (!map[r.action]) map[r.action] = { action: r.action, sets: 0, reps: 0, volume: 0, count: 0 };
      map[r.action].sets += Number(r.sets || 0);
      map[r.action].reps += getRecordTotalReps(r);
      map[r.action].volume += getRecordTotalVolume(r);
      map[r.action].count += 1;
    });

    const rank = Object.values(map).sort((a, b) => b.volume - a.volume);
    const maxVolume = rank[0]?.volume || 1;

    el.rankList.innerHTML = "";
    el.rankEmpty.style.display = rank.length ? "none" : "block";

    rank.forEach((item) => {
      const node = el.rankItemTpl.content.firstElementChild.cloneNode(true);
      node.querySelector("strong").textContent = item.action;
      node.querySelector("span").textContent = `${formatNumber(item.volume)}kg · ${item.reps}次 · ${item.sets}组 · ${item.count}次训练`;
      node.querySelector(".fill").style.width = `${Math.max(12, Math.round((item.volume / maxVolume) * 100))}%`;
      el.rankList.appendChild(node);
    });
  }

  function renderAll() {
    renderQueryActions();
    renderRecords();
    renderStats();
    renderRecentQuery();
  }

  function addRecord() {
    const action = el.actionInput.value.trim();
    const sets = Number(el.setsInput.value);
    const repsList = parseSetReps(el.setRepsInput.value);
    const weightsList = parseSetWeights(el.setWeightsInput.value);

    if (!action) {
      alert("请输入动作名称");
      return;
    }

    if (!isValidPositiveInt(sets)) {
      alert("组数必须是 1-999 的整数");
      return;
    }

    if (repsList === null) {
      alert("每组次数格式不正确，请用数字并用逗号分隔");
      return;
    }

    if (weightsList === null) {
      alert("每组重量格式不正确，请用数字并用逗号分隔");
      return;
    }

    if (!repsList.length) {
      alert("请填写每组次数，例如：12,10,8,8");
      return;
    }

    if (!weightsList.length) {
      alert("请填写每组重量，例如：60,65,65,70");
      return;
    }

    if (repsList.length !== sets) {
      alert(`你填写了 ${repsList.length} 组次数，但组数是 ${sets}，请保持一致`);
      return;
    }

    if (weightsList.length !== sets) {
      alert(`你填写了 ${weightsList.length} 组重量，但组数是 ${sets}，请保持一致`);
      return;
    }

    const date = nowText().slice(0, 10);
    records.unshift({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      action,
      sets,
      repsList,
      weightsList,
      date,
      createdAt: Date.now()
    });

    saveRecords(records);
    el.actionInput.value = "";
    el.setsInput.value = "";
    el.setRepsInput.value = "";
    el.setWeightsInput.value = "";
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
    el.setRepsInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addRecord();
    });
    el.setWeightsInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addRecord();
    });

    el.queryAction.addEventListener("change", () => {
      queryState.action = el.queryAction.value;
      renderRecentQuery();
    });
    el.queryRange.addEventListener("change", () => {
      queryState.days = Number(el.queryRange.value || 30);
      renderRecentQuery();
    });
  }

  renderQuickActions();
  bindEvents();
  renderAll();
})();
