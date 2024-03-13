var TWO_PI = Math.PI * 2;

var source_lines_per_unit_charge = 10;
var k = 10;

var step = 0.06;
var start_step = 0.001;
var max_steps = 2000;

var Utolerance = 0.001;
var step_equi = 0.05;
var max_equi_step = 200;

var potential_multiple = 3;

var hide_charge_values = false;

var myRandom = [];
for (var r = 0; r < 7; r++) myRandom.push((Math.PI * 2 * r) / 7);
for (var r = 1; r < 15; r++) myRandom.push((Math.PI * 2 * r) / 15);
for (var r = 2; r < 1000; r++) myRandom.push(Math.random() * Math.PI * 2);

// $(function () {
//   applet = new Applet($("div#sim"));
//   $("#lines_per_unit_charge").html(source_lines_per_unit_charge);
//   $("#lines_slider").slider({
//     value: source_lines_per_unit_charge,
//     min: 3,
//     max: 30,
//     step: 1,
//     slide: function (event, ui) {
//       source_lines_per_unit_charge = ui.value;
//       $("#lines_per_unit_charge").html(source_lines_per_unit_charge);
//       applet.Draw();
//     },
//   });

//   $("#downloadlink").bind("click", function (ev) {
//     var dt = applet.canvas.toDataURL("image/png");
//     this.href = dt;

//     // return DoPrint($('#everything'),true);
//   });
// });
document.addEventListener("DOMContentLoaded", () => {
  let applet = new Applet(document.querySelector("div#sim"));
  document.querySelector("#lines_per_unit_charge").innerHTML =
    source_lines_per_unit_charge;

  // Setup the slider
  const slider = document.querySelector("#lines_slider");
  slider.setAttribute("type", "range");
  slider.setAttribute("min", "3");
  slider.setAttribute("max", "30");
  slider.setAttribute("step", "1");
  slider.value = source_lines_per_unit_charge;

  slider.addEventListener("input", function () {
    source_lines_per_unit_charge = this.value;
    document.querySelector("#lines_per_unit_charge").innerHTML =
      source_lines_per_unit_charge;
    applet.Draw();
  });

  document
    .querySelector("#downloadlink")
    .addEventListener("click", function () {
      const dt = applet.canvas.toDataURL("image/png");
      this.href = dt;
    });
});

