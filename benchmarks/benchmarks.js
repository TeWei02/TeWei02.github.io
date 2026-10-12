/* 實測基準頁 — 讀取兩個專案各自產生的 benchmark.json 並渲染。
 *
 * 兩個資料檔都在同一個網域下的兄弟路徑，所以直接相對路徑抓取，不需要 CORS。
 * 這裡不寫死任何數字：最佳點、百分比、表格內容全部從 JSON 推導。
 */
(function () {
  "use strict";

  var C = {
    accent: "#00d4aa",
    accent2: "#8b9cf7",
    amber: "#e8a850",
    danger: "#e06c75",
    line: "rgba(255,255,255,0.08)",
    text: "#e6e6ed",
    dim: "#9a9aa6",
    faint: "#64646e"
  };

  var MONO = "JetBrains Mono, SF Mono, monospace";

  function el(id) { return document.getElementById(id); }

  function fail(id, message) {
    var node = el(id);
    if (node) {
      node.textContent = message;
      node.className = "bench-status bad";
    }
  }

  function ok(id, message) {
    var node = el(id);
    if (node) {
      node.textContent = message;
      node.className = "bench-status ok";
    }
  }

  function niceTop(value, ticks) {
    var raw = value / ticks;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag;
    var step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    return step * ticks;
  }

  function num(value) {
    return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function fetchJson(path) {
    return fetch(path, { cache: "no-cache" }).then(function (response) {
      if (!response.ok) { throw new Error("HTTP " + response.status); }
      return response.json();
    });
  }

  /* ============================================================ ROS 前瞻距離 */
  function renderLookahead(data) {
    var rows = data.aggregate || [];
    if (!rows.length) { throw new Error("檔案裡沒有 aggregate 資料"); }

    var W = 900, H = 400, TICKS = 4;
    var pad = { l: 68, r: 68, t: 34, b: 58 };
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    var n = rows.length;

    function xAt(i) { return pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw); }

    var maxReturn = Math.max.apply(null, rows.map(function (r) { return r.meanReturn; }));
    var maxDev = Math.max.apply(null, rows.map(function (r) { return r.meanMeanMinDist; }));
    var returnTop = niceTop(maxReturn * 1.05, TICKS);
    var devTop = niceTop(maxDev * 1.05, TICKS);

    function yReturn(v) { return pad.t + ih - (v / returnTop) * ih; }
    function yDev(v) { return pad.t + ih - (v / devTop) * ih; }

    var best = rows.reduce(function (a, b) { return b.meanReturn > a.meanReturn ? b : a; });
    var published = null;
    rows.forEach(function (r) { if (r.isPublishedBaseline) { published = r; } });

    var p = [];
    p.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="平均報酬與平均偏差對前瞻距離的關係">');

    for (var g = 0; g <= TICKS; g++) {
      var y = pad.t + ih - (g / TICKS) * ih;
      p.push('<line x1="' + pad.l + '" y1="' + y.toFixed(1) + '" x2="' + (pad.l + iw) +
        '" y2="' + y.toFixed(1) + '" stroke="' + C.line + '" stroke-width="1"' +
        (g === 0 ? '' : ' stroke-dasharray="3 4"') + '/>');
      p.push('<text x="' + (pad.l - 10) + '" y="' + (y + 4).toFixed(1) + '" fill="' + C.dim +
        '" font-size="11" text-anchor="end" font-family="' + MONO + '">' +
        ((g / TICKS) * returnTop).toFixed(0) + '</text>');
      p.push('<text x="' + (pad.l + iw + 10) + '" y="' + (y + 4).toFixed(1) + '" fill="' + C.dim +
        '" font-size="11" text-anchor="start" font-family="' + MONO + '">' +
        ((g / TICKS) * devTop).toFixed(0) + '</text>');
    }

    p.push('<text x="' + pad.l + '" y="20" fill="' + C.accent + '" font-size="12">平均報酬</text>');
    p.push('<text x="' + (pad.l + iw) + '" y="20" fill="' + C.amber +
      '" font-size="12" text-anchor="end">平均偏差</text>');

    if (published) {
      var px = xAt(rows.indexOf(published));
      p.push('<line x1="' + px.toFixed(1) + '" y1="' + pad.t + '" x2="' + px.toFixed(1) +
        '" y2="' + (pad.t + ih) + '" stroke="' + C.danger +
        '" stroke-width="1.5" stroke-dasharray="5 4"/>');
      p.push('<text x="' + (px + 6).toFixed(1) + '" y="' + (pad.t + 14) +
        '" fill="' + C.danger + '" font-size="11">已發佈的 Ld</text>');
    }

    function series(key, yFn, colour, dash) {
      p.push('<polyline points="' + rows.map(function (r, i) {
        return xAt(i).toFixed(1) + "," + yFn(r[key]).toFixed(1);
      }).join(" ") + '" fill="none" stroke="' + colour + '" stroke-width="2.5"' +
        (dash ? ' stroke-dasharray="6 4"' : '') + '/>');
      rows.forEach(function (r, i) {
        p.push('<circle cx="' + xAt(i).toFixed(1) + '" cy="' + yFn(r[key]).toFixed(1) +
          '" r="4" fill="#0b0b10" stroke="' + colour + '" stroke-width="2"/>');
      });
    }

    series("meanReturn", yReturn, C.accent, false);
    series("meanMeanMinDist", yDev, C.amber, true);

    rows.forEach(function (r, i) {
      p.push('<text x="' + xAt(i).toFixed(1) + '" y="' + (pad.t + ih + 20) + '" fill="' + C.dim +
        '" font-size="11" text-anchor="middle" font-family="' + MONO + '">' + r.lookahead + '</text>');
    });
    p.push('<text x="' + (pad.l + iw / 2) + '" y="' + (H - 10) + '" fill="' + C.dim +
      '" font-size="12" text-anchor="middle">前瞻距離 Ld（長度單位）</text>');

    var bi = rows.indexOf(best);
    p.push('<circle cx="' + xAt(bi).toFixed(1) + '" cy="' + yReturn(best.meanReturn).toFixed(1) +
      '" r="8" fill="none" stroke="' + C.accent + '" stroke-width="2"/>');
    p.push('<text x="' + xAt(bi).toFixed(1) + '" y="' + (yReturn(best.meanReturn) - 16).toFixed(1) +
      '" fill="' + C.accent + '" font-size="11" text-anchor="middle">實測最佳</text>');
    p.push('</svg>');

    el("ros-chart").innerHTML = p.join("");

    el("ros-table").innerHTML = "<table><tr><th>Ld</th><th>到點率</th><th>平均報酬</th>" +
      "<th>平均偏差</th><th>最差偏差</th><th>平均步數</th></tr>" +
      rows.map(function (r) {
        var marks = [];
        if (r.isPublishedBaseline) { marks.push("已發佈"); }
        if (r === best) { marks.push("最佳"); }
        return "<tr" + (marks.length ? ' class="hl"' : "") + "><td>" + r.lookahead +
          (marks.length ? "（" + marks.join("、") + "）" : "") + "</td><td>" +
          (r.goalRate * 100).toFixed(0) + "%</td><td>" + r.meanReturn.toFixed(2) +
          "</td><td>" + r.meanMeanMinDist.toFixed(3) + "</td><td>" +
          r.worstMaxMinDist.toFixed(3) + "</td><td>" + r.meanSteps.toFixed(1) + "</td></tr>";
      }).join("") + "</table>";

    var note = "掃描 " + rows.length + " 個前瞻距離 × " +
      (data.runs ? data.runs.length / rows.length : "?") + " 個情境。實測最佳是 Ld = " +
      best.lookahead + "（平均報酬 " + best.meanReturn.toFixed(2) + "、平均偏差 " +
      best.meanMeanMinDist.toFixed(3) + "）";
    if (published && published !== best) {
      note += "；已發佈的 Ld = " + published.lookahead + " 報酬 " +
        published.meanReturn.toFixed(2) + "、偏差 " + published.meanMeanMinDist.toFixed(3) +
        "，報酬低了 " + ((1 - published.meanReturn / best.meanReturn) * 100).toFixed(0) +
        "%，追蹤偏差是 " + (published.meanMeanMinDist / best.meanMeanMinDist).toFixed(1) + " 倍。";
    } else {
      note += "。";
    }
    var goals = rows.map(function (r) { return r.goalRate; });
    if (Math.min.apply(null, goals) === Math.max.apply(null, goals)) {
      note += "到點率在每個設定都是 " + (rows[0].goalRate * 100).toFixed(0) +
        "%，不具鑑別力。";
    }
    el("ros-note").textContent = note;

    ok("ros-status", data.guard_passed ? "護欄通過：Ld = 30 那一列逐欄與已發佈的 reference.json 相符"
      : "護欄失敗");
  }

  /* ========================================================== 封包 階段成本 */
  function renderPipeline(data) {
    var rows = data.scaling || [];
    if (!rows.length) { throw new Error("檔案裡沒有 scaling 資料"); }

    var STAGES = [
      { key: "load_s", label: "載入擷取檔", colour: "#1d5f86" },
      { key: "parse_s", label: "逐層解析", colour: C.accent2 },
      { key: "dataframe_s", label: "DataFrame", colour: C.accent },
      { key: "statistics_s", label: "統計", colour: "#4ade80" },
      { key: "export_s", label: "匯出圖表（不計入吞吐量）", colour: C.amber }
    ];

    var W = 900, H = 400, TICKS = 4;
    var pad = { l: 62, r: 22, t: 36, b: 62 };
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

    function total(row) {
      return STAGES.reduce(function (s, st) { return s + row[st.key]; }, 0);
    }

    var top = niceTop(Math.max.apply(null, rows.map(total)) * 1.12, TICKS);
    var slot = iw / rows.length;
    var barW = Math.min(110, slot * 0.5);

    function yOf(v) { return pad.t + ih - (v / top) * ih; }

    var p = [];
    p.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="各擷取大小的階段成本堆疊圖">');

    for (var g = 0; g <= TICKS; g++) {
      var y = yOf((g / TICKS) * top);
      p.push('<line x1="' + pad.l + '" y1="' + y.toFixed(1) + '" x2="' + (pad.l + iw) +
        '" y2="' + y.toFixed(1) + '" stroke="' + C.line + '" stroke-width="1"' +
        (g === 0 ? '' : ' stroke-dasharray="3 4"') + '/>');
      p.push('<text x="' + (pad.l - 9) + '" y="' + (y + 4).toFixed(1) + '" fill="' + C.dim +
        '" font-size="11" text-anchor="end" font-family="' + MONO + '">' +
        ((g / TICKS) * top).toFixed(1) + '</text>');
    }
    p.push('<text x="' + pad.l + '" y="20" fill="' + C.dim + '" font-size="11">秒</text>');

    rows.forEach(function (row, i) {
      var cx = pad.l + slot * i + slot / 2;
      var x = cx - barW / 2;
      var cursor = pad.t + ih;
      STAGES.forEach(function (st) {
        var h = (row[st.key] / top) * ih;
        if (h <= 0) { return; }
        cursor -= h;
        p.push('<rect x="' + x.toFixed(1) + '" y="' + cursor.toFixed(1) + '" width="' +
          barW.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + st.colour +
          '" fill-opacity="' + (st.key === "export_s" ? "0.5" : "0.92") + '"/>');
      });
      p.push('<text x="' + cx.toFixed(1) + '" y="' + (cursor - 12).toFixed(1) + '" fill="' +
        C.text + '" font-size="12" text-anchor="middle" font-family="' + MONO + '">' +
        num(row.analysis_packets_per_sec) + '</text>');
      p.push('<text x="' + cx.toFixed(1) + '" y="' + (pad.t + ih + 20) + '" fill="' + C.dim +
        '" font-size="12" text-anchor="middle" font-family="' + MONO + '">' +
        num(row.packets) + '</text>');
      p.push('<text x="' + cx.toFixed(1) + '" y="' + (pad.t + ih + 38) + '" fill="' + C.faint +
        '" font-size="11" text-anchor="middle">' + (row.capture_bytes / 1024).toFixed(1) +
        ' KB</text>');
    });

    p.push('<text x="' + (pad.l + iw / 2) + '" y="' + (pad.t - 20) + '" fill="' + C.dim +
      '" font-size="11" text-anchor="middle">柱頂數字：分析吞吐量（封包／秒，不含匯出）</text>');
    p.push('<text x="' + (pad.l + iw / 2) + '" y="' + (H - 10) + '" fill="' + C.dim +
      '" font-size="12" text-anchor="middle">擷取檔中的封包數</text>');
    p.push('</svg>');

    el("pkt-chart").innerHTML = p.join("");
    el("pkt-legend").innerHTML = STAGES.map(function (st) {
      return '<span><i style="background:' + st.colour + '"></i>' + st.label + '</span>';
    }).join("");

    el("pkt-table").innerHTML = "<table><tr><th>封包數</th><th>擷取檔</th><th>載入</th>" +
      "<th>解析</th><th>DataFrame</th><th>統計</th><th>分析合計</th><th>分析 封包／秒</th>" +
      "<th>匯出</th></tr>" + rows.map(function (r) {
        return "<tr><td>" + num(r.packets) + "</td><td>" + (r.capture_bytes / 1024).toFixed(1) +
          " KB</td><td>" + r.load_s.toFixed(4) + " s</td><td>" + r.parse_s.toFixed(4) +
          " s</td><td>" + r.dataframe_s.toFixed(4) + " s</td><td>" + r.statistics_s.toFixed(4) +
          " s</td><td>" + r.analysis_s.toFixed(4) + " s</td><td>" +
          num(r.analysis_packets_per_sec) + "</td><td>" + r.export_s.toFixed(4) + " s</td></tr>";
      }).join("") + "</table>";

    var largest = rows[rows.length - 1];
    var note = "在 " + num(largest.packets) + " 個封包時，載入擷取檔佔了 " +
      largest.load_s.toFixed(2) + " 秒（分析合計 " + largest.analysis_s.toFixed(2) + " 秒的 " +
      ((largest.load_s / largest.analysis_s) * 100).toFixed(0) + "%），" +
      "而解析之後的所有階段——DataFrame 加統計——合計只有 " +
      (largest.dataframe_s + largest.statistics_s).toFixed(3) + " 秒。";
    if (data.memory && data.memory.peak_mb) {
      note += "峰值記憶體 " + data.memory.peak_mb + " MB（每個封包約 " +
        (data.memory.peak_mb * 1024 / largest.packets).toFixed(1) + " KB）。";
    }
    el("pkt-note").textContent = note;

    var env = data.environment || {};
    var m = data.methodology || {};
    ok("pkt-status", num(rows.length) + " 種擷取大小 · " + (env.cpu || "未知 CPU") +
      " · " + (m.repeat || "?") + " 次取中位數");
  }

  /* ==================================================================== 啟動 */
  fetchJson("../Robotic-Navigation-and-Exploration/data/benchmark.json")
    .then(renderLookahead)
    .catch(function (e) {
      fail("ros-status", "無法載入基準資料（" + e.message + "）。");
    });

  fetchJson("../Real-time-Packet-Monitoring-and-Traffic-Statistics-System/data/benchmark.json")
    .then(renderPipeline)
    .catch(function (e) {
      fail("pkt-status", "無法載入基準資料（" + e.message + "）。");
    });
})();