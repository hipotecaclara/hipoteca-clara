(function () {
  "use strict";
  var D = window.HC_DATOS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var eur2 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var pct = function (v, d) { return v.toLocaleString("es-ES", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 3 : d }) + " %"; };
  var num = function (id) { var el = document.getElementById(id); var v = parseFloat(String(el.value).replace(",", ".")); return isFinite(v) ? v : 0; };

  /* Menú móvil */
  var t = $(".nav-toggle"), nav = $(".nav");
  if (t && nav) t.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    t.setAttribute("aria-expanded", open ? "true" : "false");
  });

  /* Datos dinámicos (Euríbor en cualquier página) */
  document.querySelectorAll("[data-euribor]").forEach(function (el) { el.textContent = pct(D.euribor.ultimo, 3); });
  document.querySelectorAll("[data-euribor-mes]").forEach(function (el) { el.textContent = D.euribor.ultimoMes; });
  document.querySelectorAll("[data-actualizado]").forEach(function (el) { el.textContent = D.actualizado; });

  /* Rellenar selects de comunidad */
  document.querySelectorAll("select[data-ccaa]").forEach(function (sel) {
    Object.keys(D.ccaa).sort(function (a, b) { return D.ccaa[a].n.localeCompare(D.ccaa[b].n, "es"); }).forEach(function (k) {
      var o = document.createElement("option"); o.value = k; o.textContent = D.ccaa[k].n;
      if (k === (sel.getAttribute("data-default") || "madrid")) o.selected = true;
      sel.appendChild(o);
    });
  });

  /* Matemáticas */
  function cuota(P, tinAnual, anos) {
    var n = Math.round(anos * 12), i = tinAnual / 100 / 12;
    if (P <= 0 || n <= 0) return 0;
    if (i === 0) return P / n;
    return P * i / (1 - Math.pow(1 + i, -n));
  }
  function capitalMax(c, tinAnual, anos) {
    var n = Math.round(anos * 12), i = tinAnual / 100 / 12;
    if (c <= 0 || n <= 0) return 0;
    if (i === 0) return c * n;
    return c * (1 - Math.pow(1 + i, -n)) / i;
  }
  function porTramos(tr, precio) {
    var resto = precio, prev = 0, total = 0;
    for (var k = 0; k < tr.length && resto > 0; k++) {
      var tramo = Math.min(resto, tr[k][0] - prev);
      total += tramo * tr[k][1] / 100; resto -= tramo; prev = tr[k][0];
    }
    return total;
  }
  function itpDe(c, precio, joven) {
    if (joven && c.joven != null && !(c.jovenMax && precio > c.jovenMax)) {
      if (c.jovenTramos) return porTramos(c.jovenTramos, precio);
      if (c.jovenTramosTotal) { for (var j = 0; j < c.jovenTramosTotal.length; j++) if (precio <= c.jovenTramosTotal[j][0]) return precio * c.jovenTramosTotal[j][1] / 100; }
      return precio * c.joven / 100;
    }
    if (c.tramos) return porTramos(c.tramos, precio);
    return precio * c.itp / 100;
  }
  function gastosCompra(precio, ccaaKey, nueva, joven, conHipoteca) {
    var c = D.ccaa[ccaaKey], lineas = [];
    if (nueva) {
      var ivaTipo = c.igic ? c.igic : 10;
      lineas.push([c.igic ? "IGIC vivienda nueva (" + pct(ivaTipo, 1) + ")" : "IVA vivienda nueva (" + pct(ivaTipo, 0) + ")", precio * ivaTipo / 100, "Lo cobra el promotor y lo ingresa en Hacienda"]);
      lineas.push(["AJD de la compraventa (" + pct(c.ajd, 2) + ")", precio * c.ajd / 100, "Impuesto autonómico sobre la escritura"]);
    } else {
      var imp = itpDe(c, precio, joven);
      var esJoven = joven && c.joven != null && !(c.jovenMax && precio > c.jovenMax);
      lineas.push(["ITP" + (esJoven ? " tipo joven" : "") + " (" + pct(imp / precio * 100, 2) + " efectivo)", imp, "Modelo 600, 30 días hábiles desde la firma"]);
    }
    lineas.push(["Notaría de la compraventa", Math.min(Math.max(precio * 0.003, 600), 1500), "Arancel regulado; estimación"]);
    lineas.push(["Registro de la Propiedad", Math.min(Math.max(precio * 0.0015, 400), 900), "Inscripción a tu nombre; estimación"]);
    lineas.push(["Gestoría de la compraventa", 350, "Opcional si tramitas tú los impuestos"]);
    if (conHipoteca) lineas.push(["Tasación", 400, "La paga el comprador aunque la encargue el banco"]);
    var total = lineas.reduce(function (s, l) { return s + l[1]; }, 0);
    return { lineas: lineas, total: total, c: c };
  }
  window.HC = { cuota: cuota, capitalMax: capitalMax, gastosCompra: gastosCompra };

  /* ---------- Calculadora de cuota ---------- */
  var fc = document.getElementById("calc-cuota");
  if (fc) {
    var modo = "fijo";
    var segBtns = fc.querySelectorAll(".seg button");
    segBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        modo = b.getAttribute("data-modo");
        segBtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $("#row-tin").hidden = modo !== "fijo";
        $("#row-dif").hidden = modo !== "variable";
        $("#row-eur").hidden = modo !== "variable";
        calcCuota();
      });
    });
    $("#c-euribor").value = D.euribor.ultimo;

    function calcCuota() {
      var precio = num("c-precio"), entrada = num("c-entrada"), anos = num("c-anos");
      var P = Math.max(precio - entrada, 0);
      var tin = modo === "fijo" ? num("c-tin") : Math.max(num("c-euribor") + num("c-dif"), 0);
      var m = cuota(P, tin, anos), n = Math.round(anos * 12);
      var total = m * n, intereses = total - P;
      $("#r-cuota").innerHTML = eur2.format(m) + " <small>/mes</small>";
      $("#r-capital").textContent = eur.format(P);
      $("#r-tin").textContent = pct(tin, 2);
      $("#r-intereses").textContent = eur.format(intereses);
      $("#r-total").textContent = eur.format(total);
      var ltv = precio > 0 ? P / precio * 100 : 0;
      var aviso = $("#r-aviso");
      if (ltv > 80) { aviso.hidden = false; aviso.textContent = "Financias el " + ltv.toFixed(0) + " % del precio. La mayoría de bancos prestan hasta el 80 % del valor de tasación para vivienda habitual; por encima suele hacer falta un aval o un producto específico."; }
      else aviso.hidden = true;
      var sens = $("#r-sens");
      if (modo === "variable") {
        sens.hidden = false;
        sens.textContent = "Si el Euríbor subiera un punto, la cuota pasaría a " + eur2.format(cuota(P, tin + 1, anos)) + " al mes (" + (cuota(P, tin + 1, anos) - m >= 0 ? "+" : "") + eur2.format(cuota(P, tin + 1, anos) - m) + "). Cálculo simplificado: en la realidad se recalcula sobre el capital pendiente en cada revisión.";
      } else sens.hidden = true;
      cuadro(P, tin, anos, m);
    }
    function cuadro(P, tin, anos, m) {
      var i = tin / 100 / 12, saldo = P, filas = [], n = Math.round(anos * 12), anio = { cap: 0, int: 0 };
      for (var k = 1; k <= n; k++) {
        var it = saldo * i, cap = m - it; saldo = Math.max(saldo - cap, 0);
        anio.cap += cap; anio.int += it;
        if (k % 12 === 0 || k === n) { filas.push({ a: Math.ceil(k / 12), cap: anio.cap, int: anio.int, saldo: saldo }); anio = { cap: 0, int: 0 }; }
      }
      var tb = $("#amort-body"); tb.innerHTML = "";
      filas.forEach(function (f) {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + f.a + "</td><td class='n'>" + eur.format(f.cap) + "</td><td class='n'>" + eur.format(f.int) + "</td><td class='n'>" + eur.format(f.saldo) + "</td>";
        tb.appendChild(tr);
      });
      // Gráfico de barras apiladas: capital vs intereses por año
      var svg = $("#amort-chart"); if (!svg) return;
      var W = 640, H = 220, L = 46, B = 26, T = 10, max = 0;
      filas.forEach(function (f) { max = Math.max(max, f.cap + f.int); });
      var step = niceStep(max / 4), top = Math.ceil(max / step) * step || 1;
      var bw = (W - L - 6) / filas.length, out = "";
      for (var g = 0; g <= top + 1e-6; g += step) {
        var y = T + (H - T - B) * (1 - g / top);
        out += "<line class='grid' x1='" + L + "' x2='" + W + "' y1='" + y + "' y2='" + y + "'/><text x='" + (L - 6) + "' y='" + (y + 4) + "' text-anchor='end'>" + Math.round(g / 1000) + "k</text>";
      }
      filas.forEach(function (f, idx) {
        var x = L + idx * bw + bw * 0.15, w = bw * 0.7, sc = (H - T - B) / top;
        var hc = f.cap * sc, hi = f.int * sc, y0 = H - B;
        out += "<rect class='bar-cap' x='" + x + "' y='" + (y0 - hc) + "' width='" + w + "' height='" + hc + "'/>";
        out += "<rect class='bar-int' x='" + x + "' y='" + (y0 - hc - hi) + "' width='" + w + "' height='" + hi + "'/>";
        if (filas.length <= 15 || f.a % 5 === 0 || f.a === 1) out += "<text x='" + (x + w / 2) + "' y='" + (H - 8) + "' text-anchor='middle'>" + f.a + "</text>";
      });
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.innerHTML = out;
    }
    fc.addEventListener("input", calcCuota);
    calcCuota();
  }
  function niceStep(raw) {
    if (raw <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }

  /* ---------- Calculadora de gastos ---------- */
  var fg = document.getElementById("calc-gastos");
  if (fg) {
    function calcGastos() {
      var precio = num("g-precio"), nueva = $("#g-tipo").value === "nueva";
      var joven = $("#g-joven").checked, hip = $("#g-hip").checked;
      var r = gastosCompra(precio, $("#g-ccaa").value, nueva, joven, hip);
      $("#g-joven-row").hidden = nueva;
      var tb = $("#g-lineas"); tb.innerHTML = "";
      r.lineas.forEach(function (l) {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + l[0] + "<span class='who'>" + l[2] + "</span></td><td>" + eur.format(l[1]) + "</td>";
        tb.appendChild(tr);
      });
      var tr = document.createElement("tr"); tr.className = "total";
      tr.innerHTML = "<td>Total gastos e impuestos</td><td>" + eur.format(r.total) + "</td>"; tb.appendChild(tr);
      $("#g-pct").textContent = precio > 0 ? (r.total / precio * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 }) + " % del precio" : "";
      $("#g-ahorro").textContent = eur.format(precio * (hip ? 0.2 : 1) + r.total);
      $("#g-ahorro-txt").textContent = hip ? "Entrada del 20 % + gastos (si el banco financia el 80 %)" : "Precio completo + gastos (compra sin hipoteca)";
      var notas = [];
      if (!nueva && (r.c.prog || r.c.tramos)) notas.push("En " + r.c.n + " el ITP es progresivo: en precios altos se aplica un tipo superior al general.");
      if (!nueva && joven && r.c.jovenMax && precio > r.c.jovenMax) notas.push("El precio supera el límite para el tipo joven en " + r.c.n + ", así que se aplica el general.");
      if (!nueva && joven && r.c.joven == null) notas.push(r.c.n + " no tiene tipo reducido por edad; se aplica el general.");
      if (!nueva && joven && r.c.joven != null) notas.push("El tipo joven exige requisitos (edad, vivienda habitual, límite de precio o de renta). Compruébalos antes de autoliquidar.");
      if (r.c.nota) notas.push(r.c.n + ": " + r.c.nota + ".");
      $("#g-notas").textContent = notas.join(" ");
      $("#g-notas").hidden = !notas.length;
    }
    fg.addEventListener("input", calcGastos); fg.addEventListener("change", calcGastos);
    calcGastos();
  }

  /* ---------- ¿Cuánto puedo pagar? ---------- */
  var fa = document.getElementById("calc-asequible");
  if (fa) {
    function calcAseq() {
      var ingresos = num("a-ingresos"), deudas = num("a-deudas"), ahorros = num("a-ahorros");
      var tin = num("a-tin"), anos = num("a-anos"), esf = num("a-esfuerzo") / 100;
      var c = D.ccaa[$("#a-ccaa").value];
      var g = c.itp / 100 + 0.015 + 750 / 200000; // impuesto + notaría/registro/gestoría/tasación aprox.
      var cuotaMax = Math.max(ingresos * esf - deudas, 0);
      var prestamoMax = capitalMax(cuotaMax, tin, anos);
      var p1 = prestamoMax / 0.8, p2 = ahorros / (0.2 + g);
      var precio = Math.max(Math.min(p1, p2), 0), limita = p2 < p1 ? "ahorros" : "ingresos";
      var prestamo = Math.min(precio * 0.8, prestamoMax);
      $("#a-precio").textContent = eur.format(Math.floor(precio / 1000) * 1000);
      $("#a-cuotamax").textContent = eur2.format(cuotaMax);
      $("#a-prestamo").textContent = eur.format(prestamo);
      $("#a-cuota").textContent = eur2.format(cuota(prestamo, tin, anos));
      $("#a-gastos").textContent = eur.format(precio * g);
      $("#a-limita").textContent = limita === "ahorros"
        ? "Lo que más te limita son los ahorros: necesitas cubrir el 20 % de entrada y los gastos de compra. Con más ahorro podrías optar a una vivienda más cara, porque tus ingresos permitirían una cuota mayor."
        : "Lo que más te limita son los ingresos: tus ahorros cubren entrada y gastos, pero la cuota no debería superar el " + Math.round(esf * 100) + " % de lo que ganas.";
    }
    fa.addEventListener("input", calcAseq); fa.addEventListener("change", calcAseq);
    calcAseq();
  }

  /* ---------- Gráfico del Euríbor ---------- */
  var ec = document.getElementById("euribor-chart");
  if (ec) {
    var s = D.euribor.serie, W = 640, H = 240, L = 44, R = 14, T = 16, B = 30;
    var min = 2, max = 3.5, x = function (i) { return L + i * (W - L - R) / (s.length - 1); };
    var y = function (v) { return T + (H - T - B) * (1 - (v - min) / (max - min)); };
    var o = "";
    for (var g = min; g <= max + 1e-6; g += 0.5) o += "<line class='grid' x1='" + L + "' x2='" + (W - R) + "' y1='" + y(g) + "' y2='" + y(g) + "'/><text x='" + (L - 6) + "' y='" + (y(g) + 4) + "' text-anchor='end'>" + g.toFixed(1).replace(".", ",") + "%</text>";
    var path = s.map(function (p, i) { return (i ? "L" : "M") + x(i) + " " + y(p[1]); }).join(" ");
    o += "<path class='area' d='" + path + " L" + x(s.length - 1) + " " + y(min) + " L" + x(0) + " " + y(min) + " Z'/>";
    o += "<path class='line' d='" + path + "'/>";
    s.forEach(function (p, i) { if (i % 2 === 0 || i === s.length - 1) o += "<text x='" + x(i) + "' y='" + (H - 10) + "' text-anchor='middle'>" + p[0] + "</text>"; });
    var last = s[s.length - 1];
    o += "<circle class='dot' r='5' cx='" + x(s.length - 1) + "' cy='" + y(last[1]) + "'/>";
    o += "<text x='" + (x(s.length - 1) - 8) + "' y='" + (y(last[1]) - 10) + "' text-anchor='end' style='fill:var(--ink);font-weight:700'>" + pct(last[1], 3) + "</text>";
    ec.setAttribute("viewBox", "0 0 " + W + " " + H); ec.innerHTML = o;
    var tb = document.getElementById("euribor-body");
    if (tb) s.slice().reverse().forEach(function (p, i, arr) {
      var prev = arr[i + 1], d = prev ? p[1] - prev[1] : null;
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + p[0] + "</td><td class='n'>" + pct(p[1], 3) + "</td><td class='n'>" + (d == null ? "—" : (d >= 0 ? "+" : "") + d.toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })) + "</td>";
      tb.appendChild(tr);
    });
  }

  /* ---------- Tabla ITP por comunidad ---------- */
  var it = document.getElementById("itp-body");
  if (it) Object.keys(D.ccaa).sort(function (a, b) { return D.ccaa[a].itp - D.ccaa[b].itp || D.ccaa[a].n.localeCompare(D.ccaa[b].n, "es"); }).forEach(function (k) {
    var c = D.ccaa[k], tr = document.createElement("tr");
    tr.innerHTML = "<td><a href='itp-" + k + ".html'>" + c.n + "</a></td><td class='n'>" + pct(c.itp, c.itp % 1 ? 2 : 0) + (c.prog || c.tramos ? " *" : "") + "</td><td class='n'>" + (c.joven == null ? "—" : pct(c.joven, c.joven % 1 ? 1 : 0)) + "</td><td class='n'>" + pct(c.ajd, 2) + "</td><td class='n'>" + eur.format(200000 * c.itp / 100) + "</td>";
    it.appendChild(tr);
  });
})();