function Applet(element, options) {
  if (!element) {
    console.log("Pad: NULL element provided.");
    return;
  }
  if ($(element).length < 1) {
    console.log("Pad: Zero-length jquery selector provided.");
    return;
  }
  this.element = $(element).get(0);

  this.bg_color = "255,255,255";
  this.origin_x = 0.0;
  this.origin_y = 0.0;
  this.width_x = 10.0;
  this.dragging = false;

  // Merge in the options.
  $.extend(true, this, options);

  // Merge in options from element
  var element_settings = $(element).attr("settings");
  var element_settings_obj = {};
  if ($("canvas", this.element).length < 1) {
    this.canvas = document.createElement("canvas");
    this.element.appendChild(this.canvas);
  } else {
    this.canvas = $("canvas", this.element).get(0);
  }

  if (!element) {
    console.log("Pad: NULL element provided.");
    return;
  }
  if ($(element).length < 1) {
    console.log("Pad: Zero-length jquery selector provided.");
    return;
  }
  this.element = $(element).get(0);

  // Build the drawing context.
  this.ctx = this.canvas.getContext("2d");
  // if(initCanvas) this.ctx = initCanvas(this.canvas).getContext('2d');
  if (!this.ctx) console.log("Problem getting context!");
  if (!$(this.element).is(":hidden")) {
    width = $(this.element).width();
    height = $(this.element).height();
  }
  this.canvas.width = this.width = width;
  this.canvas.height = this.height = height;

  // Data.
  this.charges = [];

  // see if there's an override in the URL
  var urlParams;
  var match,
    pl = /\+/g, // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s) {
      return decodeURIComponent(s.replace(pl, " "));
    },
    query = window.location.search.substring(1);

  urlParams = {};
  while ((match = search.exec(query)))
    urlParams[decode(match[1])] = decode(match[2]);

  for (p in urlParams) {
    if (p.match(/^q/)) {
      var list = urlParams[p].split(",");
      this.charges.push({
        q: parseFloat(list[0]),
        x: parseFloat(list[1]),
        y: parseFloat(list[2]),
        r: Math.abs(parseFloat(list[0])) * 0.12,
      });
    }
  }
  if (urlParams.lines) {
    source_lines_per_unit_charge = urlParams.lines;
  }
  if (urlParams.hideq) {
    hide_charge_values = true;
  }

  if (this.charges.length == 0)
    this.charges = [
      { q: 1, x: -1, y: 1, r: 0.12 },
      { q: -1, x: 1, y: -0, r: 0.12 },
      { q: -2, x: 1.001, y: -1, r: Math.sqrt(2) * 0.12 },
    ];

  this.estMode = $("#estMode").val();

  this.FindFieldLines();
  this.Draw();

  const self = this;

  window.addEventListener("resize", (ev) => self.Resize(ev));

  window.addEventListener("mousemove", (ev) => self.DoMouse(ev));

  this.element.addEventListener("mousedown", (ev) => self.DoMouse(ev));

  window.addEventListener("mouseup", (ev) => self.DoMouse(ev));

  this.element.addEventListener("mouseout", (ev) => self.DoMouse(ev));

  document.querySelectorAll(".addcharge").forEach((element) => {
    element.addEventListener("mousedown", (ev) => self.AddCharge(ev));
  });

  this.element.addEventListener("touchstart", (ev) => self.DoMouse(ev));

  window.addEventListener("touchmove", (ev) => self.DoMouse(ev));

  window.addEventListener("touchend", (ev) => self.DoMouse(ev));

  document.querySelectorAll(".addcharge").forEach((element) => {
    element.addEventListener("touchstart", (ev) => self.AddCharge(ev));
  });

  // document
  //   .getElementById("ctl-do-eqipotential")
  //   .addEventListener("onchange", () => self.Draw());
  // document
  //   .getElementById("ctl-do-eqipotential")
  //   .addEventListener(".detectThisChange", () => self.Draw());
  // document
  //   .getElementById("ctl-do-eqipotential")
  //   .addEventListener("click", () => self.Draw());
  document
    .getElementById("ctl-do-eqipotential")
    .addEventListener("onchange", () => self.Draw());
  document
    .getElementById("ctl-do-eqipotential")
    .addEventListener("change", () => self.Draw());
  document
    .getElementById("ctl-do-eqipotential")
    .addEventListener("touchstart", () => self.Draw());

  document
    .getElementById("ctl-zoom-in")
    .addEventListener("click", () => self.DoZoom(1));
  document
    .getElementById("ctl-zoom-in")
    .addEventListener("tap", () => self.DoZoom(1));
  document
    .getElementById("ctl-zoom-in")
    .addEventListener("touchstart", () => self.DoZoom(1));

  // This seems to be a mistake in the original code, as `.on` is not a valid method without an event type.
  // Assuming it was intended to be another click event listener for "#ctl-zoom-in", which seems redundant.
  // So, it's omitted in the rewrite. If it was meant for a different event, add accordingly with the correct event type.

  document
    .getElementById("ctl-zoom-out")
    .addEventListener("click", () => self.DoZoom(-1));
  document
    .getElementById("ctl-zoom-out")
    .addEventListener("tap", () => self.DoZoom(-1));
  document
    .getElementById("ctl-zoom-out")
    .addEventListener("touchstart", () => self.DoZoom(-1));

  document.getElementById("estMode").addEventListener("change", function () {
    self.estMode = this.value;
    self.Draw();
  });
}

Applet.prototype.DoZoom = function (zoom) {
  this.width_x -= zoom;
  this.Draw();
};

Applet.prototype.Resize = function () {
  console.log("Applet::Resize()", this);
  var width = $(this.element).width();
  var height = $(this.element).height();
  this.canvas.width = this.width = width;
  this.canvas.height = this.height = height;
  this.Draw();
};

