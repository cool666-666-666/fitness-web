(() => {
  const STORAGE_KEY = "fitness_records_web_v1";
  const isGithubPages = window.location.hostname.endsWith("github.io");
  const configuredApiBase = (window.FITNESS_API_BASE_URL || "").trim();
  const API_BASE_URL = configuredApiBase || `${window.location.protocol}//${window.location.hostname}:3000/api`;
  
  let dbConnected = false;
  let records = []; 

  const el = {
    tabs: Array.from(document.querySelectorAll(".tab")),
    views: { record: document.getElementById("record"), stats: document.getElementById("stats") },
    dbStatus: document.getElementById("dbStatus"),
    actionInput: document.getElementById("actionInput"),
    setsInput: document.getElementById("setsInput"),
    setRepsInput: document.getElementById("setRepsInput"),
    setWeightsInput: document.getElementById("setWeightsInput"),
    addBtn: document.getElementById("addBtn"),
    recordCount: document.getElementById("recordCount"),
    recordList: document.getElementById("recordList"),
    emptyTip: document.getElementById("emptyTip"),
    queryAction: document.getElementById("queryAction"),
    queryRange: document.getElementById("queryRange"),
    queryList: document.getElementById("queryList"),
    queryEmpty: document.getElementById("queryEmpty"),
    sTotalRecords: document.getElementById("sTotalRecords"),
    recordItemTpl: document.getElementById("recordItemTpl")
  };

  // --- 工具函数 ---
  const isValidPositiveInt = n => Number.isInteger(n) && n > 0;
  const isValidWeight = n => Number.isFinite(n) && n >= 0;
  
  const parseNumberList = (text, validator) => {
    const parts = String(text || "").split(/[\s,，、\/|]+/).map(x => x.trim()).filter(Boolean);
    if (!parts.length) return [];
    const list = parts.map(x => Number(x));
    return list.every(validator) ? list : null;
  };

  const normalizeList = (item, camelKey, snakeKey) => {
    if (Array.isArray(item[camelKey])) return item[camelKey];
    if (Array.isArray(item[snakeKey])) return item[snakeKey];
    if (typeof item[snakeKey] === "string") {
      try {
        const parsed = JSON.parse(item[snakeKey]);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const formatWeights = weightsList => {
    if (!weightsList.length) return "未记录";
    return weightsList.map(weight => `${weight}kg`).join("/");
  };

  const getRecordSummary = item => {
    const repsList = normalizeList(item, "repsList", "reps_list");
    const weightsList = normalizeList(item, "weightsList", "weights_list");
    return {
      repsText: repsList.length ? repsList.join("/") : "未记录",
      weightsText: formatWeights(weightsList)
    };
  };

  // 获取最近一次训练日期的记录
  const getLatestDateRecords = (recs) => {
    if (!recs.length) return [];
    const dates = recs.map(r => {
      const d = new Date(r.createdAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const latestDate = dates.sort().reverse()[0];
    return recs.filter((r, i) => dates[i] === latestDate);
  };

  // --- API 调用 ---
  async function apiCall(method, endpoint, data = null) {
    try {
      const opts = { method, headers: { "Content-Type": "application/json" } };
      if (data) opts.body = JSON.stringify(data);
      const res = await fetch(`${API_BASE_URL}${endpoint}`, opts);
      return res.ok ? await res.json() : null;
    } catch (e) { 
      console.error("网络请求失败:", e);
      return null; 
    }
  }

  async function initDatabase() {
    if (isGithubPages && !configuredApiBase) {
      dbConnected = false;
      if (el.dbStatus) {
        el.dbStatus.innerHTML = "⚠️ 未配置云端后端地址";
        el.dbStatus.style.background = "#ffe7cf";
        el.dbStatus.style.color = "#e7670f";
      }
      return;
    }

    const health = await apiCall("GET", "/health");
    dbConnected = !!health;
    if (el.dbStatus) {
      el.dbStatus.innerHTML = dbConnected ? "✓ 已连接到数据库" : "⚠️ 使用本地存储 (请检查后端)";
      el.dbStatus.style.background = dbConnected ? "#d3f4d4" : "#ffe7cf";
      el.dbStatus.style.color = dbConnected ? "#10261a" : "#e7670f";
    }
  }

  // --- 渲染逻辑 ---

  // 1. 渲染主页列表
  function renderAll() {
    if (!el.recordList) return;
    el.recordList.innerHTML = "";

    // 只显示最近一次训练日期的记录
    const latestRecords = getLatestDateRecords(records);
    const sorted = [...latestRecords].sort((a, b) => b.createdAt - a.createdAt);
    
    sorted.forEach(item => {
      const node = el.recordItemTpl.content.firstElementChild.cloneNode(true);
      node.querySelector("h4").textContent = item.action;
      
      const time = new Date(item.createdAt || item.created_at).toLocaleString();
      node.querySelector("small").textContent = time;
      
      const summary = getRecordSummary(item);
      node.querySelector("strong").textContent = `${item.sets} 组 · 次数: ${summary.repsText} · 重量: ${summary.weightsText}`;
      
      node.querySelector(".danger").onclick = () => removeRecord(item.id);
      el.recordList.appendChild(node);
    });

    if (el.emptyTip) {
      el.emptyTip.classList.toggle("hidden", sorted.length > 0);
    }

    if (el.sTotalRecords) el.sTotalRecords.textContent = sorted.length;
    if (el.recordCount) el.recordCount.textContent = sorted.length;
  }

  // 2. 渲染查询结果（修复点击没反应的关键）
  async function execQuery() {
    const action = el.queryAction.value.trim();
    const days = el.queryRange.value;
    
    console.log(`🔎 开始查询: 动作=${action}, 天数=${days}`);

    let data = [];
    if (dbConnected) {
      data = await apiCall("GET", `/records?days=${days}&action=${encodeURIComponent(action)}`);
    } else {
      data = records.filter(r => !action || r.action.includes(action));
    }

    el.queryList.innerHTML = "";
    
    if (!data || data.length === 0) {
      el.queryEmpty.classList.remove("hidden");
      return;
    }
    el.queryEmpty.classList.add("hidden");

    data.forEach(item => {
      const summary = getRecordSummary(item);
      const li = document.createElement("li");
      li.className = "record-item panel";
      li.style.marginBottom = "10px";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      const left = document.createElement("div");
      const title = document.createElement("h4");
      title.style.margin = "0";
      title.textContent = item.action;
      const time = document.createElement("small");
      time.style.color = "#888";
      time.textContent = new Date(item.created_at || item.createdAt).toLocaleString();
      left.append(title, time);

      const right = document.createElement("div");
      right.style.textAlign = "right";
      const sets = document.createElement("strong");
      sets.style.color = "var(--accent-deep)";
      sets.textContent = `${item.sets} 组`;
      const reps = document.createElement("div");
      reps.style.fontSize = "12px";
      reps.style.color = "#666";
      reps.textContent = `次数: ${summary.repsText}`;
      const weights = document.createElement("div");
      weights.style.fontSize = "12px";
      weights.style.color = "#666";
      weights.textContent = `重量: ${summary.weightsText}`;
      right.append(sets, reps, weights);

      li.append(left, right);
      el.queryList.appendChild(li);
    });
  }

  // --- 操作逻辑 ---
  async function addRecord() {
    const action = el.actionInput.value.trim();
    const sets = Number(el.setsInput.value);
    const repsList = parseNumberList(el.setRepsInput.value, isValidPositiveInt);
    const weightsList = parseNumberList(el.setWeightsInput.value, isValidWeight);

    if (!action || !sets || !repsList) return alert("请完整填写动作、组数和每组次数");
    
    const record = {
      action, sets, repsList, weightsList,
      createdAt: Date.now()
    };

    if (dbConnected) {
      const res = await apiCall("POST", "/records", record);
      if (res) record.id = res.id;
      // 重新从服务端获取最近训练日数据，确保主页只显示最新训练日
      const data = await apiCall("GET", "/records?latest_only=true");
      records = data ? data.map(r => ({
        ...r,
        createdAt: new Date(r.created_at).getTime()
      })) : [];
    } else {
      record.id = Date.now().toString();
      records.unshift(record);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 100)));
    renderAll();
    
    // 清空
    el.setRepsInput.value = "";
    el.setWeightsInput.value = "";
    alert("添加成功！");
  }

  async function removeRecord(id) {
    if (!confirm("确定删除？")) return;
    if (dbConnected) await apiCall("DELETE", `/records/${id}`);
    records = records.filter(r => String(r.id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    renderAll();
  }

  // --- 初始化加载 ---
  (async () => {
    // 绑定添加按钮
    if (el.addBtn) el.addBtn.onclick = addRecord;
    
    // 绑定查询按钮（重要修复）
    const queryBtn = document.getElementById("queryBtn");
    if (queryBtn) queryBtn.onclick = execQuery;

    // 标签页切换
    el.tabs.forEach(btn => btn.onclick = () => {
      el.tabs.forEach(b => b.classList.toggle("is-active", b === btn));
      Object.keys(el.views).forEach(k => el.views[k].classList.toggle("hidden", k !== btn.dataset.tab));
      // 切换到统计页时自动刷新一次列表
      if (btn.dataset.tab === 'stats') execQuery();
    });

    await initDatabase();
    
    if (dbConnected) {
      const data = await apiCall("GET", "/records?latest_only=true");
      records = data ? data.map(r => ({
        ...r,
        createdAt: new Date(r.created_at).getTime()
      })) : [];
    } else {
      records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }
    
    renderAll();
  })();
})();
