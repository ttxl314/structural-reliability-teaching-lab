/* ============================================================================
 * charts.js — Canvas 2D drawing utilities (no third-party libraries)
 * Plot handles coordinate mapping, grid, axes, curves, scatter points, annotations and legends.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const RL = (global.RL = global.RL || {});
  const M = RL.Math;

  const C = {
    blue: '#1f77b4', blue2: '#3b9ada', orange: '#ff7f0e', red: '#d62728',
    purple: '#9467bd', green: '#2ca02c', gray: '#7f7f7f', dark: '#101828',
    muted: '#667085', axis: '#98a2b3', grid: '#e9edf2', grid2: '#f2f4f7',
    ink: '#1f2937', white: '#ffffff', failure: 'rgba(214,39,40,0.075)',
    safe: 'rgba(31,119,180,0.045)', band: 'rgba(31,119,180,0.13)',
    // Shared method palette: page cards, comparison bars, error bars, table color dots and legends all use this one set.
    method: {
      mvfosm: '#ff7f0e',
      afosm: '#1f77b4',
      form: '#d62728',
      sorm: '#2ca02c',
      mc: '#9467bd',
      exact: '#7f7f7f',
    },
  };

  const FONT = '"Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", sans-serif';
  const SERIF = 'Georgia, "Times New Roman", serif';
  let fontScale = 1;
  function setFontScale(s) { fontScale = s || 1; }
  function getFontScale() { return fontScale; }

  function niceStep(range, target) {
    if (!isFinite(range) || range <= 0) return 1;
    const raw = range / Math.max(1, target);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    let step;
    if (norm <= 1) step = 1;
    else if (norm <= 2) step = 2;
    else if (norm <= 5) step = 5;
    else step = 10;
    return step * mag;
  }

  function ticks(min, max, target) {
    const step = niceStep(max - min, target || 6);
    const start = Math.ceil(min / step) * step;
    const out = [];
    for (let v = start; v <= max + step * 1e-6; v += step) {
      out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    }
    return out;
  }

  function fmtNum(v) {
    if (!isFinite(v)) return '';
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1000) return (v / 1000).toFixed(a >= 10000 ? 0 : 1) + 'k';
    if (a >= 10) return String(Math.round(v * 10) / 10);
    if (a >= 1) return String(Math.round(v * 100) / 100);
    if (a >= 0.01) return String(Math.round(v * 1000) / 1000);
    return v.toExponential(1);
  }

  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function sup(n) { return String(n).split('').map(c => SUP[c] || c).join(''); }

  class Plot {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({
        pad: { l: 54, r: 18, t: 18, b: 42 },
        xlim: [0, 1], ylim: [0, 1],
        equal: false, ylog: false, xlog: false,
        background: '#ffffff',
        xlabel: '', ylabel: '',
      }, opts || {});
      this.pad = this.opts.pad;
      this.xlim = this.opts.xlim.slice();
      this.ylim = this.opts.ylim.slice();
      this.w = 0; this.h = 0; this.dpr = 1;
      this.view = null;
      this.redraw = () => {};
      if (typeof ResizeObserver !== 'undefined') {
        this._ro = new ResizeObserver(() => this.resize());
        this._ro.observe(canvas);
      }
      this.resize();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(20, rect.width);
      const h = Math.max(20, rect.height);
      const dpr = Math.max(1, Math.min(3, global.devicePixelRatio || 1));
      if (w === this.w && h === this.h && dpr === this.dpr) return;
      this.w = w; this.h = h; this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.view = null;
      this.redraw();
    }

    setRange(xlim, ylim) {
      if (xlim) this.xlim = xlim.slice();
      if (ylim) this.ylim = ylim.slice();
      this.view = null;
    }

    rect() {
      return {
        x: this.pad.l, y: this.pad.t,
        w: Math.max(10, this.w - this.pad.l - this.pad.r),
        h: Math.max(10, this.h - this.pad.t - this.pad.b),
      };
    }

    computeView() {
      const r = this.rect();
      let [x0, x1] = this.xlim;
      let [y0, y1] = this.ylim;
      if (this.opts.ylog) {
        y0 = Math.log10(Math.max(1e-15, y0));
        y1 = Math.log10(Math.max(1e-15, y1));
      }
      if (this.opts.xlog) {
        x0 = Math.log10(Math.max(1e-15, x0));
        x1 = Math.log10(Math.max(1e-15, x1));
      }
      if (this.opts.equal) {
        const sx = (x1 - x0) / r.w;
        const sy = (y1 - y0) / r.h;
        if (sx > sy) {
          const mid = (y0 + y1) / 2, half = r.h * sx / 2;
          y0 = mid - half; y1 = mid + half;
        } else {
          const mid = (x0 + x1) / 2, half = r.w * sy / 2;
          x0 = mid - half; x1 = mid + half;
        }
      }
      this.view = { x0, x1, y0, y1, r };
      return this.view;
    }

    get v() { return this.view || this.computeView(); }

    sx(x) {
      const v = this.v;
      const t = this.opts.xlog ? Math.log10(Math.max(1e-15, x)) : x;
      return v.r.x + (t - v.x0) / (v.x1 - v.x0) * v.r.w;
    }
    sy(y) {
      const v = this.v;
      const t = this.opts.ylog ? Math.log10(Math.max(1e-15, y)) : y;
      return v.r.y + (v.y1 - t) / (v.y1 - v.y0) * v.r.h;
    }

    begin() {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.fillStyle = this.opts.background;
      ctx.fillRect(0, 0, this.w, this.h);
      const v = this.computeView();
      ctx.save();
      ctx.beginPath();
      ctx.rect(v.r.x, v.r.y, v.r.w, v.r.h);
      ctx.clip();
    }
    end() { this.ctx.restore(); }

    grid(opts) {
      opts = opts || {};
      const ctx = this.ctx, v = this.v, r = v.r;
      const xs = ticks(this.xlim[0], this.xlim[1], this.opts.xTickTarget || 6);
      const ys = this.opts.ylog ? this.logTicks() : ticks(this.ylim[0], this.ylim[1], this.opts.yTickTarget || 5);
      ctx.save();
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (const x of xs) {
        const X = Math.round(this.sx(x)) + 0.5;
        ctx.beginPath(); ctx.moveTo(X, r.y); ctx.lineTo(X, r.y + r.h); ctx.stroke();
      }
      for (const y of ys) {
        const Y = Math.round(this.sy(y)) + 0.5;
        ctx.beginPath(); ctx.moveTo(r.x, Y); ctx.lineTo(r.x + r.w, Y); ctx.stroke();
      }
      // Zero axes
      if (this.xlim[0] < 0 && this.xlim[1] > 0) {
        const X = Math.round(this.sx(0)) + 0.5;
        ctx.strokeStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(X, r.y); ctx.lineTo(X, r.y + r.h); ctx.stroke();
      }
      if (!this.opts.ylog && this.ylim[0] < 0 && this.ylim[1] > 0) {
        const Y = Math.round(this.sy(0)) + 0.5;
        ctx.strokeStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(r.x, Y); ctx.lineTo(r.x + r.w, Y); ctx.stroke();
      }
      ctx.restore();
    }

    logTicks() {
      const out = [];
      const a = Math.log10(Math.max(1e-15, this.ylim[0]));
      const b = Math.log10(Math.max(1e-15, this.ylim[1]));
      for (let e = Math.ceil(a); e <= Math.floor(b); e++) out.push(Math.pow(10, e));
      return out;
    }

    axes(opts) {
      opts = opts || {};
      const ctx = this.ctx, v = this.v, r = v.r;
      const color = opts.color || C.axis;
      ctx.save();
      ctx.strokeStyle = '#d0d5dd'; ctx.lineWidth = this.opts.axisBold ? 1.5 : 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      ctx.font = (this.opts.axisBold ? '600 ' : '') + (10.5 * fontScale) + 'px ' + FONT;
      ctx.fillStyle = C.muted;
      // x ticks
      const xs = ticks(this.xlim[0], this.xlim[1], this.opts.xTickTarget || 6);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (const x of xs) {
        const X = this.sx(x);
        if (X < r.x - 1 || X > r.x + r.w + 1) continue;
        ctx.strokeStyle = color; ctx.lineWidth = this.opts.axisBold ? 1.3 : 1; ctx.beginPath();
        ctx.moveTo(Math.round(X) + 0.5, r.y + r.h);
        ctx.lineTo(Math.round(X) + 0.5, r.y + r.h + 4); ctx.stroke();
        ctx.fillText(fmtNum(x), X, r.y + r.h + 6);
      }
      // y ticks
      const ys = this.opts.ylog ? this.logTicks() : ticks(this.ylim[0], this.ylim[1], this.opts.yTickTarget || 5);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const y of ys) {
        const Y = this.sy(y);
        if (Y < r.y - 1 || Y > r.y + r.h + 1) continue;
        ctx.strokeStyle = color; ctx.lineWidth = this.opts.axisBold ? 1.3 : 1; ctx.beginPath();
        ctx.moveTo(r.x - 4, Math.round(Y) + 0.5);
        ctx.lineTo(r.x, Math.round(Y) + 0.5); ctx.stroke();
        ctx.fillText(this.opts.ylog ? '10' + sup(Math.round(Math.log10(y))) : fmtNum(y), r.x - 7, Y);
      }
      // Bold zero axes (X/Y axes)
      if (this.opts.axisBold) {
        ctx.strokeStyle = '#667085'; ctx.lineWidth = 1.7;
        if (this.xlim[0] < 0 && this.xlim[1] > 0) {
          const X0 = Math.round(this.sx(0)) + 0.5;
          ctx.beginPath(); ctx.moveTo(X0, r.y); ctx.lineTo(X0, r.y + r.h); ctx.stroke();
        }
        if (this.ylim[0] < 0 && this.ylim[1] > 0) {
          const Y0 = Math.round(this.sy(0)) + 0.5;
          ctx.beginPath(); ctx.moveTo(r.x, Y0); ctx.lineTo(r.x + r.w, Y0); ctx.stroke();
        }
      }
      // labels
      if (this.opts.xlabel) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.font = (this.opts.axisBold ? '700 ' : '') + (11.5 * fontScale) + 'px ' + SERIF; ctx.fillStyle = C.ink;
        ctx.fillText(this.opts.xlabel, r.x + r.w / 2, this.h - 2);
      }
      if (this.opts.ylabel) {
        ctx.save();
        ctx.translate(12, r.y + r.h / 2); ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.font = (this.opts.axisBold ? '700 ' : '') + (11.5 * fontScale) + 'px ' + SERIF; ctx.fillStyle = C.ink;
        ctx.fillText(this.opts.ylabel, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    line(pts, style) {
      style = style || {};
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = style.color || C.blue;
      ctx.lineWidth = style.width == null ? 2 : style.width;
      ctx.setLineDash(style.dash || []);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.globalAlpha = style.alpha == null ? 1 : style.alpha;
      ctx.beginPath();
      let started = false;
      for (const p of pts) {
        if (!p || !isFinite(p[0]) || !isFinite(p[1])) { started = false; continue; }
        if (this.opts.ylog && p[1] <= 0) { started = false; continue; }
        const X = this.sx(p[0]), Y = this.sy(p[1]);
        if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.restore();
    }

    fillPolygon(pts, style) {
      style = style || {};
      const ctx = this.ctx;
      ctx.save();
      ctx.beginPath();
      let started = false;
      for (const p of pts) {
        if (!p || !isFinite(p[0]) || !isFinite(p[1])) continue;
        const X = this.sx(p[0]), Y = this.sy(p[1]);
        if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      }
      ctx.closePath();
      ctx.fillStyle = style.color || C.failure;
      ctx.globalAlpha = style.alpha == null ? 1 : style.alpha;
      ctx.fill();
      if (style.stroke) {
        ctx.globalAlpha = 1; ctx.strokeStyle = style.stroke;
        ctx.lineWidth = style.width || 1; ctx.stroke();
      }
      ctx.restore();
    }

    circle(cx, cy, rad, style) {
      style = style || {};
      const ctx = this.ctx;
      const X = this.sx(cx), Y = this.sy(cy);
      const RX = Math.abs(this.sx(cx + rad) - X);
      const RY = Math.abs(this.sy(cy + rad) - Y);
      ctx.save();
      ctx.strokeStyle = style.color || C.blue;
      ctx.lineWidth = style.width == null ? 1.3 : style.width;
      ctx.setLineDash(style.dash || []);
      ctx.globalAlpha = style.alpha == null ? 1 : style.alpha;
      if (style.fill) {
        ctx.fillStyle = style.fill;
        ctx.beginPath(); ctx.ellipse(X, Y, RX, RY, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.ellipse(X, Y, RX, RY, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    dots(xs, ys, style) {
      style = style || {};
      const ctx = this.ctx;
      const color = style.color || C.blue;
      const size = style.size == null ? 2 : style.size;
      const alpha = style.alpha == null ? 0.5 : style.alpha;
      const r = this.view.r;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      const step = style.step || 1;
      if (size <= 1.8) {
        for (let i = 0; i < xs.length; i += step) {
          const X = this.sx(xs[i]), Y = this.sy(ys[i]);
          if (X < r.x || X > r.x + r.w || Y < r.y || Y > r.y + r.h) continue;
          ctx.fillRect(X, Y, size, size);
        }
      } else {
        for (let i = 0; i < xs.length; i += step) {
          const X = this.sx(xs[i]), Y = this.sy(ys[i]);
          if (X < r.x || X > r.x + r.w || Y < r.y || Y > r.y + r.h) continue;
          ctx.beginPath(); ctx.arc(X, Y, size, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    scatter(pts, style) {
      style = style || {};
      const ctx = this.ctx;
      const size = style.size == null ? 5 : style.size;
      ctx.save();
      ctx.fillStyle = style.color || C.blue;
      ctx.strokeStyle = style.stroke || '#ffffff';
      ctx.lineWidth = style.lineWidth == null ? 1.2 : style.lineWidth;
      ctx.globalAlpha = style.alpha == null ? 1 : style.alpha;
      for (const p of pts) {
        const X = this.sx(p[0]), Y = this.sy(p[1]);
        ctx.beginPath(); ctx.arc(X, Y, size, 0, Math.PI * 2);
        if (style.stroke) ctx.stroke();
        ctx.fill();
      }
      ctx.restore();
    }

    star(x, y, size, color, stroke) {
      const ctx = this.ctx;
      const X = this.sx(x), Y = this.sy(y);
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rr = i % 2 === 0 ? size : size * 0.42;
        const px = X + rr * Math.cos(a), py = Y + rr * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = color || C.red;
      ctx.fill();
      if (stroke !== false) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke(); }
      ctx.restore();
    }

    square(x, y, size, color) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = color || C.blue;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.rect(this.sx(x) - size, this.sy(y) - size, size * 2, size * 2);
      ctx.fill(); ctx.stroke(); ctx.restore();
    }

    diamond(x, y, size, color) {
      const ctx = this.ctx;
      const X = this.sx(x), Y = this.sy(y);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(X, Y - size); ctx.lineTo(X + size, Y); ctx.lineTo(X, Y + size); ctx.lineTo(X - size, Y);
      ctx.closePath(); ctx.fillStyle = color || C.purple; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
    }

    cross(x, y, size, color) {
      const ctx = this.ctx;
      const X = this.sx(x), Y = this.sy(y);
      ctx.save(); ctx.strokeStyle = color || C.red; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X - size, Y - size); ctx.lineTo(X + size, Y + size);
      ctx.moveTo(X + size, Y - size); ctx.lineTo(X - size, Y + size); ctx.stroke(); ctx.restore();
    }

    arrow(x1, y1, x2, y2, style) {
      style = style || {};
      const ctx = this.ctx;
      const X1 = this.sx(x1), Y1 = this.sy(y1), X2 = this.sx(x2), Y2 = this.sy(y2);
      const ang = Math.atan2(Y2 - Y1, X2 - X1);
      const head = style.head || 7;
      ctx.save();
      ctx.strokeStyle = style.color || C.muted;
      ctx.fillStyle = style.color || C.muted;
      ctx.lineWidth = style.width || 1.3;
      ctx.setLineDash(style.dash || []);
      ctx.beginPath(); ctx.moveTo(X1, Y1); ctx.lineTo(X2, Y2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(X2, Y2);
      ctx.lineTo(X2 - head * Math.cos(ang - 0.38), Y2 - head * Math.sin(ang - 0.38));
      ctx.lineTo(X2 - head * Math.cos(ang + 0.38), Y2 - head * Math.sin(ang + 0.38));
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    rightAxis(opts) {
      opts = opts || {};
      const r = this.rect(), ctx = this.ctx;
      const color = opts.color || C.green;
      const top = opts.top == null ? r.y : opts.top;
      ctx.save();
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(r.x + r.w + 0.5, r.y + r.h); ctx.lineTo(r.x + r.w + 0.5, top); ctx.stroke();
      ctx.font = (10.5 * fontScale) + 'px ' + FONT;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      for (const t of (opts.ticks || [])) {
        const y = opts.map(t);
        if (!isFinite(y) || y < top - 1 || y > r.y + r.h + 1) continue;
        ctx.beginPath(); ctx.moveTo(r.x + r.w, y); ctx.lineTo(r.x + r.w + 4, y); ctx.stroke();
        ctx.fillText(opts.format ? opts.format(t) : String(t), r.x + r.w + 6, y);
      }
      if (opts.label) {
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(opts.label, r.x + r.w + 6, top - 12);
      }
      ctx.restore();
    }

    text(x, y, str, style) {
      style = style || {};
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = style.color || C.ink;
      const fs = (style.size || 11.5) * fontScale;
      ctx.font = fs + 'px ' + (style.serif ? SERIF : FONT);
      ctx.textAlign = style.align || 'left';
      ctx.textBaseline = style.baseline || 'middle';
      if (style.italic) ctx.font = 'italic ' + fs + 'px ' + SERIF;
      ctx.fillText(str, this.sx(x) + (style.dx || 0), this.sy(y) + (style.dy || 0));
      ctx.restore();
    }

    tag(x, y, str, style) {
      style = style || {};
      const ctx = this.ctx;
      const X = this.sx(x) + (style.dx || 0);
      const Y = this.sy(y) + (style.dy || 0);
      ctx.save();
      const fs = (style.size || 11) * fontScale;
      ctx.font = fs + 'px ' + FONT;
      const lines = String(str).split('\n');
      let wmax = 0;
      for (const ln of lines) wmax = Math.max(wmax, ctx.measureText(ln).width);
      const pad = 5 * fontScale, lh = fs * 1.4;
      const bw = wmax + pad * 2, bh = lines.length * lh + pad * 1.3;
      let bx = X, by = Y;
      if (style.align === 'center') bx -= bw / 2;
      else if (style.align === 'right') bx -= bw;
      if (style.baseline === 'bottom') by -= bh;
      else if (style.baseline !== 'top') by -= bh / 2;
      ctx.fillStyle = style.bg || 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = style.border || '#d0d5dd';
      ctx.lineWidth = 1;
      this.roundRect(bx, by, bw, bh, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = style.color || C.ink;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      lines.forEach((ln, i) => ctx.fillText(ln, bx + pad, by + pad * 0.7 + i * lh));
      ctx.restore();
    }

    roundRect(x, y, w, h, r) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    legend(items, opts) {
      opts = opts || {};
      const ctx = this.ctx;
      const r = this.rect();
      const pad = 7 * fontScale, lh = 16 * fontScale;
      const x = opts.x == null ? r.x + 9 : opts.x;
      const y = opts.y == null ? r.y + 9 : opts.y;
      ctx.save();
      ctx.font = (10.5 * fontScale) + 'px ' + FONT;
      let wmax = 0;
      for (const it of items) wmax = Math.max(wmax, ctx.measureText(it.label).width);
      const bw = wmax + 38 * fontScale, bh = items.length * lh + pad * 2;
      ctx.fillStyle = 'rgba(255,255,255,0.93)';
      ctx.strokeStyle = '#dbe2ea'; ctx.lineWidth = 1;
      this.roundRect(x, y, bw, bh, 6); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      items.forEach((it, i) => {
        const yy = y + pad + lh * i + lh / 2;
        if (it.type === 'marker') {
          ctx.fillStyle = it.color;
          if (it.shape === 'star') {
            this.starAt(x + 12 * fontScale, yy, 5.5 * fontScale, it.color);
          } else {
            ctx.beginPath(); ctx.arc(x + 12 * fontScale, yy, 3.5 * fontScale, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.strokeStyle = it.color; ctx.lineWidth = it.width || 2;
          ctx.setLineDash(it.dash || []);
          ctx.beginPath(); ctx.moveTo(x + 7 * fontScale, yy); ctx.lineTo(x + 17 * fontScale, yy); ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.fillStyle = C.ink;
        ctx.fillText(it.label, x + 23 * fontScale, yy);
      });
      ctx.restore();
    }

    starAt(X, Y, size, color) {
      const ctx = this.ctx;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rr = i % 2 === 0 ? size : size * 0.42;
        const px = X + rr * Math.cos(a), py = Y + rr * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
    }

    xBand(x1, x2, style) {
      style = style || {};
      const ctx = this.ctx, r = this.rect();
      ctx.save();
      ctx.fillStyle = style.color || C.band;
      const X1 = Math.max(r.x, this.sx(x1)), X2 = Math.min(r.x + r.w, this.sx(x2));
      if (X2 > X1) ctx.fillRect(X1, r.y, X2 - X1, r.h);
      ctx.restore();
    }
  }

  RL.Charts = { Plot, C, FONT, SERIF, niceStep, ticks, fmtNum, setFontScale, getFontScale };
})(typeof window !== 'undefined' ? window : globalThis);
