/* ============================================================
 * Task Manager — Design Generator (плагин для Figma)
 * ============================================================
 * Рисует дизайн менеджера задач из проекта task-manager:
 * канбан-доску в светлой и тёмной темах, модальные окна,
 * настройки, онбординг и UI-кит. Палитры и размеры — 1:1 из
 * src/styles/global.css.
 *
 * КАК ЗАПУСТИТЬ (один раз, ~2 минуты):
 *   1. Откройте Figma Desktop (или figma.com в браузере).
 *   2. Создайте НОВЫЙ пустой файл: File → New design file —
 *      он и станет отдельным файлом с дизайном.
 *   3. Меню → Plugins → Development → New Plugin...
 *      → «Figma design plugin» → выбрать папку task-manager/figma/plugin
 *      (важно: именно папку с этим файлом и manifest.json).
 *   4. Правый клик по холсту → Plugins → Development →
 *      «Task Manager — Design Generator».
 *   5. Готово: появится страница «Task Manager — UI Kit» с 7 экранами.
 *
 * Плагин работает только с открытым файлом (API Figma не позволяет
 * создавать файлы извне). Ничего не отправляет в сеть.
 * ============================================================ */

/* eslint-disable */

// ------------------------------------------------------------
// Палитры — 1:1 из src/styles/global.css (light :root / dark)
// ------------------------------------------------------------
const LIGHT = {
  bg: '#f1f5f9', bgDeep: '#e2e8f0', panel: '#ffffff', panelAlt: '#f8fafc',
  border: '#e2e8f0', borderStrong: '#cbd5e1',
  text: '#0f172a', textMuted: '#64748b',
  accent: '#059669', accentStrong: '#047857', accentSoft: '#d1fae5',
  warn: '#d97706', warnSoft: '#fef3c7',
  danger: '#dc2626', dangerStrong: '#b91c1c', dangerSoft: '#fee2e2',
  titlebar: '#ffffff',
  onAccent: '#ffffff',            // текст primary-кнопки (light)
  chipLowBg: '#e2e8f0',
  shadow: { r: 15 / 255, g: 23 / 255, b: 42 / 255, a: 0.08 },
  shadowLg: { r: 15 / 255, g: 23 / 255, b: 42 / 255, a: 0.14 },
  overlay: { r: 15 / 255, g: 23 / 255, b: 42 / 255, a: 0.45 },
};

const DARK = {
  bg: '#0f172a', bgDeep: '#0b1220', panel: '#1e293b', panelAlt: '#16202f',
  border: '#334155', borderStrong: '#475569',
  text: '#e2e8f0', textMuted: '#94a3b8',
  accent: '#10b981', accentStrong: '#34d399', accentSoft: '#064e3b',
  warn: '#f59e0b', warnSoft: '#451a03',
  danger: '#f87171', dangerStrong: '#ef4444', dangerSoft: '#450a0a',
  titlebar: '#141d2e',
  onAccent: '#052e21',            // текст primary-кнопки (dark)
  chipLowBg: '#334155',
  shadow: { r: 0, g: 0, b: 0, a: 0.4 },
  shadowLg: { r: 0, g: 0, b: 0, a: 0.55 },
  overlay: { r: 2 / 255, g: 6 / 255, b: 23 / 255, a: 0.65 },
};

// Цвета статусов (board-col__dot--*)
const STATUS_TODO = '#64748b';

// Размеры макета
const SCREEN_W = 1440;
const SCREEN_H = 900;
const SCREEN_GAP = 140;
const PAGE_PAD = 24;         // внешние поля содержимого
const COL_GAP = 14;          // зазор между колонками
const COL_W = 454;           // ширина колонки
const COL_H = 700;           // высота колонки
const CARD_W = 430;          // ширина карточки внутри списка
const MODAL_W = 560;

// ------------------------------------------------------------
// Шрифты: Inter (есть в Figma), запасной вариант — Roboto
// ------------------------------------------------------------
let F = null;

async function loadFonts() {
  const candidates = [
    { family: 'Inter', styles: { 400: 'Regular', 500: 'Medium', 600: 'Semi Bold', 700: 'Bold' } },
    { family: 'Inter', styles: { 400: 'Regular', 500: 'Regular', 600: 'Bold', 700: 'Bold' } },
    { family: 'Roboto', styles: { 400: 'Regular', 500: 'Medium', 600: 'Bold', 700: 'Bold' } },
  ];
  for (const c of candidates) {
    try {
      const uniq = Array.from(new Set(Object.values(c.styles)));
      for (const style of uniq) {
        await figma.loadFontAsync({ family: c.family, style });
      }
      return c;
    } catch (e) {
      // пробуем следующий кандидат
    }
  }
  return null;
}

