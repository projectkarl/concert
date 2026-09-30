const pad3 = n => String(n).padStart(3, "0");

function arcSectionsByIds(ids, tier, radiusX, radiusZ, y, startAngle, endAngle, options = {}) {
  const count = ids.length;
  const step = count <= 1 ? .12 : Math.abs(endAngle - startAngle) / (count - 1);
  return ids.map((raw, i) => {
    const t = count <= 1 ? .5 : i / (count - 1);
    return {
      id: pad3(raw),
      tier,
      angle: startAngle + (endAngle - startAngle) * t,
      radiusX,
      radiusZ,
      centerX: Number(options.centerX || 0),
      centerZ: Number(options.centerZ || 0),
      y,
      span: options.span || Math.max(.038, step * .80),
      depthX: Number(options.depthX ?? 26),
      depthZ: Number(options.depthZ ?? 22),
      rise: Number(options.rise ?? 12),
      rowMax: options.rowMax,
      rowRangeConfidence: options.rowRangeConfidence || "estimated",
      seatEstimateMax: options.seatEstimateMax || 30,
      side: options.side || "infield"
    };
  });
}

function deg(v) { return v * Math.PI / 180; }

function floorSections() {
  // Activity-floor blocks are event-dependent. These 24 blocks remain only as the RUN IT
  // reference envelope and do not define the permanent Taipei Dome bowl.
  const coords = {
    "001": [-92, -116], "002": [92, -116], "003": [-46, -116], "004": [46, -116],
    "005": [-92, -76],  "006": [92, -76],  "007": [-46, -76],  "008": [46, -76],
    "009": [-92, -34],  "010": [92, -34],  "011": [-46, -34],  "012": [46, -34],
    "013": [-92, 8],    "014": [92, 8],    "015": [-46, 8],    "016": [46, 8],
    "017": [-104, 54],  "018": [-52, 54],  "019": [0, 54],     "020": [52, 54],
    "021": [-78, 100],  "022": [-26, 100], "023": [26, 100],  "024": [78, 100]
  };
  return Object.entries(coords).map(([id, [x, z]]) => ({ id, tier: "FLOOR", x, z, y: -20, rowMax: 30, seatEstimateMax: 30 }));
}

// v0.40.11.1 Taipei Dome physical-base rebuild.
// The permanent bowl follows the official baseball-plan topology: a shallower infield horseshoe,
// a materially deeper outfield arc, and upper decks concentrated around the infield/home-plate side.
// This intentionally stops treating Taipei Dome as a symmetric arena ellipse.
const lowerInfield = arcSectionsByIds(Array.from({length:23},(_,i)=>102+i), "LOWER", 204, 146, 0, deg(-28), deg(208), {
  centerZ:34, depthX:30, depthZ:26, rise:16, rowMax:38, rowRangeConfidence:"community-calibrated", seatEstimateMax:30, side:"infield"
});
const lowerOutfield = arcSectionsByIds(Array.from({length:16},(_,i)=>131+i), "LOWER", 214, 206, 0, deg(214), deg(326), {
  centerZ:24, depthX:30, depthZ:28, rise:16, rowMax:38, rowRangeConfidence:"estimated", seatEstimateMax:30, side:"outfield"
});

const middleInfield = arcSectionsByIds(Array.from({length:25},(_,i)=>201+i), "MIDDLE", 227, 164, 31, deg(-30), deg(210), {
  centerZ:43, depthX:29, depthZ:24, rise:13, rowMax:20, rowRangeConfidence:"community-calibrated", seatEstimateMax:32, side:"infield"
});
const middleOutfield = arcSectionsByIds(Array.from({length:12},(_,i)=>233+i), "MIDDLE", 238, 224, 31, deg(214), deg(326), {
  centerZ:20, depthX:29, depthZ:25, rise:13, rowMax:20, rowRangeConfidence:"estimated", seatEstimateMax:32, side:"outfield"
});

