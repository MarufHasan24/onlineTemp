/*!
 * chartjs-plugin-zoom v2.0.1
 * undefined
 * (c) 2016-2023 chartjs-plugin-zoom Contributors
 * Released under the MIT License
 */
!(function (e, t) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = t(
        require("chart.js"),
        require("hammerjs"),
        require("chart.js/helpers")
      ))
    : "function" == typeof define && define.amd
    ? define(["chart.js", "hammerjs", "chart.js/helpers"], t)
    : ((e =
        "undefined" != typeof globalThis ? globalThis : e || self).ChartZoom =
        t(e.Chart, e.Hammer, e.Chart.helpers));
})(this, function (e, t, n) {
  "use strict";
  function o(e) {
    return e && "object" == typeof e && "default" in e ? e : { default: e };
  }
  var a = o(t);
  const i = (e) => e && e.enabled && e.modifierKey,
    c = (e, t) => e && t[e + "Key"],
    r = (e, t) => e && !t[e + "Key"];
  function s(e, t, n) {
    return (
      void 0 === e ||
      ("string" == typeof e
        ? -1 !== e.indexOf(t)
        : "function" == typeof e && -1 !== e({ chart: n }).indexOf(t))
    );
  }
  function l(e, t) {
    return (
      "function" == typeof e && (e = e({ chart: t })),
      "string" == typeof e
        ? { x: -1 !== e.indexOf("x"), y: -1 !== e.indexOf("y") }
        : { x: !1, y: !1 }
    );
  }
  function u(e, t, o) {
    const { mode: a = "xy", scaleMode: i, overScaleMode: c } = e || {},
      r = (function ({ x: e, y: t }, n) {
        const o = n.scales,
          a = Object.keys(o);
        for (let n = 0; n < a.length; n++) {
          const i = o[a[n]];
          if (t >= i.top && t <= i.bottom && e >= i.left && e <= i.right)
            return i;
        }
        return null;
      })(t, o),
      s = l(a, o),
      u = l(i, o);
    if (c) {
      const e = l(c, o);
      for (const t of ["x", "y"]) e[t] && ((u[t] = s[t]), (s[t] = !1));
    }
    if (r && u[r.axis]) return [r];
    const m = [];
    return (
      n.each(o.scales, function (e) {
        s[e.axis] && m.push(e);
      }),
      m
    );
  }
  const m = new WeakMap();
  function d(e) {
    let t = m.get(e);
    return (
      t ||
        ((t = {
          originalScaleLimits: {},
          updatedScaleLimits: {},
          handlers: {},
          panDelta: {},
        }),
        m.set(e, t)),
      t
    );
  }
  function f(e, t, n) {
    const o = e.max - e.min,
      a = o * (t - 1),
      i = e.isHorizontal() ? n.x : n.y,
      c = Math.max(0, Math.min(1, (e.getValueForPixel(i) - e.min) / o || 0));
    return { min: a * c, max: a * (1 - c) };
  }
  function p(e, t, o, a, i) {
    let c = o[a];
    if ("original" === c) {
      const o = e.originalScaleLimits[t.id][a];
      c = n.valueOrDefault(o.options, o.scale);
    }
    return n.valueOrDefault(c, i);
  }
  function h(e, { min: t, max: n }, o, a = !1) {
    const i = d(e.chart),
      { id: c, axis: r, options: s } = e,
      l = (o && (o[c] || o[r])) || {},
      { minRange: u = 0 } = l,
      m = p(i, e, l, "min", -1 / 0),
      f = p(i, e, l, "max", 1 / 0),
      h = a ? Math.max(n - t, u) : e.max - e.min,
      x = (h - n + t) / 2;
    return (
      (n += x),
      (t -= x) < m
        ? ((t = m), (n = Math.min(m + h, f)))
        : n > f && ((n = f), (t = Math.max(f - h, m))),
      (s.min = t),
      (s.max = n),
      (i.updatedScaleLimits[e.id] = { min: t, max: n }),
      e.parse(t) !== e.min || e.parse(n) !== e.max
    );
  }
  const x = (e) =>
    0 === e || isNaN(e)
      ? 0
      : e < 0
      ? Math.min(Math.round(e), -1)
      : Math.max(Math.round(e), 1);
  const g = {
    second: 500,
    minute: 3e4,
    hour: 18e5,
    day: 432e5,
    week: 3024e5,
    month: 1296e6,
    quarter: 5184e6,
    year: 157248e5,
  };
  function y(e, t, n, o = !1) {
    const { min: a, max: i, options: c } = e,
      r = c.time && c.time.round,
      s = g[r] || 0,
      l = e.getValueForPixel(e.getPixelForValue(a + s) - t),
      u = e.getValueForPixel(e.getPixelForValue(i + s) - t),
      { min: m = -1 / 0, max: d = 1 / 0 } = (o && n && n[e.axis]) || {};
    return (
      !!(isNaN(l) || isNaN(u) || l < m || u > d) ||
      h(e, { min: l, max: u }, n, o)
    );
  }
  function b(e, t, n) {
    return y(e, t, n, !0);
  }
  const v = {
      category: function (e, t, n, o) {
        const a = f(e, t, n);
        return (
          e.min === e.max &&
            t < 1 &&
            (function (e) {
              const t = e.getLabels().length - 1;
              e.min > 0 && (e.min -= 1), e.max < t && (e.max += 1);
            })(e),
          h(e, { min: e.min + x(a.min), max: e.max - x(a.max) }, o, !0)
        );
      },
      default: function (e, t, n, o) {
        const a = f(e, t, n);
        return h(e, { min: e.min + a.min, max: e.max - a.max }, o, !0);
      },
    },
    w = {
      default: function (e, t, n, o) {
        h(
          e,
          (function (e, t, n) {
            const o = e.getValueForPixel(t),
              a = e.getValueForPixel(n);
            return { min: Math.min(o, a), max: Math.max(o, a) };
          })(e, t, n),
          o,
          !0
        );
      },
    },
    z = {
      category: function (e, t, n) {
        const o = e.getLabels().length - 1;
        let { min: a, max: i } = e;
        const c = Math.max(i - a, 1),
          r = Math.round(
            (function (e) {
              return e.isHorizontal() ? e.width : e.height;
            })(e) / Math.max(c, 10)
          ),
          s = Math.round(Math.abs(t / r));
        let l;
        return (
          t < -r
            ? ((i = Math.min(i + s, o)),
              (a = 1 === c ? i : i - c),
              (l = i === o))
            : t > r &&
              ((a = Math.max(0, a - s)),
              (i = 1 === c ? a : a + c),
              (l = 0 === a)),
          h(e, { min: a, max: i }, n) || l
        );
      },
      default: y,
      logarithmic: b,
      timeseries: b,
    };
  function M(e, t) {
    n.each(e, (n, o) => {
      t[o] || delete e[o];
    });
  }
  function k(e, t) {
    const { scales: o } = e,
      { originalScaleLimits: a, updatedScaleLimits: i } = t;
    return (
      n.each(o, function (e) {
        (function (e, t, n) {
          const {
            id: o,
            options: { min: a, max: i },
          } = e;
          if (!t[o] || !n[o]) return !0;
          const c = n[o];
          return c.min !== a || c.max !== i;
        })(e, a, i) &&
          (a[e.id] = {
            min: { scale: e.min, options: e.options.min },
            max: { scale: e.max, options: e.options.max },
          });
      }),
      M(a, o),
      M(i, o),
      a
    );
  }
  function S(e, t, o, a) {
    const i = v[e.type] || v.default;
    n.callback(i, [e, t, o, a]);
  }
  function P(e, t, o, a, i) {
    const c = w[e.type] || w.default;
    n.callback(c, [e, t, o, a, i]);
  }
  function D(e) {
    const t = e.chartArea;
    return { x: (t.left + t.right) / 2, y: (t.top + t.bottom) / 2 };
  }
  function j(e, t, o = "none") {
    const {
        x: a = 1,
        y: i = 1,
        focalPoint: c = D(e),
      } = "number" == typeof t ? { x: t, y: t } : t,
      r = d(e),
      {
        options: { limits: s, zoom: l },
      } = r;
    k(e, r);
    const m = 1 !== a,
      f = 1 !== i,
      p = u(l, c, e);
    n.each(p || e.scales, function (e) {
      e.isHorizontal() && m
        ? S(e, a, c, s)
        : !e.isHorizontal() && f && S(e, i, c, s);
    }),
      e.update(o),
      n.callback(l.onZoom, [{ chart: e }]);
  }
  function O(e, t, o, a = "none") {
    const i = d(e),
      {
        options: { limits: c, zoom: r },
      } = i,
      { mode: l = "xy" } = r;
    k(e, i);
    const u = s(l, "x", e),
      m = s(l, "y", e);
    n.each(e.scales, function (e) {
      e.isHorizontal() && u
        ? P(e, t.x, o.x, c)
        : !e.isHorizontal() && m && P(e, t.y, o.y, c);
    }),
      e.update(a),
      n.callback(r.onZoom, [{ chart: e }]);
  }
  function C(e) {
    const t = d(e);
    let o = 1,
      a = 1;
    return (
      n.each(e.scales, function (e) {
        const i = (function (e, t) {
          const o = e.originalScaleLimits[t];
          if (!o) return;
          const { min: a, max: i } = o;
          return (
            n.valueOrDefault(i.options, i.scale) -
            n.valueOrDefault(a.options, a.scale)
          );
        })(t, e.id);
        if (i) {
          const t = Math.round((i / (e.max - e.min)) * 100) / 100;
          (o = Math.min(o, t)), (a = Math.max(a, t));
        }
      }),
      o < 1 ? o : a
    );
  }
  function R(e, t, o, a) {
    const { panDelta: i } = a,
      c = i[e.id] || 0;
    n.sign(c) === n.sign(t) && (t += c);
    const r = z[e.type] || z.default;
    n.callback(r, [e, t, o]) ? (i[e.id] = 0) : (i[e.id] = t);
  }
  function Z(e, t, o, a = "none") {
    const { x: i = 0, y: c = 0 } = "number" == typeof t ? { x: t, y: t } : t,
      r = d(e),
      {
        options: { pan: s, limits: l },
      } = r,
      { onPan: u } = s || {};
    k(e, r);
    const m = 0 !== i,
      f = 0 !== c;
    n.each(o || e.scales, function (e) {
      e.isHorizontal() && m
        ? R(e, i, l, r)
        : !e.isHorizontal() && f && R(e, c, l, r);
    }),
      e.update(a),
      n.callback(u, [{ chart: e }]);
  }
  function T(e) {
    const t = d(e);
    k(e, t);
    const n = {};
    for (const o of Object.keys(e.scales)) {
      const { min: e, max: a } = t.originalScaleLimits[o] || {
        min: {},
        max: {},
      };
      n[o] = { min: e.scale, max: a.scale };
    }
    return n;
  }
  function L(e, t) {
    const { handlers: n } = d(e),
      o = n[t];
    o && o.target && (o.target.removeEventListener(t, o), delete n[t]);
  }
  function E(e, t, n, o) {
    const { handlers: a, options: i } = d(e),
      c = a[n];
    (c && c.target === t) ||
      (L(e, n),
      (a[n] = (t) => o(e, t, i)),
      (a[n].target = t),
      t.addEventListener(n, a[n]));
  }
  function F(e, t) {
    const n = d(e);
    n.dragStart && ((n.dragging = !0), (n.dragEnd = t), e.update("none"));
  }
  function H(e, t) {
    const n = d(e);
    n.dragStart &&
      "Escape" === t.key &&
      (L(e, "keydown"),
      (n.dragging = !1),
      (n.dragStart = n.dragEnd = null),
      e.update("none"));
  }
  function Y(e, t, o) {
    const { onZoomStart: a, onZoomRejected: i } = o;
    if (a) {
      const o = n.getRelativePosition(t, e);
      if (!1 === n.callback(a, [{ chart: e, event: t, point: o }]))
        return n.callback(i, [{ chart: e, event: t }]), !1;
    }
  }
  function V(e, t) {
    const o = d(e),
      { pan: a, zoom: s = {} } = o.options;
    if (0 !== t.button || c(i(a), t) || r(i(s.drag), t))
      return n.callback(s.onZoomRejected, [{ chart: e, event: t }]);
    !1 !== Y(e, t, s) &&
      ((o.dragStart = t),
      E(e, e.canvas, "mousemove", F),
      E(e, window.document, "keydown", H));
  }
  function K(e, t, o, a) {
    const i = s(t, "x", e),
      c = s(t, "y", e);
    let {
      top: r,
      left: l,
      right: u,
      bottom: m,
      width: d,
      height: f,
    } = e.chartArea;
    const p = n.getRelativePosition(o, e),
      h = n.getRelativePosition(a, e);
    i && ((l = Math.min(p.x, h.x)), (u = Math.max(p.x, h.x))),
      c && ((r = Math.min(p.y, h.y)), (m = Math.max(p.y, h.y)));
    const x = u - l,
      g = m - r;
    return {
      left: l,
      top: r,
      right: u,
      bottom: m,
      width: x,
      height: g,
      zoomX: i && x ? 1 + (d - x) / d : 1,
      zoomY: c && g ? 1 + (f - g) / f : 1,
    };
  }
  function N(e, t) {
    const o = d(e);
    if (!o.dragStart) return;
    L(e, "mousemove");
    const {
        mode: a,
        onZoomComplete: i,
        drag: { threshold: c = 0 },
      } = o.options.zoom,
      r = K(e, a, o.dragStart, t),
      l = s(a, "x", e) ? r.width : 0,
      u = s(a, "y", e) ? r.height : 0,
      m = Math.sqrt(l * l + u * u);
    if (((o.dragStart = o.dragEnd = null), m <= c))
      return (o.dragging = !1), void e.update("none");
    O(e, { x: r.left, y: r.top }, { x: r.right, y: r.bottom }, "zoom"),
      setTimeout(() => (o.dragging = !1), 500),
      n.callback(i, [{ chart: e }]);
  }
  function X(e, t) {
    const {
      handlers: { onZoomComplete: o },
      options: { zoom: a },
    } = d(e);
    if (
      !(function (e, t, o) {
        if (r(i(o.wheel), t))
          n.callback(o.onZoomRejected, [{ chart: e, event: t }]);
        else if (
          !1 !== Y(e, t, o) &&
          (t.cancelable && t.preventDefault(), void 0 !== t.deltaY)
        )
          return !0;
      })(e, t, a)
    )
      return;
    const c = t.target.getBoundingClientRect(),
      s = 1 + (t.deltaY >= 0 ? -a.wheel.speed : a.wheel.speed);
    j(e, {
      x: s,
      y: s,
      focalPoint: { x: t.clientX - c.left, y: t.clientY - c.top },
    }),
      o && o();
  }
  function q(e, t, o, a) {
    o &&
      (d(e).handlers[t] = (function (e, t) {
        let n;
        return function () {
          return clearTimeout(n), (n = setTimeout(e, t)), t;
        };
      })(() => n.callback(o, [{ chart: e }]), a));
  }
  function W(e, t) {
    return function (o, a) {
      const { pan: s, zoom: l = {} } = t.options;
      if (!s || !s.enabled) return !1;
      const u = a && a.srcEvent;
      return (
        !u ||
        !(
          !t.panning &&
          "mouse" === a.pointerType &&
          (r(i(s), u) || c(i(l.drag), u))
        ) ||
        (n.callback(s.onPanRejected, [{ chart: e, event: a }]), !1)
      );
    };
  }
  function B(e, t, n) {
    if (t.scale) {
      const { center: o, pointers: a } = n,
        i = (1 / t.scale) * n.scale,
        c = n.target.getBoundingClientRect(),
        r = (function (e, t) {
          const n = Math.abs(e.clientX - t.clientX),
            o = Math.abs(e.clientY - t.clientY),
            a = n / o;
          let i, c;
          return (
            a > 0.3 && a < 1.7 ? (i = c = !0) : n > o ? (i = !0) : (c = !0),
            { x: i, y: c }
          );
        })(a[0], a[1]),
        l = t.options.zoom.mode;
      j(e, {
        x: r.x && s(l, "x", e) ? i : 1,
        y: r.y && s(l, "y", e) ? i : 1,
        focalPoint: { x: o.x - c.left, y: o.y - c.top },
      }),
        (t.scale = n.scale);
    }
  }
  function A(e, t, n) {
    const o = t.delta;
    o &&
      ((t.panning = !0),
      Z(e, { x: n.deltaX - o.x, y: n.deltaY - o.y }, t.panScales),
      (t.delta = { x: n.deltaX, y: n.deltaY }));
  }
  const I = new WeakMap();
  function U(e, t) {
    const o = d(e),
      i = e.canvas,
      { pan: c, zoom: r } = t,
      s = new a.default.Manager(i);
    r &&
      r.pinch.enabled &&
      (s.add(new a.default.Pinch()),
      s.on("pinchstart", () =>
        (function (e, t) {
          t.options.zoom.pinch.enabled && (t.scale = 1);
        })(0, o)
      ),
      s.on("pinch", (t) => B(e, o, t)),
      s.on("pinchend", (t) =>
        (function (e, t, o) {
          t.scale &&
            (B(e, t, o),
            (t.scale = null),
            n.callback(t.options.zoom.onZoomComplete, [{ chart: e }]));
        })(e, o, t)
      )),
      c &&
        c.enabled &&
        (s.add(new a.default.Pan({ threshold: c.threshold, enable: W(e, o) })),
        s.on("panstart", (t) =>
          (function (e, t, o) {
            const {
              enabled: a,
              onPanStart: i,
              onPanRejected: c,
            } = t.options.pan;
            if (!a) return;
            const r = o.target.getBoundingClientRect(),
              s = { x: o.center.x - r.left, y: o.center.y - r.top };
            if (!1 === n.callback(i, [{ chart: e, event: o, point: s }]))
              return n.callback(c, [{ chart: e, event: o }]);
            (t.panScales = u(t.options.pan, s, e)),
              (t.delta = { x: 0, y: 0 }),
              clearTimeout(t.panEndTimeout),
              A(e, t, o);
          })(e, o, t)
        ),
        s.on("panmove", (t) => A(e, o, t)),
        s.on("panend", () =>
          (function (e, t) {
            (t.delta = null),
              t.panning &&
                ((t.panEndTimeout = setTimeout(() => (t.panning = !1), 500)),
                n.callback(t.options.pan.onPanComplete, [{ chart: e }]));
          })(e, o)
        )),
      I.set(e, s);
  }
  function G(e, t, n) {
    const o = n.zoom.drag,
      { dragStart: a, dragEnd: i } = d(e);
    if (o.drawTime !== t || !i) return;
    const { left: c, top: r, width: s, height: l } = K(e, n.zoom.mode, a, i),
      u = e.ctx;
    u.save(),
      u.beginPath(),
      (u.fillStyle = o.backgroundColor || "rgba(225,225,225,0.3)"),
      u.fillRect(c, r, s, l),
      o.borderWidth > 0 &&
        ((u.lineWidth = o.borderWidth),
        (u.strokeStyle = o.borderColor || "rgba(225,225,225)"),
        u.strokeRect(c, r, s, l)),
      u.restore();
  }
  var J = {
    id: "zoom",
    version: "2.0.1",
    defaults: {
      pan: { enabled: !1, mode: "xy", threshold: 10, modifierKey: null },
      zoom: {
        wheel: { enabled: !1, speed: 0.1, modifierKey: null },
        drag: {
          enabled: !1,
          drawTime: "beforeDatasetsDraw",
          modifierKey: null,
        },
        pinch: { enabled: !1 },
        mode: "xy",
      },
    },
    start: function (e, t, o) {
      (d(e).options = o),
        Object.prototype.hasOwnProperty.call(o.zoom, "enabled") &&
          console.warn(
            "The option `zoom.enabled` is no longer supported. Please use `zoom.wheel.enabled`, `zoom.drag.enabled`, or `zoom.pinch.enabled`."
          ),
        (Object.prototype.hasOwnProperty.call(o.zoom, "overScaleMode") ||
          Object.prototype.hasOwnProperty.call(o.pan, "overScaleMode")) &&
          console.warn(
            "The option `overScaleMode` is deprecated. Please use `scaleMode` instead (and update `mode` as desired)."
          ),
        a.default && U(e, o),
        (e.pan = (t, n, o) => Z(e, t, n, o)),
        (e.zoom = (t, n) => j(e, t, n)),
        (e.zoomRect = (t, n, o) => O(e, t, n, o)),
        (e.zoomScale = (t, n, o) =>
          (function (e, t, n, o = "none") {
            k(e, d(e)), h(e.scales[t], n, void 0, !0), e.update(o);
          })(e, t, n, o)),
        (e.resetZoom = (t) =>
          (function (e, t = "default") {
            const o = d(e),
              a = k(e, o);
            n.each(e.scales, function (e) {
              const t = e.options;
              a[e.id]
                ? ((t.min = a[e.id].min.options), (t.max = a[e.id].max.options))
                : (delete t.min, delete t.max);
            }),
              e.update(t),
              n.callback(o.options.zoom.onZoomComplete, [{ chart: e }]);
          })(e, t)),
        (e.getZoomLevel = () => C(e)),
        (e.getInitialScaleBounds = () => T(e)),
        (e.isZoomedOrPanned = () =>
          (function (e) {
            const t = T(e);
            for (const n of Object.keys(e.scales)) {
              const { min: o, max: a } = t[n];
              if (void 0 !== o && e.scales[n].min !== o) return !0;
              if (void 0 !== a && e.scales[n].max !== a) return !0;
            }
            return !1;
          })(e));
    },
    beforeEvent(e) {
      const t = d(e);
      if (t.panning || t.dragging) return !1;
    },
    beforeUpdate: function (e, t, n) {
      (d(e).options = n),
        (function (e, t) {
          const n = e.canvas,
            { wheel: o, drag: a, onZoomComplete: i } = t.zoom;
          o.enabled
            ? (E(e, n, "wheel", X), q(e, "onZoomComplete", i, 250))
            : L(e, "wheel"),
            a.enabled
              ? (E(e, n, "mousedown", V), E(e, n.ownerDocument, "mouseup", N))
              : (L(e, "mousedown"),
                L(e, "mousemove"),
                L(e, "mouseup"),
                L(e, "keydown"));
        })(e, n);
    },
    beforeDatasetsDraw(e, t, n) {
      G(e, "beforeDatasetsDraw", n);
    },
    afterDatasetsDraw(e, t, n) {
      G(e, "afterDatasetsDraw", n);
    },
    beforeDraw(e, t, n) {
      G(e, "beforeDraw", n);
    },
    afterDraw(e, t, n) {
      G(e, "afterDraw", n);
    },
    stop: function (e) {
      !(function (e) {
        L(e, "mousedown"),
          L(e, "mousemove"),
          L(e, "mouseup"),
          L(e, "wheel"),
          L(e, "click"),
          L(e, "keydown");
      })(e),
        a.default &&
          (function (e) {
            const t = I.get(e);
            t &&
              (t.remove("pinchstart"),
              t.remove("pinch"),
              t.remove("pinchend"),
              t.remove("panstart"),
              t.remove("pan"),
              t.remove("panend"),
              t.destroy(),
              I.delete(e));
          })(e),
        (function (e) {
          m.delete(e);
        })(e);
    },
    panFunctions: z,
    zoomFunctions: v,
    zoomRectFunctions: w,
  };
  return e.Chart.register(J), J;
});
