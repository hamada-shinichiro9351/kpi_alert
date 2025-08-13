// KPIAlertDashboard.tsx (practical edition)
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";

// =============================
// 型定義
// =============================
type Row = { date: string; metric: string; value: number };

type RuleBase = {
  id: string;
  window: number;
  direction?: "both" | "up" | "down"; // 追加
  severity?: "info" | "warn" | "crit"; // 追加
  notify?: boolean; // 追加: このルールで通知するか
};

type Rule =
  | (RuleBase & { type: "zscore"; threshold: number })
  | (RuleBase & { type: "pct_change"; thresholdPct: number });

type Anomaly = {
  date: string;
  metric: string;
  value: number;
  ruleId: string;
  ruleLabel: string;
  score: number;
  severity: "info" | "warn" | "crit";
  direction: "up" | "down";
};

type Granularity = "day" | "week" | "month";

// =============================
// デモデータ（試験運用用）
// =============================
const demoCSV = `date,metric,value
2025-01-01,売上,125000
2025-01-02,売上,118000
2025-01-03,売上,132000
2025-01-04,売上,128000
2025-01-05,売上,135000
2025-01-06,売上,142000
2025-01-07,売上,138000
2025-01-08,売上,145000
2025-01-09,売上,152000
2025-01-10,売上,148000
2025-01-11,売上,155000
2025-01-12,売上,162000
2025-01-13,売上,158000
2025-01-14,売上,165000
2025-01-15,売上,172000
2025-01-16,売上,168000
2025-01-17,売上,175000
2025-01-18,売上,182000
2025-01-19,売上,178000
2025-01-20,売上,185000
2025-01-21,売上,192000
2025-01-22,売上,188000
2025-01-23,売上,195000
2025-01-24,売上,202000
2025-01-25,売上,198000
2025-01-26,売上,205000
2025-01-27,売上,212000
2025-01-28,売上,208000
2025-01-29,売上,215000
2025-01-30,売上,222000
2025-01-31,売上,218000
2025-01-01,問い合わせ,45
2025-01-02,問い合わせ,42
2025-01-03,問い合わせ,48
2025-01-04,問い合わせ,46
2025-01-05,問い合わせ,50
2025-01-06,問い合わせ,52
2025-01-07,問い合わせ,49
2025-01-08,問い合わせ,53
2025-01-09,問い合わせ,55
2025-01-10,問い合わせ,52
2025-01-11,問い合わせ,56
2025-01-12,問い合わせ,58
2025-01-13,問い合わせ,55
2025-01-14,問い合わせ,59
2025-01-15,問い合わせ,61
2025-01-16,問い合わせ,58
2025-01-17,問い合わせ,62
2025-01-18,問い合わせ,64
2025-01-19,問い合わせ,61
2025-01-20,問い合わせ,65
2025-01-21,問い合わせ,67
2025-01-22,問い合わせ,64
2025-01-23,問い合わせ,68
2025-01-24,問い合わせ,70
2025-01-25,問い合わせ,67
2025-01-26,問い合わせ,71
2025-01-27,問い合わせ,73
2025-01-28,問い合わせ,70
2025-01-29,問い合わせ,74
2025-01-30,問い合わせ,76
2025-01-31,問い合わせ,73
2025-01-01,解約率,2.1
2025-01-02,解約率,1.9
2025-01-03,解約率,2.3
2025-01-04,解約率,2.0
2025-01-05,解約率,2.4
2025-01-06,解約率,2.6
2025-01-07,解約率,2.3
2025-01-08,解約率,2.7
2025-01-09,解約率,2.9
2025-01-10,解約率,2.6
2025-01-11,解約率,3.0
2025-01-12,解約率,3.2
2025-01-13,解約率,2.9
2025-01-14,解約率,3.3
2025-01-15,解約率,3.5
2025-01-16,解約率,3.2
2025-01-17,解約率,3.6
2025-01-18,解約率,3.8
2025-01-19,解約率,3.5
2025-01-20,解約率,3.9
2025-01-21,解約率,4.1
2025-01-22,解約率,3.8
2025-01-23,解約率,4.2
2025-01-24,解約率,4.4
2025-01-25,解約率,4.1
2025-01-26,解約率,4.5
2025-01-27,解約率,4.7
2025-01-28,解約率,4.4
2025-01-29,解約率,4.8
2025-01-30,解約率,5.0
2025-01-31,解約率,4.7
2025-01-01,新規登録,28
2025-01-02,新規登録,25
2025-01-03,新規登録,31
2025-01-04,新規登録,29
2025-01-05,新規登録,33
2025-01-06,新規登録,35
2025-01-07,新規登録,32
2025-01-08,新規登録,36
2025-01-09,新規登録,38
2025-01-10,新規登録,35
2025-01-11,新規登録,39
2025-01-12,新規登録,41
2025-01-13,新規登録,38
2025-01-14,新規登録,42
2025-01-15,新規登録,44
2025-01-16,新規登録,41
2025-01-17,新規登録,45
2025-01-18,新規登録,47
2025-01-19,新規登録,44
2025-01-20,新規登録,48
2025-01-21,新規登録,50
2025-01-22,新規登録,47
2025-01-23,新規登録,51
2025-01-24,新規登録,53
2025-01-25,新規登録,50
2025-01-26,新規登録,54
2025-01-27,新規登録,56
2025-01-28,新規登録,53
2025-01-29,新規登録,57
2025-01-30,新規登録,59
2025-01-31,新規登録,56
2025-01-01,ページビュー,12500
2025-01-02,ページビュー,11800
2025-01-03,ページビュー,13200
2025-01-04,ページビュー,12800
2025-01-05,ページビュー,13500
2025-01-06,ページビュー,14200
2025-01-07,ページビュー,13800
2025-01-08,ページビュー,14500
2025-01-09,ページビュー,15200
2025-01-10,ページビュー,14800
2025-01-11,ページビュー,15500
2025-01-12,ページビュー,16200
2025-01-13,ページビュー,15800
2025-01-14,ページビュー,16500
2025-01-15,ページビュー,17200
2025-01-16,ページビュー,16800
2025-01-17,ページビュー,17500
2025-01-18,ページビュー,18200
2025-01-19,ページビュー,17800
2025-01-20,ページビュー,18500
2025-01-21,ページビュー,19200
2025-01-22,ページビュー,18800
2025-01-23,ページビュー,19500
2025-01-24,ページビュー,20200
2025-01-25,ページビュー,19800
2025-01-26,ページビュー,20500
2025-01-27,ページビュー,21200
2025-01-28,ページビュー,20800
2025-01-29,ページビュー,21500
2025-01-30,ページビュー,22200
2025-01-31,ページビュー,21800`;