const vipInfield = arcSectionsByIds(Array.from({length:17},(_,i)=>301+i), "VIP", 249, 179, 56, deg(-16), deg(196), {
  centerZ:46, depthX:25, depthZ:21, rise:10, rowMax:8, rowRangeConfidence:"community-calibrated", seatEstimateMax:28, side:"infield"
});
const vipOutfield = arcSectionsByIds(Array.from({length:16},(_,i)=>319+i), "VIP", 258, 244, 56, deg(201), deg(339), {
  centerZ:15, depthX:25, depthZ:23, rise:10, rowMax:8, rowRangeConfidence:"estimated", seatEstimateMax:28, side:"outfield"
});

// 4xx / 5xx upper decks are not a full outer ring. They remain concentrated around the
// infield/home-plate side, matching the official fixed-stand plan and real concert sightlines.
const upper4 = arcSectionsByIds(Array.from({length:17},(_,i)=>401+i), "UPPER4", 276, 195, 80, deg(-8), deg(188), {
  centerZ:52, depthX:27, depthZ:22, rise:11, rowMax:8, rowRangeConfidence:"community-calibrated", seatEstimateMax:30, side:"infield"
});
const upper5 = arcSectionsByIds(Array.from({length:15},(_,i)=>501+i), "UPPER5", 304, 216, 102, deg(-4), deg(184), {
  centerZ:57, depthX:29, depthZ:24, rise:14, rowMax:18, rowRangeConfidence:"community-calibrated", seatEstimateMax:30, side:"infield"
});

const lower = [...lowerInfield, ...lowerOutfield];
const middle = [...middleInfield, ...middleOutfield];
const vip = [...vipInfield, ...vipOutfield];

export const taipeiDomeSections = [...floorSections(), ...lower, ...middle, ...vip, ...upper4, ...upper5];

export const taipeiDomeTiers = [
  { id: "FLOOR", label: "平面", short: "FLOOR", sections: taipeiDomeSections.filter(s => s.tier === "FLOOR").map(s => s.id) },
  { id: "LOWER", label: "下層", short: "1XX", sections: lower.map(s => s.id) },
  { id: "MIDDLE", label: "中層", short: "2XX", sections: middle.map(s => s.id) },
  { id: "VIP", label: "VIP層", short: "3XX", sections: vip.map(s => s.id) },
  { id: "UPPER4", label: "上層 L4", short: "4XX", sections: upper4.map(s => s.id) },
  { id: "UPPER5", label: "上層 L5", short: "5XX", sections: upper5.map(s => s.id) }
];

export const taipeiDomeBase = {
  id: "taipei-dome-base",
  label: "場館基準",
  capacity: 40000,
  sourceName: "臺北大巨蛋官方座位區平面圖",
  sourceUrl: "https://www.farglorydome.com.tw/park-detail/map/",
  notes: [
    "固定看台依臺北大巨蛋官方座位圖重建：內野馬蹄形與較深的外野弧分開建模，不再以對稱橢圓取代。",
    "4xx／5xx 上層看台只保留官方固定配置出現的內野側，不自動補成整圈 arena bowl。",
    "排數深度與單一座號仍屬校正模型；未完成建築實測尺度前不顯示測量級真實距離。",
    "演唱會舞台、控台、平面座席與封閉區域會依每場活動不同。"
  ]
};

