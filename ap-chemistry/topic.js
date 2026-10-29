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

  function renderAll(root){
    (root || document).querySelectorAll("[data-eq]").forEach(function(el){ el.innerHTML = fmt(el.getAttribute("data-eq")); });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", function(){ renderAll(); });
  else renderAll();

  return { parse:parse, term:term, fmt:fmt, rich:rich, shuffle:shuffle, mc:mc, frq:frq, renderAll:renderAll };
})();