Applet.prototype.Clear = function () {
  //console.log("Pad.Clear()");
  if (!this.ctx) return;
  this.ctx.fillStyle = "rgb(" + this.bg_color + ")";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

Applet.prototype.Field = function (x, y) {
  var Ex = 0;
  var Ey = 0;
  var U = 0;
  var dUdx = 0;
  for (var i = 0; i < this.charges.length; i++) {
    var c = this.charges[i];
    var dx = x - c.x;
    var dy = y - c.y;
    var r2 = dx * dx + dy * dy;
    var r = Math.sqrt(r2);
    var E = (2 * c.q) / r; // These are really charged rods in 2d space, not point charges in 3d
    // var E = c.q/r;
    Ex += (dx / r) * E;
    Ey += (dy / r) * E;
    // U += c.q/r;
    U += -2 * c.q * Math.log(r); // Potential near a charged rod; arbitrary scale.
  }
  var E2 = Ex * Ex + Ey * Ey;
  var E = Math.sqrt(E2);
  var ret = {
    x: x,
    y: y, // Coordinates.
    U: U, // Potential
    E: E, // Field magnitude
    Ex: Ex,
    Ey: Ey, // Field vector
    gx: Ex / E,
    gy: Ey / E, // Field direction vector
  };
  // console.log("Field at "+x+","+y,ret);
  return ret;
};

Applet.prototype.FindCollision = function (x, y) {
  for (var i = 0; i < this.charges.length; i++) {
    var c = this.charges[i];
    var dx = x - c.x;
    var dy = y - c.y;
    var r2 = dx * dx + dy * dy;
    var cr = c.r - 0.0001;
    if (r2 < cr * cr) {
      // console.log("collision",dx,dy,r2,cr*cr);
      return c;
    }
  }
  return null;
};

function chargesort(a, b) {
  var cmp = a.q - b.q;
  if (cmp == 0) cmp = a.y - b.y;
  return cmp;
}

function SpansIntegerMultiple(a, b, r) {
  // Does (a,b) span an a value that is an integer multiple of r?
  var da = Math.floor(a / r);
  var db = Math.floor(b / r);
  if (da == db) return null;
  return Math.max(da, db);
}
function PointTripletOrientation(p, q, r) {
  var val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

  if (val == 0) return 0; // colinear

  return val > 0 ? 1 : 2; // clock or counterclock wise
}

function PointOnSegment(p, q, r) {
  if (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  )
    return true;

  return false;
}

function LineSegmentsIntersect(
  p1,
  q1, // first line segment points
  p2,
  q2 // second line segment points
) {
  var o1 = PointTripletOrientation(p1, q1, p2);
  var o2 = PointTripletOrientation(p1, q1, q2);
  var o3 = PointTripletOrientation(p1, p2, q2);
  var o4 = PointTripletOrientation(q1, p2, q2);

  var d2 = (q2.x - p1.x) * (q2.x - p1.x) + (q2.y - p1.y) * (q2.y - p1.y);
  if (o1 != o2 && o3 != o4) return true;

  return false; // Doesn't fall in any of the above cases
}

Applet.prototype.FindNodePosition = function (charge) {
  // If this is a virgin charge. Find seed positions.
  if (charge.nodes.length == 0 && charge.nodesNeeded.length == 0) {
    this.SeedNodes(charge, 0);
  }

  // See if there are some precomputed positions to try.
  if (charge.nodesNeeded && charge.nodesNeeded.length > 0) {
    var t = charge.nodesNeeded.shift();
    charge.nodes.push(t);
    return t;
  }

  charge.nodes.sort();
  // bifurcate biggest arc
  var biggest_gap = 0;
  var gap_after = 0;
  for (var i = 0; i < charge.nodes.length; i++) {
    var t1 = charge.nodes[i];
    var t2;
    if (i + 1 < charge.nodes.length) t2 = charge.nodes[i + 1];
    else t2 = charge.nodes[(i + 1) % charge.nodes.length] + TWO_PI; // wrap around
    var dt = Math.abs(t2 - t1);
    // console.log(i,t1,t2,dt);
    if (dt > biggest_gap) {
      gap_after = i;
      biggest_gap = dt;
    }
  }
  var new_node = (charge.nodes[gap_after] + biggest_gap * 0.5) % TWO_PI;
  charge.nodes.push(new_node);
  return new_node;
};

Applet.prototype.FindPositionOfU = function (input, Utarget, Utolerance) {
  // Takes an input object: {E: E{E,U,x,y}, x, y}}
  // Returns a similar output object at the best guess for Utarget.
  // Follows the field line at point input.x,input.y until it converges on the Utarget

  // We know that U = - delE
  // so by newton-raphson method...
  // distance to go along field line = (U1 - Utarget) / E
  var out = input;
  var it = 0;
  while (Math.abs(out.U - Utarget) > Utolerance) {
    it++;
    var delta = (out.U - Utarget) / out.E;
    var x = out.x + delta * out.gx;
    var y = out.y + delta * out.gy;
    if (isNaN(x) || isNaN(y)) debugger;
    out = this.Field(x, y);
  }
  // console.log("converge in ", it, "Accuracy: ",out.E.U - Utarget);
  return out;
};

Applet.prototype.SeedNodes = function (charge, startangle) {
  // // Original algorithm: Space 'needed' nodes around evenly.
  for (var j = 0; j < charge.n_nodes; j++) {
    charge.nodesNeeded.push(
      (startangle + (TWO_PI * j) / charge.n_nodes) % TWO_PI
    );
  }
};

Applet.prototype.DoCollision = function (collide, x, y) {
  // console.warn("collided with charge that has ",collide.nodesNeeded.length,"left ")
  dx = x - collide.x;
  dy = y - collide.y;
  var angle = (Math.atan2(dy, dx) + TWO_PI) % TWO_PI;

  collide.nodes.push(angle);
  collide.nodesUsed.push(angle);

  if (collide.nodesUsed.length == 1) {
    // This is the first line to collide. Seed other positions around this.
    this.SeedNodes(collide, angle);
  }

  var best = 0;
  var bestdiff = 9e9;
  for (var k = 0; k < collide.nodesNeeded.length; k++) {
    var diff = Math.abs((collide.nodesNeeded[k] - angle) % (2 * Math.PI));
    if (diff < bestdiff) {
      bestdiff = diff;
      best = k;
    }
  }
  collide.nodesNeeded.splice(best, 1);
};

Applet.prototype.TraceFieldLine = function (fieldline) {
  console.log(fieldline);
  var x = fieldline.start_x;
  var y = fieldline.start_y;

  fieldline.points = [{ x: x, y: y }];
  var lastE = this.Field(x, y);

  var traceFinished = false;
  var nstep = 0;
  var dist = 0;
  while (true) {
    nstep++;
    var E = this.Field(x, y);
    var h = step * fieldline.dir; // step size.

    // version 1: Euler.
    if (this.estMode == 1) {
      var dx = E.gx * h;
      var dy = E.gy * h;
      x += dx;
      y += dy;
      dist += h;
    } else {
      // if(this.estMode==4)
      // version 2: Runga-kutta 4th order.
      h = h * 0.8; // RK savings mean larger step sizes.
      var E2 = this.Field(x + (E.gx * h) / 2, y + (E.gy * h) / 2);
      var E3 = this.Field(x + (E2.gx * h) / 2, y + (E2.gy * h) / 2);
      var E4 = this.Field(x + E3.gx * h, y + E3.gy * h);
      var dx = ((E.gx + E2.gx * 2 + E3.gx * 2 + E4.gx) * h) / 6;
      var dy = ((E.gy + E2.gy * 2 + E3.gy * 2 + E4.gy) * h) / 6;
      x += dx;
      y += dy;
      dist += Math.sqrt(dx * dx + dy * dy);
      var theta = ((Math.atan2(dy, dx) % (2 * Math.PI)) * 180) / Math.PI; // polar angle direction of RK
      var theta2 =
        ((Math.atan2(E.gy * h, E.gx * h) % (2 * Math.PI)) * 180) / Math.PI; // ditto euler
    }

    if (!fieldline.startCharge || dist > fieldline.startCharge.r) {
      var span = SpansIntegerMultiple(lastE.U, E.U, potential_multiple);
      if (span != null) {
        pnode = { U: span * potential_multiple, E1: lastE, E2: E };
        this.potentialnodes.push(pnode);
      }
    }

    fieldline.points.push({ x: x, y: y });
    lastE = E;

    var collide = this.FindCollision(x, y);
    if (collide && fieldline.dir * collide.q < 0 && nstep > 1) {
      // Find the best possible node for this line.
      if (collide.nodesUsed.length > collide.n_nodes) {
        // Comment these lines out if you want it to just sail through without stopping...
        console.warn(
          "Line failed - hit q=",
          collide,
          "which has no nodes left."
        );
        return false; //nodeFinished=false;
      } else {
        this.DoCollision(collide, x, y);
        fieldline.endCharge = collide;
        fieldline.nstep = nstep;
        console.log("Line succeeded - hit q=", collide.q);
        return true; // nodeFinished
      }
    }

    if (nstep > max_steps) {
      fieldline.endCharge = null;
      fieldline.endAngle = null;
      fieldline.endNodeAngle = null;
      fieldline.nstep = nstep;
      console.log("Line succeeded - no hit");
      return true;
    } // if nstep
  } // trace loop
};

Applet.prototype.FindFieldLines = function () {
  this.fieldLines = [];
  this.potentialnodes = [];
  this.equipotential_lines = [];

  var total_charge = 0;
  var max_x = -1e20;
  var min_x = 1e20;
  var max_y = -1e20;
  var min_y = 1e20;
  var max;
  for (var i = 0; i < this.charges.length; i++) {
    var charge = this.charges[i];
    total_charge += charge.q;
    charge.r = 0.12 * Math.sqrt(Math.abs(charge.q));
    charge.n_nodes = Math.round(
      Math.abs(source_lines_per_unit_charge * charge.q)
    );
    charge.nodes = []; // All successful or unsuccesful nodes
    charge.nodesUsed = []; // Nodes that have actually worked.
    charge.nodesNeeded = []; // Some idea what nodes we should try.
    if (charge.x > max_x) max_x = charge.x;
    if (charge.x < min_x) min_x = charge.x;
    if (charge.y > max_y) max_y = charge.y;
    if (charge.y < min_y) min_y = charge.y;
  }

  // rank them. Use minority charge carriers first: their nodes HAVE to connect.
  this.charges.sort(chargesort);
  if (total_charge < 0) this.charges.reverse();

  console.log("Doing escaping lines -------------- ");
  // Find fieldlines that come from outside the area, assuming there is a majority charge carrier.
  var escaping_lines = Math.abs(total_charge * source_lines_per_unit_charge);
  for (var i = 0; i < escaping_lines; i++) {
    console.log("Doing escaping line.");
    // Find a position very far away from the charges.
    var r = Math.max(this.xmax, this.ymax) * 10;
    if (isNaN(r)) r = 10;
    var theta = (i * 2 * 3.14159) / escaping_lines;
    var x = r * Math.cos(theta);
    var y = r * Math.sin(theta);

    var fieldline = { startCharge: null };
    if (total_charge > 0) fieldline.dir = -1;
    else fieldline.dir = 1;
    fieldline.start_x = x;
    fieldline.start_y = y;
    fieldline.start = "outside";
    var nodeFinished = this.TraceFieldLine(fieldline);
    if (nodeFinished) {
      this.fieldLines.push(fieldline);
    } else {
      console.log("incoming line failed");
    }
  }

  // Now loop through again, finding unused nodes and tracing field lines from those
  // nodes until they either hit another charge or they require too many computational cycles.

  for (var i = 0; i < this.charges.length; i++) {
    var random_seed = 0;
    var charge = this.charges[i];
    // console.log("Find field lines for charge ",i," with charge ",charge.q);
    this.ctx.fillStyle = "blue";
    console.log(
      "Doing charge",
      i,
      "with q=",
      charge.q,
      "which has ",
      charge.nodesUsed.length,
      "/",
      charge.n_nodes,
      " nodes"
    );

    while (
      charge.nodesUsed.length < charge.n_nodes &&
      charge.nodes.length < source_lines_per_unit_charge * 5
    ) {
      if (charge.nodes.length > source_lines_per_unit_charge * 4) {
        console.warn("Wow! Tried way too many nodes.", charge.nodes);
      }
      console.log("Doing node on charge", i, charge, charge.nodesUsed.length);

      var start_angle = this.FindNodePosition(charge);

      var r = charge.r;
      // Boost in initial direction by radius.
      var fieldline = { startCharge: charge };
      fieldline.start = "charge";
      var nodeFinished = false;

      // console.log("Try: ",nodeTries,"Trying angle:",start_angle*180/Math.PI,nodeTries);
      fieldline.start_x = charge.x + charge.r * Math.cos(start_angle);
      fieldline.start_y = charge.y + charge.r * Math.sin(start_angle);
      fieldline.start_angle = start_angle;
      var dir = 1;
      if (charge.q < 0) dir = -1;
      fieldline.dir = dir;

      var nodeFinished = this.TraceFieldLine(fieldline);
      if (nodeFinished) {
        this.fieldLines.push(fieldline);
        charge.nodesUsed.push(start_angle);
      }
    } // nodeFinished
  }

  if (this.do_equipotential) {
    console.log("looking at potentialnodes: ", this.potentialnodes.length);
    this.potentialnodes.sort(function (a, b) {
      return a.U - b.U;
    });
    while (this.potentialnodes.length > 0) {
      var pnode = this.potentialnodes.shift();
      console.log(pnode);
      var Utarget = pnode.U;
      // Fresh node. Approximate the point of best potential.
      // console.log("Trying node, Utarget=",Utarget);

      var E = this.FindPositionOfU(pnode.E1, Utarget, Utolerance);
      console.log("E position of U", E);

      var xstart = E.x;
      var ystart = E.y;
      for (var dir = -1; dir < 3; dir += 2) {
        var line = { U: Utarget, points: [{ x: E.x, y: E.y }] };
        var done = false;

        var np = 0;
        while (!done) {
          np++;
          var newx = 0,
            newy = 0;
          if (this.estMode == 1) {
            var h = step_equi * dir;
            newx = E.x + E.gy * h;
            newy = E.y - E.gx * h;
          } else {
            // if(this.estMode==4)
            // version 2: Runga-kutta 4th order.
            var h = step_equi * 3 * dir; // rk is betterer
            var E2 = this.Field(E.x + (E.gy * h) / 2, E.y - (E.gx * h) / 2);
            var E3 = this.Field(E.x + (E2.gy * h) / 2, E.y - (E2.gx * h) / 2);
            var E4 = this.Field(E.x + E3.gy * h, E.y - E3.gx * h);
            newx = E.x + ((E.gy + E2.gy * 2 + E3.gy * 2 + E4.gy) * h) / 6;
            newy = E.y - ((E.gx + E2.gx * 2 + E3.gx * 2 + E4.gx) * h) / 6;
          }
          var next_point = this.Field(newx, newy);
          for (var i = 0; i < this.potentialnodes.length; i++) {
            var othernode = this.potentialnodes[i];
            if (othernode.U == Utarget) {
              if (
                LineSegmentsIntersect(E, next_point, othernode.E1, othernode.E2)
              ) {
                // console.warn("collide with node!  left:",this.potentialnodes.length);
                this.potentialnodes.splice(i, 1);
                i--; // need to decrement counter after removing.
              }
            } else break; // if list is sorted, should U should match.
          }
          if (
            np > 2 &&
            LineSegmentsIntersect(E, next_point, pnode.E1, pnode.E2)
          ) {
            done = true;
            dir = 3; // exit dir loop
            console.warn("looped equipotential line");
          } else if (np > max_equi_step) {
            console.warn("gave up on equipotential line");
            done = true;
          }
          line.points.push({ x: next_point.x, y: next_point.y });
          E = next_point;
          // console.log(E.U);
        }
        this.equipotential_lines.push(line);
        // console.log("End U",Utarget,"at",E);
      }
      // break;
    }
  }
};

Applet.prototype.TotalEnergy = function () {
  var tot = 0;
  for (var i = 1; i < this.charges.length; i++) {
    for (var j = 0; j < i; j++) {
      // compute potential at this point for all other charges.
      var ci = this.charges[i];
      var cj = this.charges[j];

      var dx = ci.x - cj.x;
      var dy = ci.y - cj.y;
      var r2 = dx * dx + dy * dy;
      var r = Math.sqrt(r2);
      tot += (2 * ci.q * 2 * cj.q) / r; // using 3d pointlike potential
    }
  }
  return tot;
};

Applet.prototype.Draw = function () {
  this.Clear();
  this.ctx.save();

  this.do_equipotential = $("#ctl-do-eqipotential").is(":checked");
  this.canvas_translate = {
    x: this.canvas.width / 2,
    y: this.canvas.height / 2,
  };
  this.canvas_scale = {
    x: this.canvas.width / this.width_x,
    y: -this.canvas.width / this.width_x,
  };

  this.ctx.translate(this.canvas_translate.x, this.canvas_translate.y);
  this.ctx.scale(this.canvas_scale.x, this.canvas_scale.y);
  this.xmin = -this.width_x / 2;
  this.xmax = this.width_x / 2;
  this.ymin = ((-this.width_x / 2) * this.canvas.height) / this.canvas.width;
  this.ymax = ((this.width_x / 2) * this.canvas.height) / this.canvas.width;

  this.ctx.strokeStyle = "#52525B";
  this.ctx.lineWidth = 0.01;
  this.ctx.beginPath();
  this.ctx.moveTo(this.xmin, this.ymin);
  this.ctx.lineTo(this.xmax, this.ymin);
  this.ctx.lineTo(this.xmax, this.ymax);
  this.ctx.lineTo(this.xmin, this.ymax);
  this.ctx.lineTo(this.xmin, this.ymin);
  this.ctx.stroke();
  this.ctx.beginPath();

  var urlparams = "";
  for (var i = 0; i < this.charges.length; i++) {
    if (i == 0) urlparams += "?";
    else urlparams += "&";
    urlparams += "q" + i + "=";
    urlparams +=
      this.charges[i].q +
      "," +
      parseFloat(this.charges[i].x.toFixed(3)) +
      "," +
      parseFloat(this.charges[i].y.toFixed(3));
    if (hide_charge_values) urlparams += "&hideq=1";
    urlparams += "&lines=" + source_lines_per_unit_charge;
  }
  // $("#totalenergy").html("Общая энергия: " + this.TotalEnergy().toFixed(1));
  $("#linktothis").attr("href", urlparams);

  console.time("FindFieldLines");
  console.warn("estmode", this.estMode);
  this.FindFieldLines();
  console.timeEnd("FindFieldLines");

  this.DrawFieldLines();
  this.DrawCharges();
  if (this.do_equipotential) this.DrawEquipotentialLines();

  this.ctx.restore();
};

Applet.prototype.DrawFieldLines = function () {
  console.time("Drawing lines");
  this.ctx.lineWidth = 0.01;
  for (var i = 0; i < this.fieldLines.length; i++) {
    var line = this.fieldLines[i];
    //console.log("Drawing line ",i);
    this.ctx.strokeStyle = "#3F3F46";
    this.ctx.beginPath();
    this.ctx.lineJoin = "round";
    this.ctx.moveTo(line.start_x, line.start_y);
    for (var j = 1; j < line.points.length; j++) {
      var p = line.points[j];
      this.ctx.lineTo(p.x, p.y);
    }
    this.ctx.stroke();

    var n = line.points.length;
    // Add arrow. Find the midway point along the line.
    var j = Math.round((n - 1) / 2);
    // console.log(j,line.points.length);
    var x = line.points[j].x;
    var y = line.points[j].y;
    // Ensure arrow is on the screen - keep halving the midway point until we reach it.
    while (x < this.xmin || x > this.xmax || y < this.ymin || y > this.ymax) {
      if (line.start == "outside") j = Math.round(n - (n - j) / 2);
      else j = Math.round(j / 2);
      x = line.points[j].x;
      y = line.points[j].y;
      //console.log(j);
      if (j <= 1 || j >= n - 3) break;
    }
    dx = line.dir * (line.points[j + 1].x - x);
    dy = line.dir * (line.points[j + 1].y - y);
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.fillStyle = "black";
    var angle = (Math.atan2(dy, dx) + TWO_PI) % TWO_PI;
    this.ctx.rotate(angle);
    var lx = 0.1;
    var ly = 0.05;
    this.ctx.beginPath();
    this.ctx.moveTo(-lx, ly);
    this.ctx.lineTo(0, 0);
    this.ctx.lineTo(-lx, -ly);
    // this.ctx.lineTo(0,ly);
    this.ctx.stroke();
    this.ctx.restore();
  }
  console.timeEnd("Drawing lines");
};

Applet.prototype.DrawEquipotentialLines = function () {
  console.time("Drawing potential lines");

  for (var i = 0; i < this.equipotential_lines.length; i++) {
    var line = this.equipotential_lines[i];
    this.ctx.beginPath();
    this.ctx.lineWidth = 0.02;
    this.ctx.strokeStyle = "#7828C8";
    this.ctx.lineJoin = "round";
    this.ctx.moveTo(line.points[0].x, line.points[0].y);
    for (var j = 1; j < line.points.length; j++) {
      var p = line.points[j];
      this.ctx.lineTo(p.x, p.y);
    }
    this.ctx.stroke();

    this.ctx.strokeStyle = "#52525B";
    this.ctx.lineWidth = 0.01;
  }
  console.timeEnd("Drawing potential lines");
};

Applet.prototype.DrawCharges = function () {
  // Draw charges. Do this last so line tails are covered.
  for (var i = 0; i < this.charges.length; i++) {
    var charge = this.charges[i];
    this.ctx.fillStyle = "rgb(37 99 235)";
    if (charge.q > 0) this.ctx.fillStyle = "rgb(220 38 38)";
    if (charge.highlight) this.ctx.lineWidth = 0.03;
    else this.ctx.lineWidth = 0.01;
    var x = charge.x;
    var y = charge.y;
    var r = charge.r;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.save();
    this.ctx.translate(charge.x, charge.y);
    this.ctx.scale(0.01, -0.01);
    this.ctx.fillStyle = "white";
    this.ctx.strokeStyle = "white";
    this.ctx.textBaseline = "middle";
    this.ctx.textAlign = "center";
    this.ctx.font = "12pt sans-serif";
    var s;
    if (charge.q < 0) s = "-";
    else s = "+";
    s += parseInt(Math.abs(charge.q));
    if (!hide_charge_values)
      // protect against old browsers
      this.ctx.fillText(s, 0, 0);
    this.ctx.restore();
  }
};

function getAbsolutePosition(element) {
  var r = { x: element.offsetLeft, y: element.offsetTop };
  if (element.offsetParent) {
    var tmp = getAbsolutePosition(element.offsetParent);
    r.x += tmp.x;
    r.y += tmp.y;
  }
  return r;
}

Applet.prototype.GetEventXY = function (ev) {
  var offset = getAbsolutePosition(this.canvas);
  var x = ev.pageX;
  var y = ev.pageY;

  if (
    ev.type == "touchstart" ||
    ev.type == "touchmove" ||
    ev.type == "touchend"
  ) {
    ev.preventDefault();
    x = ev.originalEvent.touches[0].pageX;
    y = ev.originalEvent.touches[0].pageY;
  }
  x = x - offset.x;
  y = y - offset.y;
  x -= this.canvas_translate.x;
  y -= this.canvas_translate.y;
  x /= this.canvas_scale.x;
  y /= this.canvas_scale.y;
  return { x: x, y: y };
};

Applet.prototype.DoMouse = function (ev) {
  var xy = this.GetEventXY(ev);
  var x = xy.x;
  var y = xy.y;

  // console.log(ev.type,x,y);

  var update = false;

  if (ev.type === "mousedown" || ev.type === "touchstart") {
    // See if we're clicking a charge.
    var charge = this.FindCollision(x, y);
    if (charge) {
      this.dragging = true;
      this.charge_dragged = charge;
      charge.highlight = true;
      update = true;
    }
  }
  if (ev.type === "mousemove" || ev.type === "touchmove") {
    if (this.dragging) {
      this.charge_dragged.x = x;
      this.charge_dragged.y = y;
      update = true;
    }
  }
  if (ev.type === "mouseup" || ev.type === "touchend") {
    if (this.charge_dragged) this.charge_dragged.highlight = false;
    this.charge_dragged = null;
    this.dragging = false;
    update = true;
  }

  if (ev.type === "mouseout") {
    if (this.charge_dragged) {
      // find it in the list.
      var which = 0;
      for (var i = 0; i < this.charges.length; i++)
        if (this.charge_dragged == this.charges[i]) which = i;
      this.charges.splice(which, 1);
      this.charge_dragged = false;
      this.dragging = false;
      update = true;
    }
  }

  if (update) this.Draw();
};

Applet.prototype.AddCharge = function (ev) {
  console.log("AddCharge", ev);
  var q = parseFloat(ev.currentTarget.getAttribute("q"));
  var xy = this.GetEventXY(ev);
  var x = xy.x;
  var y = xy.y;

  var charge = { q: q, x: x, y: y, r: 0.12 * Math.sqrt(Math.abs(q)) };
  this.charges.push(charge);

  this.dragging = true;
  this.charge_dragged = charge;
  charge.highlight = true;
  update = true;

  this.Draw();
};

Applet.prototype.AddChargeRandom = function (ev) {
  console.log(ev);
  var q = parseFloat(ev.currentTarget.getAttribute("q"));
  console.log(q);
  this.xmin = -this.width_x / 2;
  this.xmax = this.width_x / 2;
  this.ymin = ((-this.width_x / 2) * this.canvas.height) / this.canvas.width;
  this.ymax = ((this.width_x / 2) * this.canvas.height) / this.canvas.width;
  var x = ((Math.random() * 1.8 - 0.9) * (this.xmax - this.xmin)) / 2;
  var y = ((Math.random() * 1.8 - 0.9) * (this.ymax - this.ymin)) / 2;
  this.charges.push({
    q: q,
    x: x,
    y: y,
    r: 0.12 * Math.abs(q),
  });

  this.Draw();
};