// =============================
// ユーティリティ
// =============================
const LSK = {
  rules: "kpi.rules.v1",
  ui: "kpi.ui.v1",
};

function normalizeHeaderCell(s: any) {
  return String(s || "").trim().toLowerCase();
}

function parseCSV(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  const [header, ...rows] = lines;
  const cols = header.split(",").map(normalizeHeaderCell);
  const iDate = cols.indexOf("date");
  const iMetric = cols.indexOf("metric");
  const iValue = cols.indexOf("value");
  if (iDate < 0 || iMetric < 0 || iValue < 0) {
    throw new Error("ヘッダーは date,metric,value を含む必要があります（順不同/大文字小文字OK）");
  }
  const out: Row[] = [];
  for (const r of rows) {
    const cells = r.split(",");
    const date = String(cells[iDate] ?? "").trim();
    const metric = String(cells[iMetric] ?? "").trim();
    const value = Number(cells[iValue]);
    if (!metric || !date || Number.isNaN(value)) continue;
    out.push({ date: normalizeDate(date), metric, value });
  }
  return out;
}

function parseExcel(file: File): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        // 最初に見つかった有効シートを利用
        const sheetName = workbook.SheetNames.find((n) => !!workbook.Sheets[n])!;
        const ws = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (json.length < 2) throw new Error("データが不足しています");
        const [header, ...rows] = json;
        const cols = (header || []).map(normalizeHeaderCell);
        const iDate = cols.indexOf("date");
        const iMetric = cols.indexOf("metric");
        const iValue = cols.indexOf("value");
        if (iDate < 0 || iMetric < 0 || iValue < 0) {
          throw new Error("ヘッダーは date,metric,value を含む必要があります（順不同）");
        }
        const out: Row[] = [];
        for (const cells of rows) {
          const date = String(cells?.[iDate] ?? "").trim();
          const metric = String(cells?.[iMetric] ?? "").trim();
          const value = Number(cells?.[iValue]);
          if (!metric || !date || Number.isNaN(value)) continue;
          out.push({ date: normalizeDate(date), metric, value });
        }
        resolve(out);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsArrayBuffer(file);
  });
}

function normalizeDate(d: string | number | Date): string {
  // 受け取った値をYYYY-MM-DDへ寄せる（YYYY/MM/DD, YYYY.MM.DD も許容）
  if (d instanceof Date) return toYmd(d);
  const s = String(d).trim().replace(/[./]/g, "-");
  const tryDate = new Date(s);
  if (!Number.isNaN(tryDate.getTime())) return toYmd(tryDate);
  // Excelの日付シリアルの可能性
  const num = Number(d);
  if (!Number.isNaN(num) && num > 20000 && num < 60000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + num * 24 * 60 * 60 * 1000);
    return toYmd(date);
  }
  return s; // 最後はそのまま
}

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function byMetric(rows: Row[]): Record<string, Row[]> {
  return rows.reduce<Record<string, Row[]>>((acc, r) => {
    (acc[r.metric] ||= []).push(r);
    return acc;
  }, {});
}
function sortByDateAsc(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date));
}

// ISO週
function toDate(d: string): Date {
  return new Date(`${d}T00:00:00`);
}
function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}
function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return { isoYear: d.getUTCFullYear(), isoWeek: weekNo };
}
function weekLabel(date: Date) {
  const { isoYear, isoWeek } = getISOWeek(date);
  return `${isoYear}-W${pad(isoWeek)}`;
}
function monthLabel(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

// 粒度集計（合計）
function aggregate(rows: Row[], g: Granularity): Row[] {
  if (g === "day") return sortByDateAsc(rows);
  const map = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const d = toDate(r.date);
    const key = g === "week" ? weekLabel(d) : monthLabel(d);
    if (!map.has(key)) map.set(key, new Map());
    const inner = map.get(key)!;
    inner.set(r.metric, (inner.get(r.metric) || 0) + r.value);
  }
  const out: Row[] = [];
  Array.from(map.keys())
    .sort((a, b) => a.localeCompare(b))
    .forEach((k) => {
      const inner = map.get(k)!;
      for (const [metric, value] of inner.entries()) out.push({ date: k, metric, value });
    });
  return out;
}

function rollingMeanStd(values: number[], window: number) {
  const means: (number | null)[] = [];
  const stds: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < window) {
      means.push(null);
      stds.push(null);
      continue;
    }
    const slice = values.slice(i + 1 - window, i + 1);
    const mean = slice.reduce((s, v) => s + v, 0) / slice.length;
    const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / slice.length;
    means.push(mean);
    stds.push(Math.sqrt(variance));
  }
  return { means, stds };
}