const strayKidsSectionPriceLabels = {};
for (const n of [...Array.from({length:7},(_,i)=>103+i), ...Array.from({length:7},(_,i)=>117+i)]) strayKidsSectionPriceLabels[pad3(n)] = "NT$6,880";
for (const n of [102,110,116,124]) strayKidsSectionPriceLabels[pad3(n)] = "NT$5,880";
for (const n of [...Array.from({length:8},(_,i)=>204+i), ...Array.from({length:7},(_,i)=>216+i)]) strayKidsSectionPriceLabels[pad3(n)] = "NT$5,880";
for (const n of [202,203,223,224, ...Array.from({length:18},(_,i)=>301+i), ...Array.from({length:9},(_,i)=>405+i)]) strayKidsSectionPriceLabels[pad3(n)] = "NT$4,880";
for (const n of [401,402,403,404,414,415,416,417, ...Array.from({length:7},(_,i)=>506+i)]) strayKidsSectionPriceLabels[pad3(n)] = "NT$3,880";
for (const n of [503,504,505,513,514,515]) strayKidsSectionPriceLabels[pad3(n)] = "NT$2,880";

export const strayKidsRunItLayout = {
  id: "skz-run-it-2026",
  eventId: "skz-run-it-taipei-2026",
  label: "Stray Kids · RUN IT",
  date: "2026-12-12",
  sourceName: "tixCraft 官方售票頁",
  sourceUrl: "https://tixcraft.com/activity/detail/26_straykids",
  verifiedAt: "2026-09-16T21:23:00+08:00",
  stage: {
    main: { x: 0, y: -16, z: -145, width: 126, depth: 40 },
    runway: { x: 0, y: -15, z1: -125, z2: 26, width: 22 },
    bStage: { x: 0, y: -14, z: 8, radius: 31 }
  },
  bStageFacingSections: ["001","002","003","004","005","006","007","008","009","010","011","012","013","014","015","016"],
  restrictedViewSections: ["001","006","102","110","111","112","113","114","115","116","124","202","203","223","224"],
  frontRowCaution: true,
  sectionPriceLabels: strayKidsSectionPriceLabels,
  priceSummary: "VIP NT$7,880 / 一般 NT$6,880 / 5,880 / 4,880 / 3,880 / 2,880",
  seatLayoutSourceUrl: "https://static.tixcraft.com/images/activity/field/26_straykids_94646da4bfc54de7f8ccfdd2f7ea570e.jpg",
  notices: [
    "本場票價色階已依拓元官方座位圖同步到可可靠對應的固定看台區；灰色／未售或無法可靠辨識的區域不硬填票價。",
    "平面 001–016 區依官方售票頁說明，座位主要面向 B-stage；觀看主舞台時可能需要轉身。",
    "官方售票頁列出的部分看台與平面區可能因舞台、FOH、場館結構或設備而有受限視角。",
    "各看台前排亦可能受安全欄杆或牆面影響；實際程度依座位而異。"
  ]
};

// Community observations are used only as calibration hints. NEUL does not copy or host third-party photos.
export const taipeiDomeCalibration = {
  sourceName: "twconcertview 公開粉絲回報（外部校正參考）",
  sourceUrl: "https://twconcertview.com/venue/taipei-dome/",
  observations: {
    "107": { frontRowObserved: 8, note: "部分活動回報 8 排為實際開放前排，前方可能有欄杆或未售座位。" },
    "108": { overhangFromRow: 35, note: "後排有回報上方屋簷進入視野。" },
    "111": { overhangFromRow: 35, note: "最後數排有回報屋簷遮住部分上方燈光／雷射效果。" },
    "122": { frontRowObserved: 9, note: "部分活動回報 9 排為實際開放前排；不同活動可能不同。" },
    "222": { frontRowObserved: 2, note: "有回報 2 排為實際開放前排，矮個觀眾可能受欄杆影響。" },
    "301": { frontRowObserved: 2, note: "有回報前排受欄杆影響，身高會改變遮擋程度。" },
    "401": { frontRowObserved: 2, structuralRisk: true, note: "有回報高層側區可能受到結構柱或欄杆影響。" },
    "505": { farView: true, note: "高層回報以整體舞台與燈光為主，肉眼人物非常小。" },
    "509": { farView: true, steep: true, note: "高層回報距離遠且坡度明顯，適合看整體舞美。" }
  }
};

