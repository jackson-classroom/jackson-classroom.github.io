/* ============================================================
   AP Chemistry — shared script for built-out topic pages.

   Chemical notation, written as plain text:
     2Na^+(aq)   coefficient 2, Na, charge +, state aq
     SO4^2-(aq)  digits in a formula become subscripts
     A + B -> C  equation; " + " separates species
   Use it three ways:
     <span data-eq="Pb^2+(aq) + 2I^-(aq) -> PbI2(s)"></span>   (formatted on load)
     APC.fmt("...")                                           (returns HTML)
     "Mix [[AgNO3(aq)]] with ..."  inside APC.rich / practice  (inline formulas)
   ============================================================ */
var APC = (function(){

  function sub(f){ return f.replace(/(\d+)/g, "<sub>$1</sub>"); }

  // Split one species into its parts. Returns {n, f, z, st}.
  function parse(s){
    s = s.trim();
    var m = /^(\d+)(?=[A-Za-z(\[])/.exec(s), n = 1;
    if(m){ n = parseInt(m[1], 10); s = s.slice(m[1].length); }
    var st = "";
    var ms = /\((s|l|g|aq)\)$/.exec(s);
    if(ms){ st = ms[1]; s = s.slice(0, ms.index); }
    var z = "";
    var mz = /\^(\d*[+-])$/.exec(s);
    if(mz){ z = mz[1]; s = s.slice(0, mz.index); }
    return { n:n, f:s, z:z, st:st };
  }

  function charge(z){ return z ? "<sup>" + z.replace("-", "−") + "</sup>" : ""; }

  // One species as HTML. cls adds classes to the wrapping span.
  function term(s, cls){
    var p = typeof s === "string" ? parse(s) : s;
    if(/^NR$/i.test(p.f)) return '<span class="sp">NR</span>';
    return '<span class="sp' + (cls ? " " + cls : "") + '">' + (p.n > 1 ? p.n : "") + sub(p.f) + charge(p.z) +
           (p.st ? "(" + p.st + ")" : "") + "</span>";
  }

  function side(str){ return str.split(" + ").map(function(t){ return term(t); }).join(" + "); }

  // A whole equation (or a lone species) as HTML.
  function fmt(eq){
    var parts = eq.split(" -> ");
    return '<span class="eqn">' + parts.map(side).join(' <span class="arr">→</span> ') + "</span>";
  }

  // Text with [[...]] chemistry inside it.
  function rich(s){ return String(s).replace(/\[\[(.+?)\]\]/g, function(_, x){ return fmt(x); }); }

  function shuffle(a){
    a = a.slice();
    for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Multiple choice. qs: [{q, c:[...4], a: index of answer, e: explanation}]
  function mc(host, scoreEl, qs){
    var answered = 0, right = 0;
    function tally(){ if(scoreEl) scoreEl.textContent = "Answered " + answered + " of " + qs.length + " · Correct " + right; }
    host.innerHTML = qs.map(function(q, i){
      return '<div class="q" data-i="' + i + '"><div class="qnum">Question ' + (i + 1) + '</div>' +
        '<div class="qtext">' + rich(q.q) + '</div><div class="choices">' +
        q.c.map(function(c, j){
          return '<button type="button" class="choice" data-j="' + j + '"><span class="ltr">' + "ABCD"[j] + '</span><span>' + rich(c) + "</span></button>";
        }).join("") + '</div><div class="expl" hidden></div></div>';
    }).join("");
    host.querySelectorAll(".choice").forEach(function(btn){
      btn.addEventListener("click", function(){
        var box = btn.closest(".q"), i = +box.dataset.i, j = +btn.dataset.j, q = qs[i];
        if(box.dataset.done) return;
        box.dataset.done = "1";
        answered++; if(j === q.a) right++;
        box.querySelectorAll(".choice").forEach(function(b, k){
          b.disabled = true;
          if(k === q.a) b.classList.add("right");
          else if(k === j) b.classList.add("wrong");
        });
        var ex = box.querySelector(".expl");
        ex.hidden = false;
        ex.innerHTML = (j === q.a ? "<b>Correct.</b> " : "<b>Not quite.</b> The answer is " + "ABCD"[q.a] + ". ") + rich(q.e);
        tally();
      });
    });
    tally();
  }

  // Written response. fs: [{q, m: model answer HTML}]
  function frq(host, fs){
    host.innerHTML = fs.map(function(f, i){
      return '<div class="q"><div class="qnum">Written response ' + (i + 1) + '</div><div class="qtext">' + rich(f.q) + '</div>' +
        '<textarea aria-label="Your answer to written response ' + (i + 1) + '" placeholder="Write your answer here, then compare."></textarea>' +
        '<details class="model"><summary>Show model answer</summary><div class="body">' + rich(f.m) + "</div></details></div>";
    }).join("");
  }

  // Atomic masses as printed on the AP Chemistry periodic table.
  var MASS = {H:1.008, He:4.00, Li:6.94, C:12.01, N:14.01, O:16.00, F:19.00, Na:22.99, Mg:24.31, Al:26.98, Si:28.09,
              P:30.97, S:32.06, Cl:35.45, K:39.10, Ca:40.08, Cr:52.00, Mn:54.94, Fe:55.85, Co:58.93, Ni:58.69, Cu:63.55,
              Zn:65.38, Br:79.90, Ag:107.87, I:126.90, Ba:137.33, Pb:207.2};

  // Count atoms in a formula, parentheses included: "Pb(NO3)2" -> {Pb:1, N:2, O:6}
  function atoms(f){
    var i = 0;
    function group(){
      var out = {};
      while(i < f.length && f[i] !== ")"){
        var part;
        if(f[i] === "("){ i++; part = group(); i++; }
        else { var m = /^[A-Z][a-z]?/.exec(f.slice(i)); i += m[0].length; part = {}; part[m[0]] = 1; }
        var n = /^\d+/.exec(f.slice(i)), k = 1;
        if(n){ k = +n[0]; i += n[0].length; }
        for(var e in part) out[e] = (out[e] || 0) + part[e] * k;
      }
      return out;
    }
    return group();
  }
  function molar(f){ var a = atoms(f), m = 0; for(var e in a) m += MASS[e] * a[e]; return m; }

  // A number a student typed: accepts 0.0125, 1.25e-2, 1.25 x 10^-2, 1.25×10-2. NaN if unreadable.
  function num(s){
    s = String(s).trim().replace(/,/g, "").replace(/−/g, "-").replace(/\s+/g, "");
    var m = /^([-+]?\d*\.?\d+)(?:[x×*]10\^?([-+]?\d+))?$/i.exec(s);
    if(m) return parseFloat(m[1]) * (m[2] !== undefined ? Math.pow(10, +m[2]) : 1);
    return /^[-+]?(\d*\.?\d+)(e[-+]?\d+)?$/i.test(s) ? parseFloat(s) : NaN;
  }
  // Within a relative tolerance (default 1%), so rounding at each step still counts.
  function close(got, want, tol){ return isFinite(got) && Math.abs(got - want) <= (tol || 0.01) * Math.abs(want) + 1e-12; }
  // Round to n significant figures for display.
  function sig(x, n){ if(x === 0) return "0"; var d = Math.max(0, (n || 3) - 1 - Math.floor(Math.log10(Math.abs(x)))); return x.toFixed(Math.min(d, 8)); }

  function renderAll(root){
    (root || document).querySelectorAll("[data-eq]").forEach(function(el){ el.innerHTML = fmt(el.getAttribute("data-eq")); });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", function(){ renderAll(); });
  else renderAll();

  return { parse:parse, term:term, fmt:fmt, rich:rich, shuffle:shuffle, mc:mc, frq:frq, renderAll:renderAll,
           MASS:MASS, atoms:atoms, molar:molar, num:num, close:close, sig:sig };
})();