function pctChange(values: number[], window: number) {
  const changes: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const j = i - window;
    if (j < 0 || values[j] === 0) {
      changes.push(null);
      continue;
    }
    changes.push(((values[i] - values[j]) / Math.abs(values[j])) * 100);
  }
  return changes;
}

function movingAverage(values: (number | null)[], window: number) {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = i + 1 - window;
    if (start < 0) {
      out.push(null);
      continue;
    }
    const slice = values.slice(start, i + 1).filter((v) => v != null) as number[];
    if (slice.length < window) {
      out.push(null);
      continue;
    }
    out.push(slice.reduce((s, v) => s + v, 0) / window);
  }
  return out;
}

function matchesDirection(delta: number, direction: "both" | "up" | "down" | undefined) {
  if (!direction || direction === "both") return true;
  if (direction === "up") return delta > 0;
  return delta < 0;
}

function runRules(rows: Row[], rules: Rule[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const perMetric = byMetric(sortByDateAsc(rows));

  Object.entries(perMetric).forEach(([metric, series]) => {
    const values = series.map((r) => r.value);

    for (const rule of rules) {
      const severity = rule.severity || "warn";
      const direction = rule.direction || "both";

      if (rule.type === "zscore") {
        const { means, stds } = rollingMeanStd(values, rule.window);
        series.forEach((r, i) => {
          const mean = means[i];
          const sd = stds[i];
          if (mean == null || sd == null || sd === 0) return;
          const z = (r.value - mean) / sd;
          if (Math.abs(z) >= rule.threshold && matchesDirection(z, direction)) {
            anomalies.push({
              date: r.date,
              metric,
              value: r.value,
              ruleId: rule.id,
              ruleLabel: `±${rule.threshold.toFixed(1)}σ超（${rule.window}移動）`,
              score: Math.abs(z),
              severity,
              direction: z >= 0 ? "up" : "down",
            });
          }
        });
      } else if (rule.type === "pct_change") {
        const changes = pctChange(values, rule.window);
        series.forEach((r, i) => {
          const c = changes[i];
          if (c == null) return;
          if (Math.abs(c) >= rule.thresholdPct && matchesDirection(c, direction)) {
            anomalies.push({
              date: r.date,
              metric,
              value: r.value,
              ruleId: rule.id,
              ruleLabel: `±${rule.thresholdPct}%変化（${rule.window}日比較）`,
              score: Math.abs(c),
              severity,
              direction: c >= 0 ? "up" : "down",
            });
          }
        });
      }
    }
  });

  return anomalies.sort((a, b) => b.score - a.score);
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function formatNowYYYYMMDDHHmm(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}_${hh}${mm}`;
}

function downloadCSV(filename: string, rows: object[]) {
  const keys = uniq(rows.flatMap((r) => Object.keys(r)));
  const header = keys.join(",");
  const body = rows.map((r) => keys.map((k) => (r as any)[k] ?? "").join(",")).join("\n");
  const csv = header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function colorBySeverity(sev: "info" | "warn" | "crit") {
  if (sev === "crit") return "#ef4444";
  if (sev === "warn") return "#f59e0b";
  return "#3b82f6";
}

// =============================
// メインコンポーネント
// =============================
export default function KPIAlertDashboard() {
  const [rows, setRows] = useState<Row[]>(() => parseCSV(demoCSV));
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [maEnabled, setMaEnabled] = useState<boolean>(true);
  const [maWindow, setMaWindow] = useState<number>(3);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [dateRangeDays, setDateRangeDays] = useState<number>(30);
  const [accent, setAccent] = useState<"blue" | "emerald" | "violet" | "rose">("blue");

  // Webhook & 通知
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [autoNotify, setAutoNotify] = useState<boolean>(false);
  
  // 体験機能
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(2000);
  const [simulationData, setSimulationData] = useState<Row[]>([]);

  // ルール（方向と重大度を追加）
  const [rules, setRules] = useState<Rule[]>([
    { id: "r1", type: "zscore", window: 7, threshold: 2, direction: "both", severity: "warn", notify: true },
    { id: "r2", type: "pct_change", window: 7, thresholdPct: 20, direction: "both", severity: "info", notify: false },
  ]);

  // UI永続化ロード
  useEffect(() => {
    try {
      const savedRules = localStorage.getItem(LSK.rules);
      if (savedRules) setRules(JSON.parse(savedRules));
      const savedUi = localStorage.getItem(LSK.ui);
      if (savedUi) {
        const u = JSON.parse(savedUi);
        if (u.granularity) setGranularity(u.granularity);
        if (u.dateRangeDays !== undefined) setDateRangeDays(u.dateRangeDays);
        if (u.maEnabled !== undefined) setMaEnabled(u.maEnabled);
        if (u.maWindow !== undefined) setMaWindow(u.maWindow);
        if (u.accent) setAccent(u.accent);
        if (u.webhookUrl) setWebhookUrl(u.webhookUrl);
        if (u.autoNotify !== undefined) setAutoNotify(u.autoNotify);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI永続化セーブ
  useEffect(() => {
    localStorage.setItem(LSK.rules, JSON.stringify(rules));
  }, [rules]);
  useEffect(() => {
    localStorage.setItem(
      LSK.ui,
      JSON.stringify({ granularity, dateRangeDays, maEnabled, maWindow, accent, webhookUrl, autoNotify })
    );
  }, [granularity, dateRangeDays, maEnabled, maWindow, accent, webhookUrl, autoNotify]);

  // 期間フィルタ
  const filteredRows = useMemo(() => {
    const currentRows = isSimulationMode ? simulationData : rows;
    if (!currentRows.length) return currentRows;
    if (!dateRangeDays || dateRangeDays <= 0) return currentRows;
    const latest = currentRows.reduce<Date>((acc, r) => {
      const d = toDate(r.date);
      return d > acc ? d : acc;
    }, toDate(currentRows[0].date));
    const cutoff = new Date(latest);
    cutoff.setDate(cutoff.getDate() - (dateRangeDays - 1));
    return currentRows.filter((r) => toDate(r.date) >= cutoff);
  }, [rows, simulationData, isSimulationMode, dateRangeDays]);

  // 粒度集計
  const viewRows = useMemo(() => aggregate(filteredRows, granularity), [filteredRows, granularity]);
  const metrics = useMemo(() => uniq(viewRows.map((r: Row) => r.metric)), [viewRows]);

  // データ品質チェック
  const quality = useMemo(() => {
    const datesInvalid: { raw: string }[] = [];
    const dupKey = new Set<string>();
    const seen = new Set<string>();
    for (const r of rows) {
      const d = new Date(`${r.date}T00:00:00`);
      if (Number.isNaN(d.getTime())) datesInvalid.push({ raw: r.date });
      const key = `${r.date}@@${r.metric}`;
      if (seen.has(key)) dupKey.add(key);
      seen.add(key);
    }
    return {
      invalidCount: datesInvalid.length,
      duplicateCount: dupKey.size,
    };
  }, [rows]);

  // 異常検知
  const anomalies = useMemo(() => runRules(viewRows, rules), [viewRows, rules]);
  const highlights = useMemo(() => anomalies.slice(0, 3), [anomalies]);

  // シミュレーション機能
  useEffect(() => {
    if (!isSimulationMode) return;
    
    const interval = setInterval(() => {
      setSimulationData(prev => {
        const newData = [...prev];
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        
        // ランダムな異常値を生成
        const shouldAnomaly = Math.random() < 0.1; // 10%の確率で異常
        
        const newRow: Row = {
          date: dateStr,
          metric: 'sales',
          value: shouldAnomaly ? Math.floor(Math.random() * 50) + 150 : Math.floor(Math.random() * 20) + 90
        };
        
        // 古いデータを削除（最新30日分を保持）
        if (newData.length > 30) {
          newData.shift();
        }
        
        return [...newData, newRow];
      });
    }, simulationSpeed);
    
    return () => clearInterval(interval);
  }, [isSimulationMode, simulationSpeed]);
  
  // シミュレーション開始
  const startSimulation = () => {
    const baseData = parseCSV(demoCSV).slice(-10); // 最新10日分をベースに
    setSimulationData(baseData);
    setIsSimulationMode(true);
  };
  
  const stopSimulation = () => {
    setIsSimulationMode(false);
    setSimulationData([]);
  };

  // 通知（新しい検知をまとめてWebhookへ）
  async function postWebhook(payload: any) {
    if (!webhookUrl) return { ok: false, error: "Webhook URL未設定" };
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { ok: res.ok, status: res.status };
    } catch (e: any) {
      return { ok: false, error: e?.message || "送信失敗" };
    }
  }
  function buildPayload(anoms: Anomaly[]) {
    return {
      type: "kpi_anomalies",
      at: new Date().toISOString(),
      count: anoms.length,
      items: anoms.map((a) => ({
        date: a.date,
        metric: a.metric,
        value: a.value,
        rule: a.ruleLabel,
        score: Number(a.score.toFixed(2)),
        severity: a.severity,
        direction: a.direction,
      })),
    };
  }
  const notifiable = useMemo(
    () =>
      anomalies.filter((a) => {
        const rule = rules.find((r) => r.id === a.ruleId);
        return rule?.notify;
      }),
    [anomalies, rules]
  );

  useEffect(() => {
    if (autoNotify && webhookUrl && notifiable.length > 0) {
      // CORSの制約でブラウザから送れないWebhookもあります（その場合はサーバ側で仲介してください）
      postWebhook(buildPayload(notifiable));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNotify, webhookUrl, JSON.stringify(notifiable)]);

  // チャート用
  const [selectedMetric, setSelectedMetric] = useState<string | "ALL">("ALL");
  const chartData = useMemo(() => {
    const filtered = selectedMetric === "ALL" ? viewRows : viewRows.filter((r) => r.metric === selectedMetric);
    const perMetric = byMetric(sortByDateAsc(filtered));
    const dates = uniq(sortByDateAsc(filtered).map((r) => r.date));
    const baseData = dates.map((d) => {
      const base: any = { date: d };
      Object.entries(perMetric).forEach(([m, series]) => {
        const row = series.find((r) => r.date === d);
        base[m] = row?.value ?? null;
      });
      return base;
    });
    // 移動平均
    if (maEnabled) {
      const keys = selectedMetric === "ALL" ? Object.keys(perMetric) : [selectedMetric];
      for (const k of keys) {
        const seq = baseData.map((d) => (d as any)[k] as number | null);
        const ma = movingAverage(seq, maWindow);
        baseData.forEach((d, i) => ((d as any)[`${k}_ma`] = ma[i]));
      }
    }
    return baseData;
  }, [viewRows, selectedMetric, maEnabled, maWindow]);

  const metricKeys = useMemo(() => {
    if (selectedMetric !== "ALL") return [selectedMetric];
    return uniq(viewRows.map((r: Row) => r.metric));
  }, [viewRows, selectedMetric]);

  const palette = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#64748b"];
  const metricColorMap = useMemo(() => {
    const keys = selectedMetric !== "ALL" ? [selectedMetric] : Array.from(new Set(viewRows.map((r) => r.metric)));
    const m = new Map<string, string>();
    keys.forEach((k, i) => m.set(k, palette[i % palette.length]));
    return m;
  }, [viewRows, selectedMetric]);

  function anomalyColor(a: Anomaly) {
    const base = colorBySeverity(a.severity);
    return base;
  }

  // KPIサマリー
  type MetricSummary = {
    metric: string;
    last: number | null;
    changePct: number | null;
    series: { date: string; value: number }[];
  };
  const metricSummaries: MetricSummary[] = useMemo(() => {
    const perMetric = byMetric(sortByDateAsc(filteredRows));
    return Object.entries(perMetric).map(([metric, series]) => {
      const values = series.map((r) => r.value);
      const last = values.length ? values[values.length - 1] : null;
      const prev = values.length > 1 ? values[values.length - 2] : null;
      const changePct = last != null && prev != null && prev !== 0 ? ((last - prev) / Math.abs(prev)) * 100 : null;
      return { metric, last, changePct, series: series.map((r) => ({ date: r.date, value: r.value })) };
    });
  }, [filteredRows]);

  const displaySummaries = useMemo(() => {
    if (selectedMetric !== "ALL") return metricSummaries.filter((s) => s.metric === selectedMetric);
    return metricSummaries;
  }, [metricSummaries, selectedMetric]);

  function formatPct(p: number | null) {
    if (p == null || Number.isNaN(p)) return "-";
    const sign = p > 0 ? "+" : "";
    return `${sign}${p.toFixed(1)}%`;
  }

  // ファイル入出力
  function onFileUpload(file: File) {
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext === "csv") {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = parseCSV(String(reader.result));
          setRows(parsed);
        } catch (e: any) {
          alert("CSV解析に失敗: " + e.message);
        }
      };
      reader.readAsText(file);
    } else if (ext === "xlsx" || ext === "xls") {
      parseExcel(file)
        .then((parsed) => setRows(parsed))
        .catch((e: any) => alert("エクセル解析に失敗: " + e.message));
    } else {
      alert("CSV / XLSX / XLS を選択してください");
    }
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    const f = files.find((f) => ["csv", "xlsx", "xls"].includes(f.name.toLowerCase().split(".").pop() || ""));
    if (f) onFileUpload(f);
  }

  function addZRule() {
    const id = "r" + (rules.length + 1);
    setRules((rs) => [...rs, { id, type: "zscore", window: 7, threshold: 2, direction: "both", severity: "warn", notify: true }]);
  }
  function addPctRule() {
    const id = "r" + (rules.length + 1);
    setRules((rs) => [...rs, { id, type: "pct_change", window: 7, thresholdPct: 20, direction: "both", severity: "info", notify: false }]);
  }
  function updateRule(id: string, key: string, value: any) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } as Rule : r)));
  }
  function removeRule(id: string) {
    setRules((rs) => rs.filter((r) => r.id !== id));
  }

  // エクスポート
  function exportVisibleData() {
    const data = sortByDateAsc(viewRows).map((r) => ({ date: r.date, metric: r.metric, value: r.value }));
    const ts = formatNowYYYYMMDDHHmm();
    downloadCSV(`表示データ_${ts}.csv`, data);
  }
  function exportAnomalies() {
    const ts = formatNowYYYYMMDDHHmm();
    downloadCSV(`異常一覧_${ts}.csv`, anomalies);
  }


  // UI アクセント
  const accentStyles = useMemo(
    () => ({
      blue: {
        grad: "from-blue-500 to-indigo-500",
        ring: "ring-blue-200",
        border: "border-blue-200",
        text: "text-blue-700",
        badgeBg: "bg-blue-50",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        drop: "border-blue-400 bg-blue-50",
      },
      emerald: {
        grad: "from-emerald-500 to-teal-500",
        ring: "ring-emerald-200",
        border: "border-emerald-200",
        text: "text-emerald-700",
        badgeBg: "bg-emerald-50",
        button: "bg-emerald-600 hover:bg-emerald-700 text-white",
        drop: "border-emerald-400 bg-emerald-50",
      },
      violet: {
        grad: "from-violet-500 to-fuchsia-500",
        ring: "ring-violet-200",
        border: "border-violet-200",
        text: "text-violet-700",
        badgeBg: "bg-violet-50",
        button: "bg-violet-600 hover:bg-violet-700 text-white",
        drop: "border-violet-400 bg-violet-50",
      },
      rose: {
        grad: "from-rose-500 to-orange-500",
        ring: "ring-rose-200",
        border: "border-rose-200",
        text: "text-rose-700",
        badgeBg: "bg-rose-50",
        button: "bg-rose-600 hover:bg-rose-700 text-white",
        drop: "border-rose-400 bg-rose-50",
      },
    }),
    []
  );

  const anomalyDots = useMemo(() => {
    const sel = selectedMetric === "ALL" ? null : selectedMetric;
    return anomalies.filter((a) => !sel || a.metric === sel);
  }, [anomalies, selectedMetric]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white bg-grid" data-theme={accent}>
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b overflow-hidden">
        <div className={`pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl`}>
          <div className={`absolute -top-16 -left-20 w-64 h-64 rounded-full bg-gradient-to-br ${accentStyles[accent].grad}`}></div>
          <div className={`absolute -bottom-20 -right-16 w-64 h-64 rounded-full bg-gradient-to-br ${accentStyles[accent].grad} opacity-60`}></div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight whitespace-nowrap">
              <span className="inline-flex items-center gap-2">
                <span>📈</span>
                <span className={`bg-gradient-to-r ${accentStyles[accent].grad} bg-clip-text text-transparent`}>KPIアラート・ダッシュボード</span>
              </span>
            </h1>

            {/* theme selector */}
            <div className="ml-2 hidden sm:flex items-center gap-1">
              {(["blue", "emerald", "violet", "rose"] as const).map((c) => (
                <button
                  key={c}
                  aria-label={`theme-${c}`}
                  onClick={() => setAccent(c)}
                  className={`w-6 h-6 rounded-full border shadow-sm hover:scale-105 transition ${
                    accent === c ? "ring-2 ring-offset-2 " + accentStyles[accent].ring : ""
                  } ${
                    c === "blue"
                      ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                      : c === "emerald"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                      : c === "violet"
                      ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                      : "bg-gradient-to-br from-rose-500 to-orange-500"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* CSV/Excel Upload Section - ヘッダーの真下に配置 */}
      <div className="max-w-6xl mx-auto px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between gap-4">
          <div
            className={`relative px-4 py-2 rounded-xl border-2 border-dashed transition-colors inline-block ${
              isDragOver ? accentStyles[accent].drop : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label className="cursor-pointer text-sm whitespace-nowrap">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFileUpload(f);
                }}
              />
              📁 CSV/Excelをドラッグ&ドロップ またはクリックして選択
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <button className={`px-3 py-2 rounded-xl text-sm accent-button accent-focus whitespace-nowrap min-w-[80px]`} onClick={() => {
              // シミュレーションモードを停止してからデモデータを読み込み
              if (isSimulationMode) {
                stopSimulation();
              }
              setRows(parseCSV(demoCSV));
            }}>
              デモデータ
            </button>
            <button
              className={`px-6 py-3 rounded-xl text-sm accent-button accent-focus whitespace-nowrap min-w-[140px] ${isSimulationMode ? 'bg-red-600 hover:bg-red-700' : ''}`}
              onClick={isSimulationMode ? stopSimulation : startSimulation}
            >
              {isSimulationMode ? '🛑 シミュレーション停止' : '▶️ リアルタイム体験'}
            </button>
            <button className={`px-3 py-2 rounded-xl text-sm accent-button accent-focus whitespace-nowrap min-w-[100px]`} onClick={exportAnomalies}>
              異常CSVを出力
            </button>
            <button className={`px-3 py-2 rounded-xl text-sm accent-button accent-focus whitespace-nowrap min-w-[100px]`} onClick={exportVisibleData}>
              表示データCSV
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart & Highlights */}
        <section className="lg:col-span-3 space-y-6">
          {/* Metric & Granularity & MA Controls */}
          <TopControls
            metrics={metrics}
            selectedMetric={selectedMetric}
            setSelectedMetric={setSelectedMetric}
            dateRangeDays={dateRangeDays}
            setDateRangeDays={setDateRangeDays}
            granularity={granularity}
            setGranularity={setGranularity}
            maEnabled={maEnabled}
            setMaEnabled={setMaEnabled}
            maWindow={maWindow}
            setMaWindow={setMaWindow}
          />

          {/* シミュレーション制御 */}
          {isSimulationMode && (
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-800">🎮 リアルタイムシミュレーション中</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600">速度:</span>
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="500"
                      value={simulationSpeed}
                      onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                      className="w-24 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-blue-600">{simulationSpeed}ms</span>
                  </div>
                </div>
                <div className="text-xs text-blue-600">
                  💡 異常値が10%の確率で発生します
                </div>
              </div>
            </div>
          )}

          {/* 体験機能の説明 */}
          {!isSimulationMode && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border border-emerald-200">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h3 className="text-sm font-medium text-emerald-800 mb-1">体験機能で実際に試してみよう！</h3>
                  <div className="text-xs text-emerald-700 space-y-1">
                    <div>• <strong>リアルタイム体験</strong>: ボタンを押すと実際のデータがリアルタイムで更新され、異常検知を体験できます</div>
                    <div>• <strong>ルール調整</strong>: 右側のルール設定で閾値を変更すると、リアルタイムで検知結果が変わります</div>
                    <div>• <strong>速度調整</strong>: シミュレーション中は速度を調整して、異常の発生頻度を体験できます</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KPIサマリー */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {displaySummaries.map((s) => {
              const color = metricColorMap.get(s.metric) || "#0ea5e9";
              return (
                <div key={s.metric} className={`rounded-2xl bg-white p-4 shadow-sm border accent-border`}>
                  <div className={`h-1 rounded-full mb-3 bg-gradient-to-r ${accentStyles[accent].grad}`}></div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-gray-500">{s.metric}</div>
                      <div className="text-2xl font-bold mt-0.5 accent-text">{s.last ?? "-"}</div>
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        s.changePct != null ? (s.changePct >= 0 ? "text-emerald-600" : "text-red-600") : "text-gray-400"
                      }`}
                    >
                      {formatPct(s.changePct)}
                    </div>
                  </div>
                  <div className="h-10 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={s.series} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                        <Line type="monotone" dataKey="value" stroke={color} dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">トレンド（{granularity === "day" ? "日" : granularity === "week" ? "週" : "月"}次）</h2>
              <span className="text-xs text-gray-500">凡例クリックで表示/非表示</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 8, right: 8, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#475569" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#475569" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} />
                  <Legend wrapperStyle={{ paddingTop: 8 }} />
                  {metricKeys.map((k) => (
                    <Line key={k} type="monotone" dataKey={k} dot={false} strokeWidth={2} stroke={metricColorMap.get(k) || "#8884d8"} />
                  ))}
                  {maEnabled &&
                    metricKeys.map((k) => (
                      <Line
                        key={`${k}_ma`}
                        type="monotone"
                        dataKey={`${k}_ma`}
                        dot={false}
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        stroke={metricColorMap.get(k) || "#94a3b8"}
                        name={`${k} (MA${maWindow})`}
                      />
                    ))}
                  {anomalyDots.map((a, i) => (
                    <ReferenceDot
                      key={`${a.date}-${a.metric}-${i}`}
                      x={a.date}
                      y={(chartData.find((d) => d.date === a.date) as any)?.[a.metric]}
                      r={4}
                      fill={anomalyColor(a)}
                      label={{ value: "!", position: "top" }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight">
                <span className="inline-flex items-center gap-2">
                  <span>🎯</span>
                  <span>今日の注目3点</span>
                </span>
              </h3>
              <span className="text-sm text-gray-500">重大度と方向性を考慮</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {highlights.map((h, i) => (
                <motion.div
                  key={`${h.date}-${h.metric}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl bg-white p-4 shadow-sm border"
                  style={{ borderColor: colorBySeverity(h.severity) }}
                >
                  <div className="text-xs text-gray-500 mb-1">{h.date}</div>
                  <div className="text-base font-semibold mb-1 text-gray-800">{h.metric}</div>
                  <div className="text-2xl font-bold" style={{ color: colorBySeverity(h.severity) }}>
                    {h.value}
                  </div>
                  <div className="text-xs mt-2 text-gray-600">
                    {h.ruleLabel} / スコア {h.score.toFixed(2)} / {h.direction === "up" ? "↑" : "↓"} / {h.severity}
                  </div>
                </motion.div>
              ))}
              {highlights.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-500 bg-green-50 rounded-2xl border border-green-100">
                  <div className="text-2xl mb-2">
                    <span>🎉</span>
                  </div>
                  <div className="text-sm">異常なし。健全です！</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right: Rule Builder & Notifications & Quality */}
        <section className="space-y-6 lg:col-span-3">
          {/* Rule Builder */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">アラート条件（ルール）</h3>
              <div className="flex gap-2">
                <button onClick={addZRule} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">
                  ±σルール追加
                </button>
                <button onClick={addPctRule} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">
                  %変化ルール追加
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {rules.map((r) => (
                <div key={r.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      {r.type === "zscore" ? "±σルール" : "%変化ルール"} <span className="text-gray-400">#{r.id}</span>
                    </div>
                    <button onClick={() => removeRule(r.id)} className="text-sm text-red-600 hover:underline">
                      削除
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="text-xs text-gray-500">ウィンドウ（{granularity === "day" ? "日" : granularity === "week" ? "週" : "月"}）</label>
                      <input
                        type="number"
                        className="w-full mt-1 px-2 py-1.5 border rounded-lg"
                        value={r.window}
                        min={2}
                        onChange={(e) => updateRule(r.id, "window", Number(e.target.value))}
                      />
                    </div>
                    {r.type === "zscore" ? (
                      <div>
                        <label className="text-xs text-gray-500">閾値（σ）</label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full mt-1 px-2 py-1.5 border rounded-lg"
                          value={r.threshold}
                          onChange={(e) => updateRule(r.id, "threshold", Number(e.target.value))}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs text-gray-500">閾値（%）</label>
                        <input
                          type="number"
                          step="1"
                          className="w-full mt-1 px-2 py-1.5 border rounded-lg"
                          value={r.type === "pct_change" ? r.thresholdPct : 0}
                          onChange={(e) => updateRule(r.id, "thresholdPct", Number(e.target.value))}
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500">方向性</label>
                      <select
                        className="w-full mt-1 px-2 py-1.5 border rounded-lg"
                        value={r.direction || "both"}
                        onChange={(e) => updateRule(r.id, "direction", e.target.value)}
                      >
                        <option value="both">両方</option>
                        <option value="up">上振れのみ</option>
                        <option value="down">下振れのみ</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">重大度</label>
                      <select
                        className="w-full mt-1 px-2 py-1.5 border rounded-lg"
                        value={r.severity || "warn"}
                        onChange={(e) => updateRule(r.id, "severity", e.target.value)}
                      >
                        <option value="info">info</option>
                        <option value="warn">warn</option>
                        <option value="crit">crit</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">通知</label>
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={!!r.notify}
                          onChange={(e) => updateRule(r.id, "notify", e.target.checked)}
                        />{" "}
                        <span className="text-xs text-gray-700">Webhook対象</span>
                      </div>
                    </div>
                    <div className="sm:col-span-5">
                      <label className="text-xs text-gray-500">説明</label>
                      <div className="mt-1 text-xs text-gray-700 bg-gray-50 border rounded-lg px-2 py-1.5">
                        {r.type === "zscore"
                          ? `±${r.threshold}σ超（${r.window}${granularity === "day" ? "日" : granularity === "week" ? "週" : "ヶ月"}移動）`
                          : `±${(r as any).thresholdPct}%変化（${r.window}${granularity === "day" ? "日" : granularity === "week" ? "週" : "ヶ月"}比較）`}
                        {" ・ "}
                        {r.direction === "up" ? "上振れのみ" : r.direction === "down" ? "下振れのみ" : "両方"}
                        {" ・ "}
                        {r.severity || "warn"}
                      </div>
                      {/* リアルタイムプレビュー */}
                      <div className="mt-2 text-xs">
                        <span className="text-gray-500">検知数: </span>
                        <span className={`font-medium ${anomalies.filter(a => a.ruleId === r.id).length > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {anomalies.filter(a => a.ruleId === r.id).length}件
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {rules.length === 0 && <div className="text-sm text-gray-500">まだルールがありません。</div>}
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">通知設定（Webhook）</h3>
              <div className="text-xs text-gray-500">{notifiable.length} 件が通知対象</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Webhook URL（Slack等）</label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/..."
                  className="w-full mt-1 px-2 py-1.5 border rounded-lg"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <div className="text-[11px] text-gray-500 mt-1">※ ブラウザからのPOSTはCORSで失敗する場合があります（その場合はサーバ仲介）</div>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={autoNotify} onChange={(e) => setAutoNotify(e.target.checked)} />
                  自動で通知する
                </label>
                <button
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  onClick={async () => {
                    const res = await postWebhook(buildPayload(notifiable));
                    alert(res.ok ? "送信しました" : `送信失敗: ${res.status || res.error || ""}`);
                  }}
                  disabled={!webhookUrl || notifiable.length === 0}
                >
                  通知テスト
                </button>
              </div>
            </div>
          </div>

          {/* Data Quality */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">データ品質</h3>
            </div>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>日付パース不可: <span className={quality.invalidCount ? "text-red-600 font-semibold" : ""}>{quality.invalidCount}</span> 件</li>
              <li>重複（date×metric）: <span className={quality.duplicateCount ? "text-red-600 font-semibold" : ""}>{quality.duplicateCount}</span> 件</li>
            </ul>
          </div>

          {/* 右カラムからアノマリー表は移動 */}
        </section>
      </main>

      {/* Full-width Anomaly Table (moved below) */}
      <section className="max-w-6xl mx-auto px-4 pb-10 space-y-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">検出された異常</h3>
            <div className="text-xs text-gray-500">{anomalies.length} 件</div>
          </div>
          <div className="hidden md:block overflow-auto max-h-[560px] rounded-xl">
            <table className="table-smart">
              <thead>
                <tr>
                  <th>期間</th>
                  <th>メトリクス</th>
                  <th>値</th>
                  <th>方向</th>
                  <th>重大度</th>
                  <th>ルール</th>
                  <th>スコア</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a, i) => (
                  <tr key={`${a.date}-${a.metric}-${i}`} className="odd:bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap align-middle">{a.date}</td>
                    <td className="align-middle">{a.metric}</td>
                    <td className="align-middle font-semibold">{a.value}</td>
                    <td className="align-middle">
                      <span className="chip" title={a.direction === 'up' ? '上振れ' : '下振れ'}>
                        {a.direction === 'up' ? '↑ 上' : '↓ 下'}
                      </span>
                    </td>
                    <td className="align-middle">
                      <span className={a.severity === 'crit' ? 'badge badge-crit' : a.severity === 'warn' ? 'badge badge-warn' : 'badge badge-info'}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="align-middle max-w-[360px] truncate" title={a.ruleLabel}>{a.ruleLabel}</td>
                    <td className="align-middle font-mono">{a.score.toFixed(2)}</td>
                  </tr>
                ))}
                {anomalies.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">異常は検出されていません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-2">
            {anomalies.map((a, i) => (
              <div key={`${a.date}-${a.metric}-${i}`} className="stat">
                <div className="bar" />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">{a.date}</div>
                  <div className="flex items-center gap-2">
                    <span className={a.severity === 'crit' ? 'badge badge-crit' : a.severity === 'warn' ? 'badge badge-warn' : 'badge badge-info'}>
                      {a.severity}
                    </span>
                    <span className="chip">{a.direction === 'up' ? '↑ 上' : '↓ 下'}</span>
                  </div>
                </div>
                <div className="mt-1 text-lg font-extrabold accent-text">{a.metric}: {a.value}</div>
                <div className="text-xs text-gray-600 truncate" title={a.ruleLabel}>{a.ruleLabel}</div>
                <div className="mt-1 text-xs text-gray-500">score {a.score.toFixed(2)}</div>
              </div>
            ))}
            {anomalies.length === 0 && (<div className="empty">異常は検出されていません。</div>)}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-gray-500">
            <span className="inline-flex items-center gap-1">
              <span>📎</span>
              <span>対応フォーマット: <span className="font-mono">date,metric,value</span>（日付は <span className="font-mono">YYYY-MM-DD</span>）</span>
            </span>
          </div>
          <div className="mt-2">© 2025 KPI Alert Dashboard. 方向性・重大度・Webhook通知・ローカル保存対応。</div>
        </div>
      </footer>
    </div>
  );
}

// 小コンポーネント：上部コントロール
function TopControls(props: {
  metrics: string[];
  selectedMetric: string | "ALL";
  setSelectedMetric: (v: any) => void;
  dateRangeDays: number;
  setDateRangeDays: (n: number) => void;
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
  maEnabled: boolean;
  setMaEnabled: (b: boolean) => void;
  maWindow: number;
  setMaWindow: (n: number) => void;
}) {
  const {
    metrics,
    selectedMetric,
    setSelectedMetric,
    dateRangeDays,
    setDateRangeDays,
    granularity,
    setGranularity,
    maEnabled,
    setMaEnabled,
    maWindow,
    setMaWindow,
  } = props;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">メトリクス:</span>
      <button
        onClick={() => setSelectedMetric("ALL")}
        className={`px-3 py-1.5 rounded-full border text-sm ${
          selectedMetric === "ALL" ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
        }`}
      >
        ALL
      </button>
      {metrics.map((m) => (
        <button
          key={m}
          onClick={() => setSelectedMetric(m)}
          className={`px-3 py-1.5 rounded-full border text-sm ${
            selectedMetric === m ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
          }`}
        >
          {m}
        </button>
      ))}

      <div className="ml-auto flex items-center gap-3">
        {/* 期間フィルタ */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600 mr-1">期間</span>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDateRangeDays(d)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs ${
                dateRangeDays === d ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
              }`}
            >
              過去{d}日
            </button>
          ))}
          <button
            onClick={() => setDateRangeDays(0)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs ${
              dateRangeDays === 0 ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
            }`}
          >
            全て
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">粒度</span>
          <select className="text-sm border rounded-lg px-2 py-1.5" value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)}>
            <option value="day">日</option>
            <option value="week">週</option>
            <option value="month">月</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={maEnabled} onChange={(e) => setMaEnabled(e.target.checked)} />
            移動平均
          </label>
          <input
            type="number"
            className="w-20 text-sm border rounded-lg px-2 py-1.5"
            min={2}
            value={maWindow}
            onChange={(e) => setMaWindow(Number(e.target.value))}
            title="移動平均のウィンドウ（粒度単位）"
          />
        </div>
      </div>
    </div>
  );
}