export function getTaipeiDomeSection(id) {
  return taipeiDomeSections.find(s => s.id === String(id).padStart(3, "0")) || null;
}

export function rowMaxForSection(section) {
  return Math.max(1, Number(section?.rowMax || 30));
}

export function sectionPosition(section, row = 12, seatNumber = null) {
  if (!section) return { x: 0, y: 0, z: 0 };
  const maxRow = rowMaxForSection(section);
  const r = Math.max(1, Math.min(maxRow, Number(row) || 1));
  const depth = maxRow <= 1 ? 0 : (r - 1) / (maxRow - 1);
  if (section.tier === "FLOOR") {
    const seatMax = section.seatEstimateMax || 30;
    const sn = Number(seatNumber);
    const side = Number.isFinite(sn) && sn > 0 ? (sn - (seatMax + 1) / 2) / seatMax : 0;
    return { x: section.x + side * 22, y: -18, z: section.z + depth * 18 };
  }
  const rx = section.radiusX + depth * Number(section.depthX ?? 28);
  const rz = section.radiusZ + depth * Number(section.depthZ ?? 22);
  const seatMax = section.seatEstimateMax || 30;
  const sn = Number(seatNumber);
  const seatOffset = Number.isFinite(sn) && sn > 0 ? ((sn - (seatMax + 1) / 2) / seatMax) * (section.span || .09) * 1.2 : 0;
  const a = section.angle + seatOffset;
  return {
    x: Number(section.centerX || 0) + Math.cos(a) * rx,
    y: section.y + depth * Number(section.rise ?? (section.tier === "LOWER" ? 15 : 12)),
    z: Number(section.centerZ || 0) + Math.sin(a) * rz
  };
}

export function calibrationForSection(sectionId) {
  return taipeiDomeCalibration.observations[String(sectionId).padStart(3,"0")] || null;
}

export function sectionWarning(sectionId, row, layout = strayKidsRunItLayout, viewer = {}) {
  const id = String(sectionId).padStart(3, "0");
  const messages = [];
  let level = "normal";
  const ticketPrice = layout?.sectionPriceLabels?.[id] || null;
  if (ticketPrice) messages.push(`本場官方座位圖對應票價：${ticketPrice}。`);
  if (layout.bStageFacingSections?.includes(id)) {
    messages.push("本區主要面向 B-stage；觀看主舞台時可能需要轉身。");
    level = "notice";
  }
  if (layout.restrictedViewSections?.includes(id)) {
    messages.push("官方售票資訊將本區列為可能受限視角區域。");
    level = "caution";
  }
  if (layout.frontRowCaution && Number(row) <= 3 && id !== "000") {
    messages.push("看台前排可能受到安全欄杆或牆面影響。");
    level = "caution";
  }
  const obs = calibrationForSection(id);
  if (obs?.overhangFromRow && Number(row) >= obs.overhangFromRow) {
    messages.push("外部實景回報顯示此區後排可能看到上方屋簷，部分高空燈光／雷射效果可能被遮住。");
    level = "caution";
  }
  if (obs?.frontRowObserved && Number(row) <= obs.frontRowObserved) {
    const h = Number(viewer.heightCm || 160);
    messages.push(`外部回報顯示此區前排可能接近欄杆；${h < 165 ? "較矮觀眾的遮擋感可能更明顯。" : "實際遮擋仍會因身高與站／坐狀態不同。"}`);
    if (level === "normal") level = "notice";
  }
  if (obs?.structuralRisk) {
    messages.push("外部回報曾提到此高層側區可能受場館結構柱／固定設施影響；請以本場配置為準。");
    if (level === "normal") level = "notice";
  }
  if (obs?.farView) {
    messages.push("外部實景回報顯示此高層區肉眼人物會非常小，較適合觀看整體舞台與燈光。");
    if (level === "normal") level = "notice";
  }
  return { level, messages };
}
