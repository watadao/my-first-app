(() => {
  "use strict";

  const STORAGE_KEY = "quantum_core_clicker_save_v1";
  const CLICKS_PER_TICKET = 50;
  const BUFF_DURATION_MS = 30_000;

  // ショップアイテム定義（1秒ごとに自動でポイントが増える施設 + クリック強化）
  const SHOP_ITEMS = [
    {
      id: "nano_drone",
      name: "ナノ採掘ドローン",
      icon: "🤖",
      desc: "自律飛行ドローンが微小量子を毎秒回収します。",
      type: "auto",
      power: 1,
      baseCost: 15,
      costScale: 1.15,
    },
    {
      id: "photon_lens",
      name: "光子増幅レンズ",
      icon: "🔮",
      desc: "コアのタップ出力を収束させ、1クリックの獲得量を増やします。",
      type: "click",
      power: 1,
      baseCost: 25,
      costScale: 1.22,
    },
    {
      id: "quantum_capacitor",
      name: "量子コンデンサ",
      icon: "🔋",
      desc: "空間のゆらぎを蓄電し、安定した自動生産を行います。",
      type: "auto",
      power: 6,
      baseCost: 100,
      costScale: 1.16,
    },
    {
      id: "zero_point_gen",
      name: "ゼロポイント発電機",
      icon: "🌀",
      desc: "真空エネルギーを抽出し、毎秒大量のポイントを生成します。",
      type: "auto",
      power: 28,
      baseCost: 550,
      costScale: 1.16,
    },
    {
      id: "chrono_rig",
      name: "次元マイニングリグ",
      icon: "🛰️",
      desc: "並行世界の鉱脈へ接続して高速自動採掘を行います。",
      type: "auto",
      power: 130,
      baseCost: 3_200,
      costScale: 1.17,
    },
    {
      id: "antimatter_core",
      name: "反物質リアクター",
      icon: "⚛️",
      desc: "対消滅反応を制御し、莫大なエネルギーを毎秒供給します。",
      type: "auto",
      power: 650,
      baseCost: 19_000,
      costScale: 1.17,
    },
    {
      id: "dyson_swarm",
      name: "ダイソンスウォーム",
      icon: "☀️",
      desc: "恒星全体を覆う量子パネル群で超規模の自動生産を実現します。",
      type: "auto",
      power: 3_600,
      baseCost: 120_000,
      costScale: 1.18,
    },
  ];

  // 量子ルーレットの6種ラインナップ
  const ROULETTE_PRIZES = [
    {
      id: "overdrive_2x",
      shortLabel: "生産&クリック2倍",
      subLabel: "30秒間",
      title: "⚡ 30秒間 生産＆クリック2倍",
      detail: "30秒間、自動生産とクリック獲得量が両方2倍になります！",
      icon: "⚡",
      colorA: "#d97706",
      colorB: "#92400e",
      accent: "#fbbf24",
      weight: 18,
    },
    {
      id: "point_pack",
      shortLabel: "ボーナスPT",
      subLabel: "即時獲得",
      title: "✨ 量子エネルギーパック",
      detail: "進行度に応じたボーナスポイントを即時獲得します。",
      icon: "✨",
      colorA: "#0284c7",
      colorB: "#0c4a6e",
      accent: "#38bdf8",
      weight: 24,
    },
    {
      id: "click_5x",
      shortLabel: "クリック獲得5倍",
      subLabel: "30秒間",
      title: "🔥 30秒間 クリック獲得5倍",
      detail: "30秒間、コアクリック時の獲得ポイントが5倍に急上昇！",
      icon: "🔥",
      colorA: "#e11d48",
      colorB: "#881337",
      accent: "#fb7185",
      weight: 16,
    },
    {
      id: "double_tickets",
      shortLabel: "チケット×2",
      subLabel: "無料抽選+2",
      title: "🎟️ 無料抽選チケット×2枚",
      detail: "ルーレットを無料で回せるチケットを2枚獲得します！",
      icon: "🎟️",
      colorA: "#7c3aed",
      colorB: "#4c1d95",
      accent: "#c084fc",
      weight: 14,
    },
    {
      id: "auto_3x",
      shortLabel: "自動生産3倍",
      subLabel: "30秒間",
      title: "🚀 30秒間 自動生産3倍",
      detail: "30秒間、ショップ施設の毎秒自動生産が3倍に加速！",
      icon: "🚀",
      colorA: "#059669",
      colorB: "#064e3b",
      accent: "#34d399",
      weight: 16,
    },
    {
      id: "jackpot",
      shortLabel: "ジャックポット",
      subLabel: "超大量PT",
      title: "💎 量子ジャックポット！",
      detail: "膨大な量子ポイントを一挙に獲得する大当たり！",
      icon: "💎",
      colorA: "#4f46e5",
      colorB: "#1e1b4b",
      accent: "#818cf8",
      weight: 12,
    },
  ];

  // バフの表示メタデータ
  const BUFF_DEFINITIONS = {
    overdrive_2x: {
      name: "生産＆クリック 2倍",
      icon: "⚡",
      clickMult: 2,
      autoMult: 2,
    },
    click_5x: {
      name: "クリック獲得 5倍",
      icon: "🔥",
      clickMult: 5,
      autoMult: 1,
    },
    auto_3x: {
      name: "自動生産 3倍",
      icon: "🚀",
      clickMult: 1,
      autoMult: 3,
    },
  };

  // 初期ステート生成（初期特典チケット1枚付与）
  function createDefaultState() {
    const owned = {};
    for (const item of SHOP_ITEMS) {
      owned[item.id] = 0;
    }
    return {
      points: 0,
      totalClicks: 0,
      ticketCharge: 0,
      tickets: 1, // 初期特典で無料チケット1枚付与
      paidSpins: 0,
      owned,
      buffs: {}, // { [buffId]: { expiresAt: number, totalDuration: number } }
      soundEnabled: true,
    };
  }

  let state = loadState();
  let isSpinning = false;
  let wheelAngleDeg = 0; // ルーレット盤の現在角度（度）

  // Web Audio API シンセサイザー（外部音源ファイル不要で電子ティック音・効果音を生成）
  let audioCtx = null;

  function ensureAudioContext() {
    if (!state.soundEnabled) return null;
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playCoreClickSound(isFever) {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isFever ? "triangle" : "sine";
    const baseFreq = isFever ? 640 : 460;
    const jitter = (Math.random() - 0.5) * 45;
    osc.frequency.setValueAtTime(baseFreq + jitter, now);
    osc.frequency.exponentialRampToValueAtTime((baseFreq + jitter) * 1.45, now + 0.065);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  // ルーレットの電子ティック音
  function playRouletteTickSound(speedRatio) {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    const freq = 780 + speedRatio * 420;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.032);

    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.038);
  }

  function playBuySound() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.08, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.12);
    });
  }

  function playTicketEarnSound() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.09, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.17);
    });
  }

  function playRouletteWinSound() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      const t = now + idx * 0.075;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // DOM要素取得
  const el = {
    leftPanel: document.querySelector(".left-panel"),
    pointsDisplay: document.getElementById("pointsDisplay"),
    perClickDisplay: document.getElementById("perClickDisplay"),
    perSecondDisplay: document.getElementById("perSecondDisplay"),
    coreBtn: document.getElementById("coreBtn"),
    coreStage: document.getElementById("coreStage"),
    floatingTextLayer: document.getElementById("floatingTextLayer"),
    ticketProgressLabel: document.getElementById("ticketProgressLabel"),
    ticketProgressFill: document.getElementById("ticketProgressFill"),
    ticketProgressBarWrap: document.getElementById("ticketProgressBarWrap"),
    totalClicksDisplay: document.getElementById("totalClicksDisplay"),
    headerTicketBadge: document.getElementById("headerTicketBadge"),
    headerTicketCount: document.getElementById("headerTicketCount"),
    rouletteTabBadge: document.getElementById("rouletteTabBadge"),
    rouletteTicketCount: document.getElementById("rouletteTicketCount"),
    soundToggleBtn: document.getElementById("soundToggleBtn"),
    resetBtn: document.getElementById("resetBtn"),
    feverBadge: document.getElementById("feverBadge"),
    activeBuffsList: document.getElementById("activeBuffsList"),
    shopTabBtn: document.getElementById("shopTabBtn"),
    rouletteTabBtn: document.getElementById("rouletteTabBtn"),
    shopTabPanel: document.getElementById("shopTabPanel"),
    rouletteTabPanel: document.getElementById("rouletteTabPanel"),
    shopItemsContainer: document.getElementById("shopItemsContainer"),
    rouletteCanvas: document.getElementById("rouletteCanvas"),
    wheelPointer: document.getElementById("wheelPointer"),
    rouletteResultBox: document.getElementById("rouletteResultBox"),
    spinBtn: document.getElementById("spinBtn"),
    spinBtnLabel: document.getElementById("spinBtnLabel"),
    spinSubInfo: document.getElementById("spinSubInfo"),
    prizesGrid: document.getElementById("prizesGrid"),
    toastContainer: document.getElementById("toastContainer"),
  };

  // セーブ・ロード
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw);
      const def = createDefaultState();
      return {
        ...def,
        ...parsed,
        owned: { ...def.owned, ...(parsed.owned || {}) },
        buffs: parsed.buffs || {},
      };
    } catch {
      return createDefaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ストレージ制限時は無視
    }
  }

  // 数値フォーマット
  function formatNumber(num) {
    return Math.floor(num).toLocaleString("ja-JP");
  }

  function formatRate(num) {
    if (num >= 100) return formatNumber(num);
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  }

  // アイテムコスト計算
  function getItemCost(item) {
    const count = state.owned[item.id] || 0;
    return Math.floor(item.baseCost * Math.pow(item.costScale, count));
  }

  // 基礎ステータスとバフ倍率計算
  function getBaseClickPower() {
    let click = 1;
    for (const item of SHOP_ITEMS) {
      if (item.type === "click") {
        click += (state.owned[item.id] || 0) * item.power;
      }
    }
    return click;
  }

  function getBaseAutoPPS() {
    let pps = 0;
    for (const item of SHOP_ITEMS) {
      if (item.type === "auto") {
        pps += (state.owned[item.id] || 0) * item.power;
      }
    }
    return pps;
  }

  function pruneExpiredBuffs(now = Date.now()) {
    let changed = false;
    for (const buffId of Object.keys(state.buffs)) {
      if (!BUFF_DEFINITIONS[buffId] || state.buffs[buffId].expiresAt <= now) {
        delete state.buffs[buffId];
        changed = true;
      }
    }
    return changed;
  }

  function getMultipliers(now = Date.now()) {
    pruneExpiredBuffs(now);
    let clickMult = 1;
    let autoMult = 1;
    for (const buffId of Object.keys(state.buffs)) {
      const def = BUFF_DEFINITIONS[buffId];
      if (def) {
        clickMult *= def.clickMult;
        autoMult *= def.autoMult;
      }
    }
    return { clickMult, autoMult };
  }

  function hasActiveBuff(now = Date.now()) {
    pruneExpiredBuffs(now);
    return Object.keys(state.buffs).length > 0;
  }

  // チケットがない場合のポイント消費ルーレット価格
  function getPointSpinCost() {
    const base = 120;
    const scale = Math.floor(state.paidSpins * 45 + getBaseAutoPPS() * 8);
    return base + scale;
  }

  // トースト通知
  function showToast(message, isGold = false) {
    const toast = document.createElement("div");
    toast.className = `toast${isGold ? " gold" : ""}`;
    toast.textContent = message;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.25s ease";
      setTimeout(() => toast.remove(), 260);
    }, 2800);
  }

  // フローティング +N 演出
  function spawnFloatingPoints(amount, clientX, clientY, isFever) {
    const pop = document.createElement("span");
    pop.className = `float-pop${isFever ? " fever" : ""}`;
    pop.textContent = `+${formatNumber(amount)}`;

    const stageRect = el.coreStage.getBoundingClientRect();
    let x = stageRect.width / 2 + (Math.random() - 0.5) * 48;
    let y = stageRect.height / 2 - 10 + (Math.random() - 0.5) * 26;

    if (typeof clientX === "number" && clientX > 0 && typeof clientY === "number" && clientY > 0) {
      x = clientX - stageRect.left + (Math.random() - 0.5) * 20;
      y = clientY - stageRect.top - 8;
    }

    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    el.floatingTextLayer.appendChild(pop);
    pop.addEventListener("animationend", () => pop.remove());
  }

  // コアクリック処理
  function handleCoreClick(event) {
    const now = Date.now();
    const { clickMult } = getMultipliers(now);
    const gain = getBaseClickPower() * clickMult;
    const fever = clickMult > 1;

    state.points += gain;
    state.totalClicks += 1;
    state.ticketCharge += 1;

    if (state.ticketCharge >= CLICKS_PER_TICKET) {
      state.ticketCharge -= CLICKS_PER_TICKET;
      state.tickets += 1;
      playTicketEarnSound();
      showToast("🎟️ 50クリック達成！無料ルーレットチケットを1枚獲得しました！", true);
    } else {
      playCoreClickSound(fever);
    }

    spawnFloatingPoints(gain, event.clientX, event.clientY, fever);

    el.coreBtn.classList.add("clicking");
    setTimeout(() => el.coreBtn.classList.remove("clicking"), 75);

    updateUI(now);
    saveState();
  }

  // ショップDOM初期構築 & 更新
  function buildShopDOM() {
    el.shopItemsContainer.innerHTML = "";
    for (const item of SHOP_ITEMS) {
      const card = document.createElement("div");
      card.className = "shop-card";
      card.dataset.itemId = item.id;

      const effectLabel =
        item.type === "auto"
          ? `⚡ 自動生産 +${formatNumber(item.power)} pt / 秒`
          : `👆 クリック獲得 +${formatNumber(item.power)} pt / 回`;

      card.innerHTML = `
        <div class="shop-left">
          <div class="shop-icon" aria-hidden="true">${item.icon}</div>
          <div class="shop-info">
            <div class="shop-title-line">
              <span class="shop-name">${item.name}</span>
              <span class="shop-owned" id="owned-${item.id}">所持: 0</span>
            </div>
            <p class="shop-desc">${item.desc}</p>
            <p class="shop-effect">${effectLabel}</p>
          </div>
        </div>
        <button type="button" class="buy-btn" id="buy-${item.id}">
          <span class="buy-cost" id="cost-${item.id}">0 pt</span>
          <span class="buy-label">購入する</span>
        </button>
      `;

      const buyBtn = card.querySelector(`#buy-${item.id}`);
      buyBtn.addEventListener("click", () => buyShopItem(item.id));
      el.shopItemsContainer.appendChild(card);
    }
  }

  function buyShopItem(itemId) {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    const cost = getItemCost(item);
    if (state.points < cost) return;

    state.points -= cost;
    state.owned[item.id] = (state.owned[item.id] || 0) + 1;
    playBuySound();
    updateUI();
    saveState();
  }

  function updateShopUI() {
    for (const item of SHOP_ITEMS) {
      const cost = getItemCost(item);
      const count = state.owned[item.id] || 0;
      const affordable = state.points >= cost;

      const card = el.shopItemsContainer.querySelector(`[data-item-id="${item.id}"]`);
      const ownedEl = document.getElementById(`owned-${item.id}`);
      const costEl = document.getElementById(`cost-${item.id}`);
      const buyBtn = document.getElementById(`buy-${item.id}`);

      if (card) card.classList.toggle("affordable", affordable);
      if (ownedEl) ownedEl.textContent = `所持: ${count}`;
      if (costEl) costEl.textContent = `${formatNumber(cost)} pt`;
      if (buyBtn) buyBtn.disabled = !affordable;
    }
  }

  // フィーバーバフUI更新（左パネルにリアルタイムカウントダウン表示）
  function updateBuffsUI(now = Date.now()) {
    pruneExpiredBuffs(now);
    const activeIds = Object.keys(state.buffs);
    const anyFever = activeIds.length > 0;

    el.leftPanel.classList.toggle("fever-active", anyFever);
    el.feverBadge.classList.toggle("active", anyFever);
    el.feverBadge.textContent = anyFever ? "FEVER ACTIVE!" : "STANDBY";

    if (!anyFever) {
      if (!el.activeBuffsList.querySelector(".buff-empty")) {
        el.activeBuffsList.innerHTML =
          '<div class="buff-empty">現在発動中のバフはありません（量子ルーレットで獲得可能）</div>';
      }
      return;
    }

    // 既存要素と同期して滑らかにカウントダウン更新
    if (el.activeBuffsList.querySelector(".buff-empty")) {
      el.activeBuffsList.innerHTML = "";
    }

    // 終了したバフDOMの削除
    Array.from(el.activeBuffsList.children).forEach((child) => {
      if (!state.buffs[child.dataset.buffId]) {
        child.remove();
      }
    });

    for (const buffId of activeIds) {
      const def = BUFF_DEFINITIONS[buffId];
      const buffState = state.buffs[buffId];
      const remainingMs = Math.max(0, buffState.expiresAt - now);
      const remainingSec = (remainingMs / 1000).toFixed(1);
      const totalMs = buffState.totalDuration || BUFF_DURATION_MS;
      const pct = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));

      let row = el.activeBuffsList.querySelector(`[data-buff-id="${buffId}"]`);
      if (!row) {
        row = document.createElement("div");
        row.className = "buff-item";
        row.dataset.buffId = buffId;
        row.innerHTML = `
          <div class="buff-item-top">
            <span class="buff-name">${def.icon} ${def.name}</span>
            <span class="buff-timer"></span>
          </div>
          <div class="buff-bar-track">
            <div class="buff-bar-fill"></div>
          </div>
        `;
        el.activeBuffsList.appendChild(row);
      }

      row.querySelector(".buff-timer").textContent = `残り ${remainingSec}秒`;
      row.querySelector(".buff-bar-fill").style.width = `${pct}%`;
    }
  }

  // タブ切り替え（右側パネル）
  function switchTab(tabName) {
    const isShop = tabName === "shop";
    el.shopTabBtn.classList.toggle("active", isShop);
    el.shopTabBtn.setAttribute("aria-selected", String(isShop));
    el.rouletteTabBtn.classList.toggle("active", !isShop);
    el.rouletteTabBtn.setAttribute("aria-selected", String(!isShop));

    el.shopTabPanel.hidden = !isShop;
    el.rouletteTabPanel.hidden = isShop;

    if (!isShop) {
      drawRouletteWheel(wheelAngleDeg);
    }
  }

  // 量子ルーレット盤のCanvas描画（高解像度対応・6分割）
  function drawRouletteWheel(rotationDeg) {
    const canvas = el.rouletteCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = 380;

    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;
    const sliceCount = ROULETTE_PRIZES.length; // 6
    const sliceRad = (Math.PI * 2) / sliceCount;
    const rotRad = (rotationDeg * Math.PI) / 180;

    ctx.translate(cx, cy);
    ctx.rotate(rotRad);

    for (let i = 0; i < sliceCount; i++) {
      const prize = ROULETTE_PRIZES[i];
      // i=0 の中心が真上(-Math.PI/2)になるよう配置
      const startAngle = i * sliceRad - Math.PI / 2 - sliceRad / 2;
      const endAngle = startAngle + sliceRad;

      const grad = ctx.createRadialGradient(0, 0, 26, 0, 0, radius);
      grad.addColorStop(0, prize.colorB);
      grad.addColorStop(1, prize.colorA);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(226, 232, 240, 0.38)";
      ctx.stroke();

      // スライス内ラベル描画
      ctx.save();
      ctx.rotate(i * sliceRad);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = "26px system-ui, sans-serif";
      ctx.fillText(prize.icon, 0, -radius * 0.68);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', sans-serif";
      ctx.fillText(prize.shortLabel, 0, -radius * 0.46);

      ctx.fillStyle = "rgba(241, 245, 249, 0.82)";
      ctx.font = "600 10.5px 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', sans-serif";
      ctx.fillText(prize.subLabel, 0, -radius * 0.34);
      ctx.restore();
    }

    // 外周リングとピン装飾
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
    ctx.stroke();

    for (let i = 0; i < sliceCount; i++) {
      const pinAngle = i * sliceRad - Math.PI / 2 - sliceRad / 2;
      const px = Math.cos(pinAngle) * (radius - 2);
      const py = Math.sin(pinAngle) * (radius - 2);
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fde047";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();
    }

    ctx.restore();
  }

  function buildPrizesLegend() {
    el.prizesGrid.innerHTML = "";
    for (const prize of ROULETTE_PRIZES) {
      const item = document.createElement("div");
      item.className = "prize-card";
      item.innerHTML = `
        <div class="prize-dot" style="background: linear-gradient(135deg, ${prize.colorA}, ${prize.colorB}); border: 1px solid ${prize.accent};">
          ${prize.icon}
        </div>
        <div class="prize-meta">
          <div class="prize-name">${prize.shortLabel}（${prize.subLabel}）</div>
          <div class="prize-detail">${prize.detail}</div>
        </div>
      `;
      el.prizesGrid.appendChild(item);
    }
  }

  // 重み付きランダム抽選
  function pickRouletteWinnerIndex() {
    const totalWeight = ROULETTE_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < ROULETTE_PRIZES.length; i++) {
      r -= ROULETTE_PRIZES[i].weight;
      if (r <= 0) return i;
    }
    return 0;
  }

  // バフ付与処理（重複当選時は残り時間を+30秒延長）
  function activateBuff(buffId) {
    const now = Date.now();
    const current = state.buffs[buffId];
    if (current && current.expiresAt > now) {
      const newExpires = current.expiresAt + BUFF_DURATION_MS;
      state.buffs[buffId] = {
        expiresAt: newExpires,
        totalDuration: newExpires - now,
      };
    } else {
      state.buffs[buffId] = {
        expiresAt: now + BUFF_DURATION_MS,
        totalDuration: BUFF_DURATION_MS,
      };
    }
  }

  // 当選景品の適用
  function applyRoulettePrize(prize) {
    let summaryDesc = prize.detail;

    switch (prize.id) {
      case "overdrive_2x":
        activateBuff("overdrive_2x");
        summaryDesc = "左パネルで発動中！30秒間、自動生産とクリック獲得が2倍になります！";
        showToast("⚡ フィーバー発動！30秒間 生産＆クリック2倍！", true);
        break;
      case "click_5x":
        activateBuff("click_5x");
        summaryDesc = "左パネルで発動中！30秒間、コアクリックの獲得量が5倍になります！";
        showToast("🔥 フィーバー発動！30秒間 クリック獲得5倍！", true);
        break;
      case "auto_3x":
        activateBuff("auto_3x");
        summaryDesc = "左パネルで発動中！30秒間、毎秒の自動生産が3倍にブースト！";
        showToast("🚀 フィーバー発動！30秒間 自動生産3倍！", true);
        break;
      case "double_tickets":
        state.tickets += 2;
        summaryDesc = "無料抽選チケットを2枚獲得しました！続けてルーレットを回せます！";
        showToast("🎟️ 大当たり！無料抽選チケット×2枚を獲得！", true);
        break;
      case "point_pack": {
        const bonus = Math.floor(Math.max(150, getBaseAutoPPS() * 18 + getBaseClickPower() * 28));
        state.points += bonus;
        summaryDesc = `+${formatNumber(bonus)} pt を即時獲得しました！`;
        showToast(`✨ エネルギーパック当選！ +${formatNumber(bonus)} pt`, false);
        break;
      }
      case "jackpot": {
        const jackpotPts = Math.floor(Math.max(600, getBaseAutoPPS() * 55 + getBaseClickPower() * 85));
        state.points += jackpotPts;
        summaryDesc = `超大当たり！ +${formatNumber(jackpotPts)} pt を即時獲得しました！`;
        showToast(`💎 JACKPOT!! +${formatNumber(jackpotPts)} pt 獲得！`, true);
        break;
      }
    }

    el.rouletteResultBox.classList.add("win");
    el.rouletteResultBox.innerHTML = `
      <span class="result-badge">🎉 WINNER PRIZE</span>
      <div class="result-title">${prize.title}</div>
      <div class="result-desc">${summaryDesc}</div>
    `;

    playRouletteWinSound();
    updateUI();
    saveState();
  }

  // 量子ルーレット回転開始
  function spinRoulette() {
    if (isSpinning) return;

    const usingFreeTicket = state.tickets > 0;
    const pointCost = getPointSpinCost();

    if (usingFreeTicket) {
      state.tickets -= 1;
    } else {
      if (state.points < pointCost) return;
      state.points -= pointCost;
      state.paidSpins += 1;
    }

    ensureAudioContext();
    isSpinning = true;
    el.rouletteResultBox.classList.remove("win");
    el.rouletteResultBox.innerHTML = `<span class="result-placeholder">🎰 量子ルーレット抽選中...</span>`;
    updateUI();
    saveState();

    const winnerIdx = pickRouletteWinnerIndex();
    const sliceDeg = 360 / ROULETTE_PRIZES.length; // 60度
    // スライスiが真上のポインターに来る角度: (360 - i * 60) % 360
    const targetModDeg = (360 - winnerIdx * sliceDeg) % 360;
    const jitterDeg = (Math.random() - 0.5) * 32; // ±16度の自然な停止位置ゆらぎ
    const currentMod = ((wheelAngleDeg % 360) + 360) % 360;
    const deltaToTarget = (targetModDeg - currentMod + 360) % 360;
    const fullSpins = (5 + Math.floor(Math.random() * 2)) * 360; // 5〜6回転

    const startAngle = wheelAngleDeg;
    const endAngle = startAngle + fullSpins + deltaToTarget + jitterDeg;
    const durationMs = 4_200;
    const startTime = performance.now();

    let lastTickSlot = Math.floor((startAngle + sliceDeg / 2) / sliceDeg);
    let pointerTimeout = null;

    function triggerPointerTick(speedRatio) {
      playRouletteTickSound(speedRatio);
      el.wheelPointer.classList.add("tick");
      clearTimeout(pointerTimeout);
      pointerTimeout = setTimeout(() => {
        el.wheelPointer.classList.remove("tick");
      }, 55);
    }

    function animateFrame(nowPerf) {
      const elapsed = nowPerf - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // 心地よい減速カーブ (easeOutQuart)
      const eased = 1 - Math.pow(1 - t, 4);
      wheelAngleDeg = startAngle + (endAngle - startAngle) * eased;

      drawRouletteWheel(wheelAngleDeg);

      // 境界ピンを通過するたびに電子ティック音＆ポインター振動
      const currentTickSlot = Math.floor((wheelAngleDeg + sliceDeg / 2) / sliceDeg);
      if (currentTickSlot > lastTickSlot) {
        lastTickSlot = currentTickSlot;
        const speedRatio = Math.max(0, 1 - t);
        triggerPointerTick(speedRatio);
      }

      if (t < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        wheelAngleDeg = endAngle;
        drawRouletteWheel(wheelAngleDeg);
        isSpinning = false;
        applyRoulettePrize(ROULETTE_PRIZES[winnerIdx]);
      }
    }

    requestAnimationFrame(animateFrame);
  }

  // ルーレットボタン・チケット表示更新
  function updateRouletteUI() {
    el.headerTicketCount.textContent = String(state.tickets);
    el.rouletteTicketCount.textContent = `🎟️ ${state.tickets} 枚`;

    if (state.tickets > 0) {
      el.rouletteTabBadge.textContent = String(state.tickets);
      el.rouletteTabBadge.classList.remove("hidden");
    } else {
      el.rouletteTabBadge.classList.add("hidden");
    }

    if (isSpinning) {
      el.spinBtn.disabled = true;
      el.spinBtnLabel.textContent = "🎰 回転中...";
      return;
    }

    if (state.tickets > 0) {
      el.spinBtn.disabled = false;
      el.spinBtn.classList.remove("point-mode");
      el.spinBtnLabel.textContent = `🎟️ 無料チケットで回す（残り${state.tickets}枚）`;
      el.spinSubInfo.textContent = "無料チケット保有中！ポイントを消費せずに抽選できます";
    } else {
      const cost = getPointSpinCost();
      const canAfford = state.points >= cost;
      el.spinBtn.disabled = !canAfford;
      el.spinBtn.classList.add("point-mode");
      el.spinBtnLabel.textContent = `💎 ポイントで回す（消費: ${formatNumber(cost)} pt）`;
      el.spinSubInfo.textContent = canAfford
        ? "ポイントを消費して今すぐ抽選できます（50クリックで無料チケットも獲得可能）"
        : `あと ${formatNumber(Math.ceil(cost - state.points))} pt で回せます（またはコアを50回クリックで無料チケット獲得）`;
    }
  }

  // UI全体の一括同期
  function updateUI(now = Date.now()) {
    const { clickMult, autoMult } = getMultipliers(now);
    const effectiveClick = getBaseClickPower() * clickMult;
    const effectivePPS = getBaseAutoPPS() * autoMult;

    el.pointsDisplay.textContent = formatNumber(state.points);

    el.perClickDisplay.textContent = `+${formatNumber(effectiveClick)}${clickMult > 1 ? ` (×${clickMult})` : ""}`;
    el.perClickDisplay.classList.toggle("boosted", clickMult > 1);

    el.perSecondDisplay.textContent = `+${formatRate(effectivePPS)}${autoMult > 1 ? ` (×${autoMult})` : ""}`;
    el.perSecondDisplay.classList.toggle("boosted", autoMult > 1);

    // 50クリックチケットゲージ
    const pct = (state.ticketCharge / CLICKS_PER_TICKET) * 100;
    el.ticketProgressLabel.textContent = `${state.ticketCharge} / ${CLICKS_PER_TICKET} クリック`;
    el.ticketProgressFill.style.width = `${pct}%`;
    el.ticketProgressBarWrap.setAttribute("aria-valuenow", String(state.ticketCharge));
    el.totalClicksDisplay.textContent = formatNumber(state.totalClicks);

    // サウンドボタン表示
    el.soundToggleBtn.setAttribute("aria-pressed", String(state.soundEnabled));
    el.soundToggleBtn.textContent = state.soundEnabled ? "🔊 サウンド ON" : "🔇 サウンド OFF";

    updateShopUI();
    updateBuffsUI(now);
    updateRouletteUI();
  }

  // イベントリスナー登録
  function bindEvents() {
    el.coreBtn.addEventListener("click", handleCoreClick);

    el.shopTabBtn.addEventListener("click", () => switchTab("shop"));
    el.rouletteTabBtn.addEventListener("click", () => switchTab("roulette"));
    el.headerTicketBadge.addEventListener("click", () => switchTab("roulette"));

    el.spinBtn.addEventListener("click", spinRoulette);

    el.soundToggleBtn.addEventListener("click", () => {
      state.soundEnabled = !state.soundEnabled;
      updateUI();
      saveState();
    });

    el.resetBtn.addEventListener("click", () => {
      if (isSpinning) return;
      const confirmed = window.confirm("セーブデータを初期化して最初からやり直しますか？（初期特典チケット1枚が再付与されます）");
      if (!confirmed) return;
      state = createDefaultState();
      el.rouletteResultBox.classList.remove("win");
      el.rouletteResultBox.innerHTML =
        '<span class="result-placeholder">ルーレットを回して量子ボーナスを引き当てよう！</span>';
      saveState();
      updateUI();
      showToast("データをリセットしました（初期特典チケット1枚付与）");
    });
  }

  // メインゲームループ（100ms刻みで滑らかな自動ポイント加算＆バフ秒数更新）
  let lastTickTime = Date.now();
  let saveAccumulatorMs = 0;

  function startGameLoop() {
    setInterval(() => {
      const now = Date.now();
      const dtSec = Math.min(60, Math.max(0, (now - lastTickTime) / 1000));
      lastTickTime = now;

      const { autoMult } = getMultipliers(now);
      const effectivePPS = getBaseAutoPPS() * autoMult;
      if (effectivePPS > 0 && dtSec > 0) {
        state.points += effectivePPS * dtSec;
      }

      updateUI(now);

      saveAccumulatorMs += dtSec * 1000;
      if (saveAccumulatorMs >= 3_000) {
        saveAccumulatorMs = 0;
        saveState();
      }
    }, 100);
  }

  // 初期化実行
  buildShopDOM();
  buildPrizesLegend();
  bindEvents();
  drawRouletteWheel(wheelAngleDeg);
  updateUI();
  startGameLoop();
})();