// ------------------------------------------------------------
// Утилиты цвета и «мягкие» сеттеры (устойчивы к ограничениям API)
// ------------------------------------------------------------
function hex(c) {
  let s = String(c).replace('#', '');
  if (s.length === 3) s = s.split('').map((x) => x + x).join('');
  const n = parseInt(s, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function solid(color) {
  return [{ type: 'SOLID', color }];
}
function safe(fn) {
  try { fn(); } catch (e) { /* свойство может отсутствовать в старых клиентах */ }
}
function setSize(f, w, h) {
  safe(() => f.resize(w, h));
  safe(() => { if (Math.abs(f.width - w) > 0.5) f.width = w; });
  safe(() => { if (Math.abs(f.height - h) > 0.5) f.height = h; });
}
function setW(f, w) {
  safe(() => f.resize(w, f.height));
  safe(() => { if (Math.abs(f.width - w) > 0.5) f.width = w; });
}
function setH(f, h) {
  safe(() => f.resize(f.width, h));
  safe(() => { if (Math.abs(f.height - h) > 0.5) f.height = h; });
}
function setStroke(f, color, weight, dash) {
  safe(() => {
    f.strokes = solid(color);
    f.strokeWeight = weight;
    if (dash) f.dashPattern = dash;
  });
}
function setShadow(f, c) {
  safe(() => {
    f.effects = [{
      type: 'DROP_SHADOW', color: c, offset: { x: 0, y: 1 },
      radius: 3, spread: 0, visible: true, blendMode: 'NORMAL',
    }];
  });
}
function setShadowLg(f, c) {
  safe(() => {
    f.effects = [{
      type: 'DROP_SHADOW', color: c, offset: { x: 0, y: 10 },
      radius: 30, spread: 0, visible: true, blendMode: 'NORMAL',
    }];
  });
}

// ------------------------------------------------------------
// Фабрики узлов
// ------------------------------------------------------------

/** Текст. weight: 400 | 500 | 600 | 700. */
function txt(chars, opts) {
  const o = opts || {};
  const t = figma.createText();
  safe(() => { t.fontName = { family: F.family, style: F.styles[o.weight || 400] }; });
  t.characters = chars;
  t.fontSize = o.size || 13;
  t.fills = solid(o.color === undefined ? LIGHT.text : o.color);
  if (o.ls) safe(() => { t.letterSpacing = { value: o.ls, unit: 'PIXELS' }; });
  if (o.lh) safe(() => { t.lineHeight = { value: o.lh, unit: 'PIXELS' }; });
  if (o.upper) safe(() => { t.textCase = 'UPPER'; });
  if (o.center) safe(() => { t.textAlignHorizontal = 'CENTER'; });
  t.name = o.name || ('Text: ' + chars.slice(0, 24));
  return t;
}

/** Прямоугольник. */
function rect(w, h, fill, opts) {
  const o = opts || {};
  const r = figma.createRectangle();
  r.name = o.name || 'rect';
  r.fills = fill === null ? [] : solid(fill);
  r.cornerRadius = o.radius || 0;
  if (o.rotation) safe(() => { r.rotation = o.rotation; });
  setSize(r, w, h);
  if (o.stroke) setStroke(r, o.stroke, o.strokeWeight || 1, o.dash);
  return r;
}

/** Эллипс. */
function ellipse(w, h, fill, opts) {
  const o = opts || {};
  const e = figma.createEllipse();
  e.name = o.name || 'ellipse';
  e.fills = fill === null ? [] : solid(fill);
  if (o.stroke) {
    setStroke(e, o.stroke, o.strokeWeight || 1);
  } else {
    e.strokes = [];
  }
  setSize(e, w, h);
  return e;
}

/**
 * Auto-layout контейнер.
 * o.layout: 'VERTICAL' | 'HORIZONTAL'; o.gap, o.pad: [t, r, b, l];
 * o.w / o.h — фиксирует ось (для auto-layout вторая ось «обнимает» контент);
 * o.hugX / o.hugY — обнимать обе оси; o.between — space-between по главной оси;
 * o.center2 — выравнивание по поперечной оси CENTER; o.wrap — перенос строк.
 */
function box(name, o) {
  const p = o || {};
  const f = figma.createFrame();
  f.name = name;
  f.fills = p.fill === null ? [] : (p.fill !== undefined ? solid(p.fill) : []);
  if (p.radius) f.cornerRadius = p.radius;
  if (p.stroke) setStroke(f, p.stroke, p.strokeWeight || 1, p.dash);
  if (p.clip !== undefined) f.clipsContent = !!p.clip;
  if (p.shadow) setShadow(f, p.shadow);
  if (p.shadowLg) setShadowLg(f, p.shadowLg);
  if (p.opacity !== undefined) safe(() => { f.opacity = p.opacity; });
  if (p.layout) {
    safe(() => { f.layoutMode = p.layout; });
    safe(() => { f.itemSpacing = p.gap || 0; });
    const pad = p.pad || [0, 0, 0, 0];
    safe(() => { f.paddingTop = pad[0]; f.paddingRight = pad[1]; f.paddingBottom = pad[2]; f.paddingLeft = pad[3]; });
    const mainAuto = p.layout === 'VERTICAL' ? p.hugY !== false : p.hugX !== false;
    safe(() => { f.primaryAxisSizingMode = (p.h === undefined && mainAuto) ? 'AUTO' : 'FIXED'; });
    safe(() => { f.counterAxisSizingMode = (p.w === undefined) ? 'AUTO' : 'FIXED'; });
    if (p.between) safe(() => { f.primaryAxisAlignItems = 'SPACE_BETWEEN'; });
    else if (p.center) safe(() => { f.primaryAxisAlignItems = 'CENTER'; });
    else if (p.end) safe(() => { f.primaryAxisAlignItems = 'MAX'; });
    safe(() => { f.counterAxisAlignItems = p.center2 ? 'CENTER' : 'MIN'; });
    if (p.wrap) safe(() => { f.layoutWrap = 'WRAP'; });
  }
  if (p.w !== undefined && p.h !== undefined) setSize(f, p.w, p.h);
  else if (p.w !== undefined) setW(f, p.w);
  else if (p.h !== undefined) setH(f, p.h);
  else if (p.layout) {
    safe(() => { f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; });
  }
  return f;
}

/** Положить узел в обычный (не auto-layout) контейнер по координатам. */
function place(parent, node, x, y) {
  parent.appendChild(node);
  node.x = x;
  node.y = y;
  return node;
}

/** Вставить ребёнка в auto-layout родителя (+ растяжение). */
function put(parent, node, opts) {
  const o = opts || {};
  parent.appendChild(node);
  if (o.stretch) safe(() => { node.layoutAlign = 'STRETCH'; });
  if (o.grow) safe(() => { node.layoutGrow = 1; });
  return node;
}

// ------------------------------------------------------------
// Переиспользуемые контролы
// ------------------------------------------------------------

/** Кнопка. variant: primary | secondary | ghost | danger. */
function button(label, C, variant, opts) {
  const o = opts || {};
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const ghost = variant === 'ghost';
  const pad = o.lg ? [11, 20, 11, 20] : [8, 14, 8, 14];
  const f = box('Button / ' + label, {
    layout: 'HORIZONTAL', gap: 7, pad, radius: 9, center: true, center2: true,
    fill: isPrimary ? C.accent : (isDanger ? C.danger : (ghost ? null : C.panel)),
    stroke: ghost ? C.borderStrong : (isPrimary ? C.accent : (isDanger ? C.danger : C.borderStrong)),
    dash: ghost ? [5, 4] : undefined,
  });
  const t = txt(label, { size: o.lg ? 14 : 13, weight: 600, color: isPrimary ? C.onAccent : (isDanger ? '#ffffff' : C.text) });
  put(f, t);
  return f;
}

/** Чип (приоритет, счётчик, тег). */
function chip(label, C, bg, fg, opts) {
  const o = opts || {};
  const f = box('Chip / ' + label, {
    layout: 'HORIZONTAL', pad: o.pad || [2, 8, 2, 8], radius: 999,
    fill: bg, stroke: o.stroke, gap: 4, center2: true,
  });
  put(f, txt(label, {
    size: o.size || 10.5, weight: 700, color: fg,
    upper: o.upper !== false, ls: 0.4,
  }));
  return f;
}

/** kbd-плашка горячей клавиши. */
function kbd(label, C) {
  const f = box('Kbd / ' + label, {
    layout: 'HORIZONTAL', pad: [2, 7, 2, 7], radius: 6,
    fill: C.panelAlt, stroke: C.borderStrong, center2: true,
  });
  put(f, txt(label, { size: 12, weight: 600, color: C.text }));
  return f;
}

/** Поле ввода (input) с плейсхолдером/значением. */
function inputBox(w, h, value, C, opts) {
  const o = opts || {};
  const f = box('Input' + (o.name ? ' / ' + o.name : ''), {
    w, h, fill: C.panel, radius: 9, stroke: o.error ? C.danger : C.borderStrong, clip: true,
  });
  place(f, txt(value, {
    size: 13.5, color: o.muted ? C.textMuted : C.text, name: 'value',
  }), 12, Math.max(2, Math.round((h - 18) / 2) - 1));
  return f;
}

/** Селект тулбара («Статус: все»). */
function selectBox(w, label, C) {
  const f = box('Select / ' + label, { w, h: 32, fill: C.panel, radius: 8, stroke: C.borderStrong, clip: true });
  place(f, txt(label, { size: 12.5, color: C.text }), 10, 8);
  // стрелка-шеврон
  const c1 = rect(7, 1.6, C.textMuted, { rotation: 45, name: 'chevron 1' });
  const c2 = rect(7, 1.6, C.textMuted, { rotation: -45, name: 'chevron 2' });
  place(f, c1, w - 20, 13);
  place(f, c2, w - 15, 13);
  return f;
}

/** Переключатель. */
function switchToggle(C, on) {
  const f = box('Switch / ' + (on ? 'on' : 'off'), {
    w: 40, h: 22, fill: on ? C.accent : C.borderStrong, radius: 999, clip: true,
  });
  place(f, ellipse(16, 16, '#ffffff', { name: 'thumb' }), on ? 21 : 3, 3);
  return f;
}

/** Иконка поиска (лупа из окружности и штриха). */
function searchIcon(C) {
  const g = box('icon / search', { w: 18, h: 18, fill: null });
  place(g, ellipse(11, 11, null, { stroke: C.textMuted, strokeWeight: 1.6, name: 'ring' }), 1, 1);
  place(g, rect(6, 1.6, C.textMuted, { rotation: 45, name: 'handle' }), 11, 11.5);
  return g;
}

/** Крестик закрытия. */
function closeIcon(C) {
  const g = box('icon / close', { w: 12, h: 12, fill: null });
  place(g, rect(11, 1.8, C.textMuted, { rotation: 45 }), 0.5, 5);
  place(g, rect(11, 1.8, C.textMuted, { rotation: -45 }), 0.5, 5);
  return g;
}

/** Галочка (для активной карточки темы). */
function checkIcon(color) {
  const g = box('icon / check', { w: 14, h: 12, fill: null });
  place(g, rect(8, 2, color, { rotation: 45 }), 0, 5.5);
  place(g, rect(5, 2, color, { rotation: -45 }), 5.5, 4);
  return g;
}

// ------------------------------------------------------------
// Крупные блоки
// ------------------------------------------------------------

/** Кастомный title bar (frameless-окно). */
function titleBar(C, width, opts) {
  const o = opts || {};
  const f = box('TitleBar', {
    w: width, h: 40, fill: C.titlebar, clip: true, name: 'TitleBar',
  });
  // логотип: два квадратика (изумруд + янтарь), имитация градиента
  const logo = box('logo', { w: 12, h: 12, fill: null, name: 'logo' });
  place(logo, rect(7, 12, C.accent, { radius: 4, name: 'a' }), 0, 0);
  place(logo, rect(7, 12, C.warn, { radius: 4, name: 'b' }), 5, 0);
  place(f, logo, 14, 14);
  place(f, txt('Task Manager', { size: 13, weight: 600, ls: 0.2 }), 34, 12);
  place(f, chip('BROWSER', C, null, C.textMuted, { size: 11, pad: [1, 8, 1, 8], stroke: C.borderStrong }), 170, 11);

  // кнопки управления окном: свернуть / развернуть / закрыть
  const btnMin = box('win / minimize', { w: 40, h: 30, fill: null, radius: 6 });
  place(btnMin, rect(10, 1.6, C.textMuted), 15, 14);
  const btnMax = box('win / maximize', { w: 40, h: 30, fill: null, radius: 6 });
  place(btnMax, rect(10, 10, null, { stroke: C.textMuted, strokeWeight: 1.4, name: 'square' }), 15, 10);
  const btnClose = box('win / close', { w: 40, h: 30, fill: null, radius: 6 });
  place(btnClose, closeIcon(C), 14, 9);
  place(f, btnClose, width - 44, 5);
  place(f, btnMax, width - 84, 5);
  place(f, btnMin, width - 124, 5);

  place(f, rect(width, 1, C.border, { name: 'border bottom' }), 0, 39);
  if (o.dim) safe(() => { f.opacity = 0.6; });
  return f;
}

/** Панель поиска и фильтров. */
function toolbar(C, width) {
  const f = box('Toolbar', { w: width, h: 84, fill: null });

  // строка 1: поиск + счётчик + кнопка создания
  const search = box('Search', { w: 420, h: 38, fill: C.panel, radius: 10, stroke: C.borderStrong, clip: true });
  place(search, searchIcon(C), 12, 10);
  place(search, txt('Поиск по названию, описанию, тегам…', { size: 13.5, color: C.textMuted }), 38, 10);
  place(f, search, 0, 0);
  place(f, txt('Всего: 4   ·   Просрочено: 1', { size: 12.5, color: C.textMuted }), 444, 11);
  place(f, button('+  Новая задача', C, 'primary'), width - 158, 3);

  // строка 2: фильтры
  let x = 0;
  const filters = [
    ['Статус: все', 118],
    ['Приоритет: все', 148],
    ['Тег: все', 96],
    ['Дата: все', 104],
  ];
  for (const [label, w] of filters) {
    place(f, selectBox(w, label, C), x, 52);
    x += w + 8;
  }
  place(f, button('Сбросить фильтры', C, 'ghost'), x + 4, 52);
  return f;
}

/** Карточка задачи (absolute-раскладка внутри). */
function taskCard(C, task) {
  const hasDesc = !!task.desc;
  const h = task.compact ? 78 : (hasDesc ? 122 : 96);
  const stripeColor = task.prio === 'high' ? C.danger : (task.prio === 'medium' ? C.warn : STATUS_TODO);
  const f = box('TaskCard / ' + task.title, {
    w: CARD_W, h, fill: C.panel, radius: 10, stroke: C.border, shadow: C.shadow, clip: true,
  });
  place(f, rect(3, h, stripeColor, { name: 'priority stripe' }), 0, 0);

  // верхняя строка: чип приоритета + статусная метка
  const chipColors = task.prio === 'high'
    ? [C.dangerSoft, C.danger]
    : task.prio === 'medium' ? [C.warnSoft, C.warn] : [C.chipLowBg, C.textMuted];
  place(f, chip(task.prio === 'high' ? 'Высокий' : task.prio === 'medium' ? 'Средний' : 'Низкий', C, chipColors[0], chipColors[1]), 15, 12);
  if (task.overdue) {
    place(f, txt('Просрочено', { size: 10.5, weight: 700, color: C.danger, upper: true, ls: 0.4 }), CARD_W - 105, 14);
  } else if (task.done) {
    place(f, txt('Готово', { size: 10.5, weight: 700, color: C.accent, upper: true, ls: 0.4 }), CARD_W - 72, 14);
  }

  place(f, txt(task.title, { size: 13.5, weight: 700, lh: 18 }), 15, 34);
  if (hasDesc) {
    const d = txt(task.desc, { size: 12, color: C.textMuted, lh: 17, name: 'desc' });
    place(f, d, 15, 55);
    safe(() => { d.textAutoResize = 'HEIGHT'; setW(d, CARD_W - 30); });
  }

  // мета: дедлайн + теги
  const metaY = h - 26;
  let mx = 15;
  if (task.deadline) {
    const dl = txt(task.deadline, {
      size: 11.5, weight: 600, color: task.overdue ? C.danger : C.textMuted,
    });
    place(f, dl, mx, metaY);
    mx += task.deadline.length * 6.6 + 12;
  }
  for (const tag of (task.tags || [])) {
    const chipNode = chip('#' + tag, C, C.accentSoft, C.accentStrong, { size: 11, pad: [1, 8, 1, 8], upper: false });
    place(f, chipNode, mx, metaY - 1);
    mx += tag.length * 7 + 26;
  }
  return f;
}

/** Колонка канбана. */
function column(C, status, count, tasks, opts) {
  const o = opts || {};
  const titles = { todo: 'To Do', progress: 'In Progress', done: 'Done' };
  const dotColor = status === 'todo' ? STATUS_TODO : (status === 'progress' ? C.warn : C.accent);

  const col = box('Column / ' + titles[status], {
    layout: 'VERTICAL', w: COL_W, h: COL_H,
    fill: C.panelAlt, radius: 12, stroke: C.border, clip: true,
  });

  // шапка колонки (absolute внутри)
  const head = box('head', { h: 42, fill: null, clip: true });
  put(col, head, { stretch: true });
  place(head, ellipse(9, 9, dotColor, { name: 'dot' }), 14, 12);
  place(head, txt(titles[status], { size: 13, weight: 700, upper: true, ls: 0.3 }), 30, 14);
  place(head, chip(String(count), C, null, C.textMuted, { size: 12, pad: [1, 7, 1, 7], stroke: C.borderStrong }), COL_W - 42, 12);
  place(head, rect(COL_W, 1, C.border, { name: 'divider' }), 0, 41);

  // список карточек (вертикальный auto-layout)
  const list = box('list', { layout: 'VERTICAL', gap: 10, pad: [10, 10, 10, 10], fill: null });
  put(col, list, { stretch: true, grow: true });

  for (const task of tasks) {
    put(list, taskCard(C, task), { stretch: true });
  }
  if (!tasks.length) {
    const empty = box('empty state', { h: 64, fill: null, radius: 10, stroke: C.borderStrong, dash: [6, 4], clip: true });
    place(empty, txt('Перетащите задачу сюда', { size: 12.5, color: C.textMuted, center: true }), 0, 25);
    safe(() => { empty.children[0].resize(COL_W - 20, 16); });
    put(list, empty, { stretch: true });
  }
  if (o.dim) safe(() => { col.opacity = 0.55; });
  return col;
}

/** Сборка доски (title bar + тулбар + 3 колонки). */
function boardScreen(C, name, opts) {
  const o = opts || {};
  const f = box(name, { w: SCREEN_W, h: SCREEN_H, fill: C.bg, clip: true, name });
  place(f, titleBar(C, SCREEN_W, { dim: o.dim }), 0, 0);

  const inner = box('board page', { w: SCREEN_W - PAGE_PAD * 2, h: SCREEN_H - 40, fill: null });
  place(f, inner, PAGE_PAD, 40);
  place(inner, toolbar(C, SCREEN_W - PAGE_PAD * 2), 0, 0);

  const board = box('Board', { w: SCREEN_W - PAGE_PAD * 2, fill: null });
  place(inner, board, 0, 100);
  const tasks = o.tasks || TASKS;
  place(board, column(C, 'todo', tasks.todo.length, tasks.todo, { dim: o.dim }), 0, 0);
  place(board, column(C, 'progress', tasks.progress.length, tasks.progress, { dim: o.dim }), COL_W + COL_GAP, 0);
  place(board, column(C, 'done', tasks.done.length, tasks.done, { dim: o.dim }), (COL_W + COL_GAP) * 2, 0);
  return f;
}

// ------------------------------------------------------------
// Экран 3: модалка «Новая задача» (light)
// ------------------------------------------------------------
function createTaskModalScreen() {
  const C = LIGHT;
  // задний план: доска в светлой теме без карточек (затемнённая)
  const f = boardScreen(LIGHT, 'Modal / Новая задача (light)', {
    dim: true, tasks: { todo: [], progress: [], done: [] },
  });

  // затемнение
  place(f, rect(SCREEN_W, SCREEN_H, C.overlay, { name: 'overlay' }), 0, 0);

  // модальное окно
  const modal = box('Modal / Новая задача', {
    layout: 'VERTICAL', w: MODAL_W, fill: C.panel, radius: 16,
    stroke: C.border, shadowLg: C.shadowLg, clip: true,
  });
  place(f, modal, (SCREEN_W - MODAL_W) / 2, 96);

  // шапка
  const head = box('head', { h: 50, fill: null, clip: true });
  put(modal, head, { stretch: true });
  place(head, txt('Новая задача', { size: 15, weight: 700 }), 18, 16);
  const closeBtn = box('close', { w: 30, h: 30, fill: null, radius: 8 });
  place(closeBtn, closeIcon(C), 9, 9);
  place(head, closeBtn, MODAL_W - 44, 10);
  place(head, rect(MODAL_W, 1, C.border, { name: 'divider' }), 0, 49);

  // тело — форма
  const body = box('body / form', { layout: 'VERTICAL', gap: 14, pad: [16, 18, 16, 18], fill: null });
  put(modal, body, { stretch: true });

  // поле «Название» (с ошибкой валидации)
  const f1 = box('field / Название', { layout: 'VERTICAL', gap: 5, fill: null });
  put(body, f1, { stretch: true });
  put(f1, txt('Название', { size: 12, weight: 700, color: C.textMuted, upper: true, ls: 0.4 }), { stretch: true });
  put(f1, inputBox(MODAL_W - 36, 38, '', C, { name: 'title', muted: true, error: true }), { stretch: true });
  put(f1, txt('Укажите название задачи', { size: 12, weight: 600, color: C.danger }), { stretch: true });

  // поле «Описание»
  const f2 = box('field / Описание', { layout: 'VERTICAL', gap: 5, fill: null });
  put(body, f2, { stretch: true });
  put(f2, txt('Описание', { size: 12, weight: 700, color: C.textMuted, upper: true, ls: 0.4 }), { stretch: true });
  put(f2, inputBox(MODAL_W - 36, 70, 'Сводка по закрытым задачам, метрики скорости…', C, { name: 'desc', muted: true }), { stretch: true });

  // строка: приоритет + дедлайн
  const row = box('row', { layout: 'HORIZONTAL', gap: 12, fill: null });
  put(body, row, { stretch: true });

  const f3 = box('field / Приоритет', { layout: 'VERTICAL', gap: 5, fill: null });
  put(row, f3, { grow: true, stretch: true });
  put(f3, txt('Приоритет', { size: 12, weight: 700, color: C.textMuted, upper: true, ls: 0.4 }), { stretch: true });
  const seg = box('segmented / priority', {
    layout: 'HORIZONTAL', gap: 4, pad: [4, 4, 4, 4], fill: C.panelAlt, radius: 10, stroke: C.border,
  });
  put(f3, seg, { stretch: false });
  const segItem = (label, fg, active) => {
    const it = box('opt / ' + label, {
      layout: 'HORIZONTAL', pad: [6, 12, 6, 12], radius: 7,
      fill: active ? C.panel : null, shadow: active ? C.shadow : undefined, center2: true,
    });
    put(it, txt(label, { size: 12.5, weight: 600, color: active ? fg : C.textMuted }));
    return it;
  };
  put(seg, segItem('Низкий', '#475569', false));
  put(seg, segItem('Средний', C.warn, true));
  put(seg, segItem('Высокий', C.danger, false));

  const f4 = box('field / Дедлайн', { layout: 'VERTICAL', gap: 5, fill: null });
  put(row, f4, { grow: true, stretch: true });
  put(f4, txt('Дедлайн', { size: 12, weight: 700, color: C.textMuted, upper: true, ls: 0.4 }), { stretch: true });
  put(f4, inputBox(240, 38, '2026-12-12 14:00', C, { name: 'deadline' }), { stretch: true });

  // теги
  const f5 = box('field / Теги', { layout: 'VERTICAL', gap: 5, fill: null });
  put(body, f5, { stretch: true });
  put(f5, txt('Теги (до 10)', { size: 12, weight: 700, color: C.textMuted, upper: true, ls: 0.4 }), { stretch: true });
  const tags = box('tags editor', {
    layout: 'HORIZONTAL', gap: 6, pad: [8, 8, 8, 8], fill: C.panel, radius: 9,
    stroke: C.borderStrong, wrap: true,
  });
  put(f5, tags, { stretch: true });
  put(tags, chip('#работа ×', C, C.accentSoft, C.accentStrong, { size: 12, pad: [3, 10, 3, 10], upper: false }));
  put(tags, chip('#дизайн ×', C, C.accentSoft, C.accentStrong, { size: 12, pad: [3, 10, 3, 10], upper: false }));
  put(tags, txt('Добавить тег…', { size: 12.5, color: C.textMuted }));

  // футер (auto-layout: элементы выравниваются вправо)
  const foot = box('foot', {
    layout: 'HORIZONTAL', gap: 10, pad: [14, 18, 16, 18], fill: null, end: true,
  });
  put(modal, foot, { stretch: true });
  put(foot, button('Отмена', C, 'secondary'));
  put(foot, button('Создать задачу', C, 'primary'));
  return f;
}

// ------------------------------------------------------------
// Экран 4: модалка «Детали задачи» (dark)
// ------------------------------------------------------------
function detailModalScreen() {
  const C = DARK;
  // задний план: доска в тёмной теме без карточек (затемнённая)
  const f = boardScreen(C, 'Modal / Детали задачи (dark)', {
    dim: true, tasks: { todo: [], progress: [], done: [] },
  });
  place(f, rect(SCREEN_W, SCREEN_H, C.overlay, { name: 'overlay' }), 0, 0);

  const modal = box('Modal / Детали задачи', {
    layout: 'VERTICAL', w: MODAL_W, fill: C.panel, radius: 16,
    stroke: C.border, shadowLg: C.shadowLg, clip: true,
  });
  place(f, modal, (SCREEN_W - MODAL_W) / 2, 120);

  const head = box('head', { h: 50, fill: null, clip: true });
  put(modal, head, { stretch: true });
  place(head, txt('Детали задачи', { size: 15, weight: 700 }), 18, 16);
  const closeBtn = box('close', { w: 30, h: 30, fill: null, radius: 8 });
  place(closeBtn, closeIcon(C), 9, 9);
  place(head, closeBtn, MODAL_W - 44, 10);
  place(head, rect(MODAL_W, 1, C.border, { name: 'divider' }), 0, 49);

  const body = box('body', { layout: 'VERTICAL', gap: 14, pad: [16, 18, 16, 18], fill: null });
  put(modal, body, { stretch: true });
  put(body, txt('Собрать отчёт по спринту', { size: 17, weight: 700, lh: 22 }), { stretch: true });

  // строка «Статус» с чипами-кнопками
  const rowStatus = box('row / Статус', { layout: 'HORIZONTAL', gap: 10, center2: true, fill: null });
  put(body, rowStatus, { stretch: true });
  place(rowStatus, txt('СТАТУС', { size: 12, weight: 700, color: C.textMuted, ls: 0.4 }), 0, 2);
  const stBtn = (label, active) => {
    const b = box('st / ' + label, {
      layout: 'HORIZONTAL', pad: [5, 12, 5, 12], radius: 9, center2: true,
      fill: active ? C.accentSoft : C.panel, stroke: active ? C.accent : C.borderStrong,
    });
    put(b, txt(label, { size: 12.5, weight: 600, color: active ? C.accentStrong : C.textMuted }));
    return b;
  };
  put(rowStatus, stBtn('To Do', false));
  put(rowStatus, stBtn('In Progress', true));
  put(rowStatus, stBtn('Done', false));

  // строка «Приоритет»
  const rowPrio = box('row / Приоритет', { layout: 'HORIZONTAL', gap: 10, center2: true, fill: null });
  put(body, rowPrio, { stretch: true });
  place(rowPrio, txt('ПРИОРИТЕТ', { size: 12, weight: 700, color: C.textMuted, ls: 0.4 }), 0, 2);
  put(rowPrio, chip('Средний', C, C.warnSoft, C.warn));

  // строка «Дедлайн»
  const rowDl = box('row / Дедлайн', { layout: 'HORIZONTAL', gap: 10, center2: true, fill: null });
  put(body, rowDl, { stretch: true });
  place(rowDl, txt('ДЕДЛАЙН', { size: 12, weight: 700, color: C.textMuted, ls: 0.4 }), 0, 2);
  place(rowDl, txt('10 дек, 12:00', { size: 13, weight: 600, color: C.danger }), 82, 1);

  // строка «Теги»
  const rowTags = box('row / Теги', { layout: 'HORIZONTAL', gap: 10, center2: true, fill: null });
  put(body, rowTags, { stretch: true });
  place(rowTags, txt('ТЕГИ', { size: 12, weight: 700, color: C.textMuted, ls: 0.4 }), 0, 2);
  put(rowTags, chip('#дизайн', C, C.accentSoft, C.accentStrong, { size: 11, pad: [2, 10, 2, 10], upper: false }));
  put(rowTags, chip('#ui', C, C.accentSoft, C.accentStrong, { size: 11, pad: [2, 10, 2, 10], upper: false }));

  // описание
  const desc = box('desc', { layout: 'VERTICAL', pad: [12, 14, 12, 14], fill: C.panelAlt, radius: 10, stroke: C.border });
  put(body, desc, { stretch: true });
  const descText = txt('Сводка по закрытым задачам, метрики скорости команды и план на следующий спринт. Приложить график velocity.', { size: 13, lh: 19, color: C.text });
  put(desc, descText, { stretch: true });
  safe(() => { descText.textAutoResize = 'HEIGHT'; });

  // футер
  const foot = box('foot', { layout: 'HORIZONTAL', gap: 10, pad: [14, 18, 16, 18], fill: null, end: true });
  put(modal, foot, { stretch: true });
  put(foot, button('Удалить', C, 'danger'));
  put(foot, button('Редактировать', C, 'secondary'));
  return f;
}

// ------------------------------------------------------------
// Экран 5: настройки (dark)
// ------------------------------------------------------------
function settingsScreen() {
  const C = DARK;
  const f = box('Settings / Настройки (dark)', { w: SCREEN_W, h: SCREEN_H, fill: C.bg, clip: true });
  place(f, titleBar(C, SCREEN_W), 0, 0);

  const inner = box('settings page', { w: 720, h: SCREEN_H - 40, fill: null });
  place(f, inner, (SCREEN_W - 720) / 2, 40);

  // шапка: назад + заголовок
  const head = box('head', { h: 54, fill: null, clip: true });
  place(inner, head, 0, 16);
  const back = box('btn / back', { w: 28, h: 28, fill: C.panel, radius: 7, stroke: C.borderStrong, clip: true });
  const b1 = rect(8, 1.8, C.textMuted, { rotation: 45, name: 'chevron 1' });
  const b2 = rect(8, 1.8, C.textMuted, { rotation: -45, name: 'chevron 2' });
  place(back, b1, 8, 8);
  place(back, b2, 11.5, 8);
  place(head, back, 0, 0);
  place(head, txt('Настройки', { size: 18, weight: 700 }), 42, 3);

  let y = 86;
  const section = (title, build) => {
    const s = box('section / ' + title, {
      layout: 'VERTICAL', gap: 12, pad: [18, 18, 18, 18], fill: C.panel,
      radius: 12, stroke: C.border, shadow: C.shadow, clip: true,
    });
    place(inner, s, 0, y);
    put(s, txt(title, { size: 14, weight: 600 }), { stretch: true });
    build(s);
    y += s.height + 14;
    return s;
  };
  const row = (s, label, control) => {
    const r = box('row', { layout: 'HORIZONTAL', between: true, center2: true, fill: null });
    put(s, r, { stretch: true });
    put(r, txt(label, { size: 13.5 }));
    put(r, control);
    return r;
  };

  // Внешний вид
  section('Внешний вид', (s) => {
    const seg = box('segmented / theme', {
      layout: 'HORIZONTAL', gap: 4, pad: [4, 4, 4, 4], fill: C.panelAlt, radius: 10, stroke: C.border,
    });
    const opt = (label, active) => {
      const it = box('opt / ' + label, {
        layout: 'HORIZONTAL', pad: [6, 14, 6, 14], radius: 7,
        fill: active ? C.panel : null, shadow: active ? C.shadow : undefined, center2: true,
      });
      put(it, txt(label, { size: 12.5, weight: 600, color: active ? C.text : C.textMuted }));
      return it;
    };
    put(seg, opt('Светлая', false));
    put(seg, opt('Тёмная', true));
    put(seg, opt('Системная', false));
    row(s, 'Тема оформления', seg);
    put(s, txt('Системная тема следует за настройками ОС. Изменение применяется сразу и сохраняется в базе.', { size: 12.5, color: C.textMuted, lh: 19 }), { stretch: true });
  });

  // Уведомления
  section('Уведомления о дедлайнах', (s) => {
    row(s, 'Показывать системные уведомления', switchToggle(C, true));
    row(s, 'Напоминать заранее', selectBox(140, 'За 6 часов', C));
    put(s, txt('Один раз на задачу: за N часов до дедлайна и в момент просрочки. Клик по уведомлению открывает окно приложения.', { size: 12.5, color: C.textMuted, lh: 19 }), { stretch: true });
  });

  // Горячие клавиши
  section('Горячие клавиши', (s) => {
    const hk = (label, keys) => {
      const r = box('hk / ' + label, { layout: 'HORIZONTAL', gap: 10, center2: true, fill: null });
      put(s, r, { stretch: true });
      put(r, txt(label, { size: 13, color: C.textMuted }));
      const ks = box('keys', { layout: 'HORIZONTAL', gap: 4, fill: null });
      put(r, ks);
      put(ks, kbd(keys, C));
      return r;
    };
    hk('Новая задача', 'Ctrl + N');
    hk('Поиск по доске', 'Ctrl + F');
    hk('Открыть настройки', 'Ctrl + ,');
    hk('Закрыть окно / отменить', 'Esc');
  });

  // Данные
  section('Данные', (s) => {
    row(s, 'Задачи и настройки хранятся локально (SQLite)', button('Экспорт в JSON', C, 'secondary'));
  });
  return f;
}

// ------------------------------------------------------------
// Экран 6: онбординг (light)
// ------------------------------------------------------------
function onboardingScreen() {
  const C = LIGHT;
  const f = box('Onboarding / Первый запуск (light)', { w: SCREEN_W, h: SCREEN_H, fill: C.bg, clip: true });
  place(f, titleBar(C, SCREEN_W, { dim: true }), 0, 0);
  place(f, rect(SCREEN_W, SCREEN_H, C.overlay, { name: 'overlay' }), 0, 0);

  const W = 520;
  const modal = box('Modal / Онбординг', {
    layout: 'VERTICAL', gap: 18, pad: [22, 22, 22, 22], w: W, fill: C.panel,
    radius: 16, stroke: C.border, shadowLg: C.shadowLg, clip: true,
  });
  place(f, modal, (SCREEN_W - W) / 2, 120);

  put(modal, txt('Добро пожаловать в Task Manager', { size: 18, weight: 700 }), { stretch: true });
  put(modal, txt('Канбан-доска с drag-and-drop, дедлайнами, тегами и системными уведомлениями. Все данные остаются на вашем компьютере.', { size: 13.5, color: C.textMuted, lh: 20 }), { stretch: true });

  // выбор темы: 3 карточки
  put(modal, txt('Тема', { size: 12, weight: 700, color: C.textMuted, upper: true, ls: 0.4 }), { stretch: true });
  const cards = box('theme cards', { layout: 'HORIZONTAL', gap: 10, fill: null });
  put(modal, cards, { stretch: true });

  const themeCard = (label, active, preview) => {
    const card = box('theme / ' + label, {
      layout: 'VERTICAL', gap: 8, pad: [12, 10, 12, 10], w: 148,
      fill: C.panelAlt, radius: 12, clip: true,
      stroke: active ? C.accent : C.borderStrong,
      strokeWeight: 2,
    });
    if (active) setShadow(card, C.accentSoft);
    put(card, preview, { stretch: true });
    const labelRow = box('label', { layout: 'HORIZONTAL', gap: 6, center2: true, fill: null });
    put(card, labelRow, { stretch: true });
    put(labelRow, txt(label, { size: 12.5, weight: 600 }));
    if (active) put(labelRow, checkIcon(C.accent));
    return card;
  };
  const previewLight = box('preview', { h: 48, fill: '#ffffff', radius: 8, stroke: C.border, clip: true });
  place(previewLight, rect(8, 6, C.accent, { radius: 2, name: 'bar' }), 8, 8);
  place(previewLight, rect(30, 4, C.bgDeep, { radius: 2, name: 'bar' }), 8, 20);
  place(previewLight, rect(48, 4, C.bgDeep, { radius: 2, name: 'bar' }), 8, 30);
  const previewDark = box('preview', { h: 48, fill: '#0f172a', radius: 8, clip: true });
  place(previewDark, rect(8, 6, '#10b981', { radius: 2, name: 'bar' }), 8, 8);
  place(previewDark, rect(30, 4, '#334155', { radius: 2, name: 'bar' }), 8, 20);
  place(previewDark, rect(48, 4, '#334155', { radius: 2, name: 'bar' }), 8, 30);
  const previewSys = box('preview', { h: 48, fill: null, radius: 8, clip: true });
  place(previewSys, rect(64, 48, '#ffffff', { name: 'half light' }), 0, 0);
  place(previewSys, rect(64, 48, '#0f172a', { name: 'half dark' }), 64, 0);

  put(cards, themeCard('Светлая', false, previewLight));
  put(cards, themeCard('Тёмная', false, previewDark));
  put(cards, themeCard('Системная', true, previewSys));

  // горячие клавиши
  put(modal, txt('Горячие клавиши', { size: 12, weight: 700, color: C.textMuted, upper: true, ls: 0.4 }), { stretch: true });
  const hkList = box('hotkeys', { layout: 'VERTICAL', gap: 7, fill: null });
  put(modal, hkList, { stretch: true });
  const hk = (keys, label) => {
    const r = box('hk', { layout: 'HORIZONTAL', gap: 10, center2: true, fill: null });
    put(hkList, r, { stretch: true });
    put(r, kbd(keys, C));
    put(r, txt(label, { size: 13, color: C.textMuted }));
  };
  hk('Ctrl + N', 'создать задачу');
  hk('Ctrl + F', 'поиск по доске');
  hk('Ctrl + ,', 'настройки');

  // кнопка старта на всю ширину
  const start = button('Начать работу', C, 'primary', { lg: true });
  put(modal, start, { stretch: true });
  safe(() => { start.counterAxisAlignItems = 'CENTER'; start.primaryAxisAlignItems = 'CENTER'; });
  return f;
}

// ------------------------------------------------------------
// Экран 7: UI-кит (light)
// ------------------------------------------------------------
function uiKitScreen() {
  const C = LIGHT;
  const W = 1180;
  const H = 820;
  const f = box('UI Kit / Компоненты (light)', { w: W, h: H, fill: C.bg, clip: true });

  let y = 28;
  place(f, txt('UI-кит Task Manager', { size: 20, weight: 700 }), 32, y);
  y += 44;

  const groupTitle = (label) => {
    place(f, txt(label, { size: 12, weight: 700, color: C.textMuted, upper: true, ls: 0.5 }), 32, y);
    y += 28;
  };

  // Кнопки
  groupTitle('Кнопки');
  const rowBtns = box('buttons', { layout: 'HORIZONTAL', gap: 12, center2: true, fill: null });
  place(f, rowBtns, 32, y);
  put(rowBtns, button('Основная', C, 'primary'));
  put(rowBtns, button('Вторичная', C, 'secondary'));
  put(rowBtns, button('Пунктирная', C, 'ghost'));
  put(rowBtns, button('Опасная', C, 'danger'));
  put(rowBtns, button('Крупная основная', C, 'primary', { lg: true }));
  y += 64;

  // Чипы приоритетов + теги
  groupTitle('Чипы и теги');
  const rowChips = box('chips', { layout: 'HORIZONTAL', gap: 10, center2: true, fill: null });
  place(f, rowChips, 32, y);
  put(rowChips, chip('Низкий', C, C.chipLowBg, C.textMuted));
  put(rowChips, chip('Средний', C, C.warnSoft, C.warn));
  put(rowChips, chip('Высокий', C, C.dangerSoft, C.danger));
  put(rowChips, chip('#работа', C, C.accentSoft, C.accentStrong, { size: 11, pad: [3, 10, 3, 10], upper: false }));
  put(rowChips, chip('3', C, null, C.textMuted, { size: 12, pad: [1, 7, 1, 7], stroke: C.borderStrong }));
  y += 52;

  // Переключатели и kbd
  groupTitle('Переключатели и горячие клавиши');
  const rowSwitch = box('switch + kbd', { layout: 'HORIZONTAL', gap: 24, center2: true, fill: null });
  place(f, rowSwitch, 32, y);
  put(rowSwitch, switchToggle(C, true));
  put(rowSwitch, switchToggle(C, false));
  put(rowSwitch, kbd('Ctrl + N', C));
  put(rowSwitch, kbd('Ctrl + F', C));
  put(rowSwitch, kbd('Ctrl + ,', C));
  put(rowSwitch, kbd('Esc', C));
  y += 60;

  // Тосты
  groupTitle('Тосты');
  const rowToasts = box('toasts', { layout: 'HORIZONTAL', gap: 12, center2: true, fill: null });
  place(f, rowToasts, 32, y);
  const toast = (label, bg, fg) => {
    const t = box('toast / ' + label, {
      layout: 'HORIZONTAL', pad: [10, 16, 10, 16], radius: 10, fill: bg, shadowLg: C.shadowLg, center2: true,
    });
    put(t, txt(label, { size: 13, weight: 600, color: fg }));
    return t;
  };
  put(rowToasts, toast('Задача создана', C.accentStrong, '#ffffff'));
  put(rowToasts, toast('Не удалось сохранить', C.danger, '#ffffff'));
  put(rowToasts, toast('Экспорт готов', '#334155', '#ffffff'));
  y += 64;

  // Карточка задачи с цветными полосами приоритета
  groupTitle('Карточка задачи (полоса приоритета)');
  const rowCards = box('cards', { layout: 'HORIZONTAL', gap: 14, fill: null });
  place(f, rowCards, 32, y);
  put(rowCards, taskCard(C, { title: 'Низкий приоритет', prio: 'low', compact: true, deadline: '15 дек, 18:00', tags: [] }));
  put(rowCards, taskCard(C, { title: 'Средний приоритет', prio: 'medium', compact: true, deadline: '12 дек, 14:00', tags: [] }));
  put(rowCards, taskCard(C, { title: 'Высокий приоритет', prio: 'high', compact: true, deadline: '10 дек, 12:00', overdue: true, tags: [] }));
  y += 104;

  // Шапка колонки + статусы
  groupTitle('Статусы колонок');
  const rowStatus = box('status', { layout: 'HORIZONTAL', gap: 24, center2: true, fill: null });
  place(f, rowStatus, 32, y);
  const statusSample = (label, color) => {
    const r = box('st / ' + label, { layout: 'HORIZONTAL', gap: 8, center2: true, fill: null });
    put(rowStatus, r);
    put(r, ellipse(9, 9, color, { name: 'dot' }));
    put(r, txt(label, { size: 13, weight: 700, upper: true, ls: 0.3 }));
    return r;
  };
  statusSample('To Do', STATUS_TODO);
  statusSample('In Progress', C.warn);
  statusSample('Done', C.accent);
  y += 52;

  // Поля ввода
  groupTitle('Поля ввода');
  place(f, inputBox(360, 38, 'Обычное поле', C, { name: 'default' }), 32, y);
  place(f, inputBox(360, 38, '', C, { name: 'error', muted: true, error: true }), 408, y);
  place(f, selectBox(160, 'Статус: все', C), 784, y);
  place(f, txt('Поле с ошибкой: «Укажите название задачи»', { size: 12, weight: 600, color: C.danger }), 408, y + 46);

  return f;
}

// ------------------------------------------------------------
// Демо-данные (как в браузерном seed-режиме приложения)
// ------------------------------------------------------------
const TASKS = {
  todo: [
    {
      title: 'Собрать отчёт по спринту',
      desc: 'Сводка по закрытым задачам, метрики скорости, план на следующий спринт.',
      prio: 'medium', deadline: '12 дек, 14:00', tags: ['работа'],
    },
    {
      title: 'Обновить зависимости',
      desc: 'Поднять версии React и Electron, прогнать тесты.',
      prio: 'low', deadline: '15 дек, 18:00', tags: ['техдолг'],
    },
  ],
  progress: [
    {
      title: 'Дизайн окна настроек',
      desc: 'Секции тем, уведомлений и горячих клавиш.',
      prio: 'high', deadline: '10 дек, 12:00', overdue: true, tags: ['дизайн', 'ui'],
    },
  ],
  done: [
    {
      title: 'Настроить CI с упаковкой',
      desc: null,
      prio: 'medium', deadline: null, done: true, tags: ['ci'],
    },
  ],
};

// ------------------------------------------------------------
// Точка входа
// ------------------------------------------------------------
(async function main() {
  F = await loadFonts();
  if (!F) {
    figma.notify('Не удалось загрузить шрифты Inter/Roboto — проверьте доступ к Google Fonts в Figma');
    figma.closePlugin();
    return;
  }

  // новая страница под кит
  let page;
  safe(() => {
    page = figma.createPage();
    page.name = 'Task Manager — UI Kit';
    figma.currentPage = page;
  });
  if (!page) page = figma.currentPage;

  const frames = [];
  const builders = [
    ['Board / Light — канбан', () => boardScreen(LIGHT, 'Board / Light — канбан', {})],
    ['Board / Dark — канбан', () => boardScreen(DARK, 'Board / Dark — канбан', {})],
    ['Modal / Новая задача (light)', createTaskModalScreen],
    ['Modal / Детали задачи (dark)', detailModalScreen],
    ['Settings / Настройки (dark)', settingsScreen],
    ['Onboarding / Первый запуск (light)', onboardingScreen],
    ['UI Kit / Компоненты (light)', uiKitScreen],
  ];

  let x = 0;
  const errors = [];
  for (const [label, build] of builders) {
    try {
      const frame = build();
      place(page, frame, x, 0);
      frames.push(frame);
      x += frame.width + SCREEN_GAP;
    } catch (e) {
      errors.push(label + ': ' + (e && e.message ? e.message : String(e)));
    }
  }

  if (frames.length) {
    safe(() => { figma.viewport.scrollAndZoomIntoView(frames); });
    safe(() => { page.selection = frames.slice(0, 1); });
  }
  if (errors.length) {
    figma.notify('Готово: ' + frames.length + '/7 экранов. Ошибки: ' + errors.join('; ').slice(0, 180), { timeout: 8000 });
  } else {
    figma.notify('Готово: 7 экранов Task Manager на странице «Task Manager — UI Kit»', { timeout: 5000 });
  }
  figma.closePlugin();
})().catch(function (e) {
  figma.notify('Плагин упал: ' + (e && e.message ? e.message : String(e)));
  figma.closePlugin();
});
