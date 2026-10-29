/* ============================================================
   AP Chemistry — particle diagrams, drawn as inline SVG.
   Shared by topic pages so every diagram uses the same colors.

   PART.box({label:"Before", items:[["N2",3],["H2",6]], seed:"r1"})
     A container with particles scattered at random (the seed keeps
     the layout the same every time the page loads).
   PART.box({..., solid:{ions:["Ag+","Cl-"], n:4}})
     Adds an ionic solid, drawn as a packed lattice at the bottom.
   PART.box({..., dense:0.55})
     Packs the particles into the bottom 55% of the box, like a liquid.
   PART.figure(w, h, [{sp:"H2O", x:40, y:30, rot:90}, ...], label, aria, scale)
     Particles at exact positions, for hand-placed figures.
   PART.legend(["H","O"])   HTML key of atom colors.
   PART.atoms("Pb(NO3)2")  {Pb:1, N:2, O:6}
   ============================================================ */
var PART = (function(){

  // Atom size and color. Ions use the same element entry.
  var EL = {
    H:{r:7, f:"#FFFFFF", s:"#6B7587", n:"hydrogen"},
    C:{r:11, f:"#3E434C", n:"carbon"},
    N:{r:11, f:"#3566C8", n:"nitrogen"},
    O:{r:11, f:"#D64534", n:"oxygen"},
    S:{r:12, f:"#DDAE1A", n:"sulfur"},
    Cl:{r:12, f:"#3E9E4B", n:"chlorine"},
    I:{r:13, f:"#7A3F9E", n:"iodine"},
    Na:{r:9, f:"#9C77D6", n:"sodium"},
    K:{r:11, f:"#C277C9", n:"potassium"},
    Ag:{r:11, f:"#A8B0BB", n:"silver"},
    Pb:{r:13, f:"#5E6A7A", n:"lead"},
    X:{r:11, f:"#E07B39", n:"element X"},
    Y:{r:11, f:"#2A8C9C", n:"element Y"}
  };

  // Atom positions within each particle (outer atoms first, so the central atom draws on top).
  var MOL = {
    "H2":[["H",-5,0],["H",5,0]],
    "O2":[["O",-8,0],["O",8,0]],
    "N2":[["N",-8,0],["N",8,0]],
    "Cl2":[["Cl",-9,0],["Cl",9,0]],
    "I2":[["I",-10,0],["I",10,0]],
    "H2O":[["H",-9,7],["H",9,7],["O",0,0]],
    "NH3":[["H",-10,6],["H",10,6],["H",0,-11],["N",0,0]],
    "CO":[["C",-7,0],["O",7,0]],
    "CO2":[["O",-15,0],["O",15,0],["C",0,0]],
    "NO":[["N",-7,0],["O",7,0]],
    "NO2":[["O",-12,7],["O",12,7],["N",0,0]],
    "SO2":[["O",-13,7],["O",13,7],["S",0,0]],
    "SO3":[["O",-14,7],["O",14,7],["O",0,-14],["S",0,0]],
    "CH4":[["H",0,-12],["H",-12,0],["H",12,0],["H",0,12],["C",0,0]],
    "H2O2":[["H",-16,-8],["H",16,8],["O",-7,0],["O",7,0]],
    "X2":[["X",-8,0],["X",8,0]],
    "Y2":[["Y",-8,0],["Y",8,0]],
    "XY":[["X",-8,0],["Y",8,0]],
    "XY3":[["Y",-10,6],["Y",10,6],["Y",0,-11],["X",0,0]],
    "Na+":[["Na",0,0]], "K+":[["K",0,0]], "Ag+":[["Ag",0,0]], "Pb2+":[["Pb",0,0]],
    "Cl-":[["Cl",0,0]], "I-":[["I",0,0]],
    "NO3-":[["O",-11,6],["O",11,6],["O",0,-12],["N",0,0]],
    "NaCl":[["Na",-9,0],["Cl",10,0]],                     // for wrong answers: ions drawn as a pair
    "PbI2":[["I",-21,0],["I",21,0],["Pb",0,0]],
    "Na":[["Na",0,0]], "Cl":[["Cl",0,0]], "H":[["H",0,0]], "O":[["O",0,0]], "N":[["N",0,0]]
  };
  var CHARGE = {"Na+":"+", "K+":"+", "Ag+":"+", "Pb2+":"2+", "Cl-":"−", "I-":"−", "NO3-":"−"};
  var NAME = {"Na+":"Na⁺ ion", "K+":"K⁺ ion", "Ag+":"Ag⁺ ion", "Pb2+":"Pb²⁺ ion", "Cl-":"Cl⁻ ion", "I-":"I⁻ ion", "NO3-":"NO₃⁻ ion"};

  function reach(sp){ return MOL[sp].reduce(function(m, a){ return Math.max(m, Math.hypot(a[1], a[2]) + EL[a[0]].r); }, 0); }

  // Seeded random numbers, so a diagram looks the same on every load.
  function rng(seed){
    var h = 1779033703 ^ String(seed).length;
    for(var i = 0; i < String(seed).length; i++){ h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    return function(){
      h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  // One particle at (x, y), rotated by rot degrees.
  function particle(sp, x, y, rot){
    var t = (rot || 0) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), out = "";
    MOL[sp].forEach(function(a){
      var e = EL[a[0]], ax = x + a[1] * c - a[2] * s, ay = y + a[1] * s + a[2] * c;
      out += '<circle cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="' + e.r + '" fill="' + e.f + '" stroke="' + (e.s || "rgba(0,0,0,.35)") + '" stroke-width="1"/>';
    });
    var q = CHARGE[sp];
    if(q){
      if(MOL[sp].length === 1){
        var dark = MOL[sp][0][0] !== "Ag";
        out += '<text x="' + x.toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="middle" font-size="' + (q.length > 1 ? 9 : 12) + '" font-weight="700" font-family="IBM Plex Sans,sans-serif" fill="' + (dark ? "#fff" : "#1C2333") + '">' + q + "</text>";
      } else {
        var rr = reach(sp);
        out += '<text x="' + (x + rr * .78).toFixed(1) + '" y="' + (y - rr * .62).toFixed(1) + '" text-anchor="middle" font-size="13" font-weight="700" font-family="IBM Plex Sans,sans-serif" fill="#1C2333">' + q + "</text>";
      }
    }
    return out;
  }

  // Lay out an ionic solid as a packed block. pattern is one formula unit, e.g. ["Pb2+","I-","I-"].
  function lattice(pattern, n){
    var ions = [];
    for(var i = 0; i < n; i++) ions = ions.concat(pattern);
    var d = 2 * Math.max.apply(null, ions.map(function(sp){ return EL[MOL[sp][0][0]].r; })) - 1;
    var cols = Math.max(2, Math.ceil(Math.sqrt(ions.length * 2)));
    if(pattern.length === 2 && cols % 2 === 0) cols++;          // odd row length gives a checkerboard
    var rows = Math.ceil(ions.length / cols);
    return {d:d, cols:cols, rows:rows, ions:ions, w:cols * d, h:rows * d};
  }

  function frame(w, h, label, inner, aria){
    return '<svg class="pbox" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + aria + '">' +
      '<rect x="1" y="1" width="' + (w - 2) + '" height="' + (h - 2) + '" rx="6" fill="#fff" stroke="#AEB8C6" stroke-width="1.5"/>' +
      (label ? '<text x="10" y="17" font-size="11" font-family="IBM Plex Mono,monospace" letter-spacing="1" fill="#5B6577">' + label.toUpperCase() + "</text>" : "") +
      inner + "</svg>";
  }

  function describe(items, solid){
    var parts = items.filter(function(it){ return it[1] > 0; }).map(function(it){ return it[1] + " " + (NAME[it[0]] || it[0] + " molecule") + (it[1] > 1 ? "s" : ""); });
    if(solid && solid.n) parts.push("a solid made of " + solid.n + " formula units of " + solid.ions.join(" and "));
    return parts.length ? parts.join(", ") : "empty";
  }

  // A container of randomly placed particles.
  function box(o){
    var w = o.w || 260, h = o.h || 180, r = rng(o.seed || JSON.stringify(o.items)), top = o.label ? 24 : 6, bottom = h - 6, inner = "";
    if(o.solid && o.solid.n){
      var L = lattice(o.solid.ions, o.solid.n), x0 = (w - L.w) / 2 + L.d / 2, y0 = h - 6 - L.h + L.d / 2;
      L.ions.forEach(function(sp, i){
        var row = Math.floor(i / L.cols), col = i % L.cols;
        var inRow = Math.min(L.cols, L.ions.length - row * L.cols);   // center a short top row
        inner += particle(sp, x0 + (L.cols - inRow) * L.d / 2 + col * L.d, y0 + (L.rows - 1 - row) * L.d, 0);
      });
      bottom = h - 10 - L.h;
    }
    if(o.dense) top = Math.max(top, bottom - o.dense * (bottom - top));   // a liquid sits at the bottom
    var want = o.dense ? 0 : 4, list = [];
    (o.items || []).forEach(function(it){ for(var k = 0; k < it[1]; k++) list.push(it[0]); });
    list.sort(function(a, b){ return reach(b) - reach(a); });     // place big particles first
    var placed = [];
    list.forEach(function(sp){
      var rad = reach(sp), best = null, bestGap = -1e9;
      for(var tries = 0; tries < 500; tries++){
        var x = 6 + rad + r() * (w - 12 - 2 * rad), y = top + rad + r() * Math.max(1, bottom - top - 2 * rad);
        var gap = placed.reduce(function(m, p){ return Math.min(m, Math.hypot(p.x - x, p.y - y) - p.rad - rad); }, 1e9);
        if(gap > bestGap){ bestGap = gap; best = {x:x, y:y}; }
        if(gap >= want) break;
      }
      placed.push({sp:sp, x:best.x, y:best.y, rad:rad, rot:Math.floor(r() * 360)});
    });
    placed.forEach(function(p){ inner += particle(p.sp, p.x, p.y, p.rot); });
    return frame(w, h, o.label, inner, (o.label ? o.label + ": " : "") + describe(o.items || [], o.solid));
  }

  // Particles at exact positions. parts: [{sp, x, y, rot}]. scale enlarges everything,
  // so positions are given in the unscaled w/scale by h/scale space.
  function figure(w, h, parts, label, aria, scale){
    var inner = parts.map(function(p){ return particle(p.sp, p.x, p.y, p.rot || 0); }).join("");
    if(scale) inner = '<g transform="scale(' + scale + ')">' + inner + "</g>";
    return frame(w, h, label, inner, aria || label || "particle diagram");
  }

  function legend(els){
    return '<span class="plegend">' + els.map(function(e){
      var d = EL[e];
      return '<span><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="' + d.f + '" stroke="' + (d.s || "rgba(0,0,0,.35)") + '"/></svg>' + e + " = " + d.n + "</span>";
    }).join("") + "</span>";
  }

  // Count atoms in a formula, parentheses included.
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

  return { box:box, figure:figure, particle:particle, legend:legend, atoms:atoms, reach:reach, EL:EL, MOL:MOL };
})();
