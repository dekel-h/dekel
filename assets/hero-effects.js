/* Hero background effects — vanilla ports of React Bits' hero layers.
   ColorBends: WebGL color-blend shader (raw WebGL, no three.js).
   DotField:   canvas dot grid with cursor bulge + SVG cursor glow.
   Layered: ColorBends underneath (.hero-bends), DotField on top
   (.hero-dots). Both pause when the hero is offscreen and render a
   single static frame under prefers-reduced-motion. */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  var bendsHost = document.querySelector('.hero-bends');
  var dotsHost = document.querySelector('.hero-dots');
  if (!hero || !bendsHost || !dotsHost) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* ==========================================================
     ColorBends — props from the React Bits homepage hero demo
  ========================================================== */
  var CB = {
    colors: ['#6366F1'],
    rotation: 90,
    speed: 0.2,
    frequency: 1.0,
    noise: 0.15,
    bandWidth: 0.14,
    iterations: 1,
    intensity: 1.3,
    transparent: true,
    autoRotate: 0,
    scale: 1,
    warpStrength: 1,
    mouseInfluence: 1,
    parallax: 0.5,
    pointerSmooth: 8
  };

  var MAX_COLORS = 8;

  var VERT = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = aPos * 0.5 + 0.5;',
    '  gl_Position = vec4(aPos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    '#define MAX_COLORS ' + MAX_COLORS,
    'uniform vec2 uCanvas;',
    'uniform float uTime;',
    'uniform float uSpeed;',
    'uniform vec2 uRot;',
    'uniform int uColorCount;',
    'uniform vec3 uColors[MAX_COLORS];',
    'uniform int uTransparent;',
    'uniform float uScale;',
    'uniform float uFrequency;',
    'uniform float uWarpStrength;',
    'uniform vec2 uPointer;',
    'uniform float uMouseInfluence;',
    'uniform float uParallax;',
    'uniform float uNoise;',
    'uniform int uIterations;',
    'uniform float uIntensity;',
    'uniform float uBandWidth;',
    'varying vec2 vUv;',
    '',
    'void main() {',
    '  float t = uTime * uSpeed;',
    '  vec2 p = vUv * 2.0 - 1.0;',
    '  p += uPointer * uParallax * 0.1;',
    '  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);',
    '  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);',
    '  q /= max(uScale, 0.0001);',
    '  q /= 0.5 + 0.2 * dot(q, q);',
    '  q += 0.2 * cos(t) - 7.56;',
    '  vec2 toward = (uPointer - rp);',
    '  q += toward * uMouseInfluence * 0.2;',
    '',
    '  for (int j = 0; j < 5; j++) {',
    '    if (j >= uIterations - 1) break;',
    '    vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));',
    '    q += (rr - q) * 0.15;',
    '  }',
    '',
    '  vec3 col = vec3(0.0);',
    '  float a = 1.0;',
    '',
    '  if (uColorCount > 0) {',
    '    vec2 s = q;',
    '    vec3 sumCol = vec3(0.0);',
    '    float cover = 0.0;',
    '    for (int i = 0; i < MAX_COLORS; ++i) {',
    '      if (i >= uColorCount) break;',
    '      s -= 0.01;',
    '      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));',
    '      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);',
    '      float kBelow = clamp(uWarpStrength, 0.0, 1.0);',
    '      float kMix = pow(kBelow, 0.3);',
    '      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);',
    '      vec2 disp = (r - s) * kBelow;',
    '      vec2 warped = s + disp * gain;',
    '      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);',
    '      float m = mix(m0, m1, kMix);',
    '      float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));',
    '      sumCol += uColors[i] * w;',
    '      cover = max(cover, w);',
    '    }',
    '    col = clamp(sumCol, 0.0, 1.0);',
    '    a = uTransparent > 0 ? cover : 1.0;',
    '  } else {',
    '    vec2 s = q;',
    '    for (int k = 0; k < 3; ++k) {',
    '      s -= 0.01;',
    '      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));',
    '      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);',
    '      float kBelow = clamp(uWarpStrength, 0.0, 1.0);',
    '      float kMix = pow(kBelow, 0.3);',
    '      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);',
    '      vec2 disp = (r - s) * kBelow;',
    '      vec2 warped = s + disp * gain;',
    '      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);',
    '      float m = mix(m0, m1, kMix);',
    '      float v = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));',
    '      if (k == 0) col.r = v;',
    '      if (k == 1) col.g = v;',
    '      if (k == 2) col.b = v;',
    '    }',
    '    a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;',
    '  }',
    '',
    '  col *= uIntensity;',
    '',
    '  if (uNoise > 0.0001) {',
    '    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);',
    '    col += (n - 0.5) * uNoise;',
    '    col = clamp(col, 0.0, 1.0);',
    '  }',
    '',
    '  vec3 rgb = (uTransparent > 0) ? col * a : col;',
    '  gl_FragColor = vec4(rgb, a);',
    '}'
  ].join('\n');

  function hexToRgb(hex) {
    var h = hex.replace('#', '').trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    ];
  }

  function createColorBends() {
    var canvas = document.createElement('canvas');
    bendsHost.appendChild(canvas);
    var gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance'
    });
    if (!gl) { bendsHost.removeChild(canvas); return null; }

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { bendsHost.removeChild(canvas); return null; }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      bendsHost.removeChild(canvas);
      return null;
    }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uCanvas', 'uTime', 'uSpeed', 'uRot', 'uColorCount', 'uColors', 'uTransparent',
     'uScale', 'uFrequency', 'uWarpStrength', 'uPointer', 'uMouseInfluence',
     'uParallax', 'uNoise', 'uIterations', 'uIntensity', 'uBandWidth'
    ].forEach(function (name) { U[name] = gl.getUniformLocation(prog, name); });

    var colorData = new Float32Array(MAX_COLORS * 3);
    CB.colors.slice(0, MAX_COLORS).forEach(function (hex, i) {
      var rgb = hexToRgb(hex);
      colorData[i * 3] = rgb[0];
      colorData[i * 3 + 1] = rgb[1];
      colorData[i * 3 + 2] = rgb[2];
    });

    gl.uniform3fv(U.uColors, colorData);
    gl.uniform1i(U.uColorCount, Math.min(CB.colors.length, MAX_COLORS));
    gl.uniform1i(U.uTransparent, CB.transparent ? 1 : 0);
    gl.uniform1f(U.uSpeed, CB.speed);
    gl.uniform1f(U.uScale, CB.scale);
    gl.uniform1f(U.uFrequency, CB.frequency);
    gl.uniform1f(U.uWarpStrength, CB.warpStrength);
    gl.uniform1f(U.uMouseInfluence, CB.mouseInfluence);
    gl.uniform1f(U.uParallax, CB.parallax);
    gl.uniform1f(U.uNoise, CB.noise);
    gl.uniform1i(U.uIterations, CB.iterations);
    gl.uniform1f(U.uIntensity, CB.intensity);
    gl.uniform1f(U.uBandWidth, CB.bandWidth);

    gl.clearColor(0, 0, 0, 0);

    var pointerTarget = { x: 0, y: 0 };
    var pointerCurrent = { x: 0, y: 0 };

    hero.addEventListener('pointermove', function (e) {
      var rect = hero.getBoundingClientRect();
      pointerTarget.x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
      pointerTarget.y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
    }, { passive: true });

    function resize() {
      var w = bendsHost.clientWidth || 1;
      var h = bendsHost.clientHeight || 1;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uCanvas, w, h);
    }
    resize();

    function render(elapsed, dt) {
      var deg = (CB.rotation % 360) + CB.autoRotate * elapsed;
      var rad = (deg * Math.PI) / 180;
      gl.uniform2f(U.uRot, Math.cos(rad), Math.sin(rad));

      var amt = Math.min(1, dt * CB.pointerSmooth);
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * amt;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * amt;
      gl.uniform2f(U.uPointer, pointerCurrent.x, pointerCurrent.y);

      gl.uniform1f(U.uTime, elapsed);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    return { render: render, resize: resize };
  }

  /* ==========================================================
     DotField — props from the React Bits homepage hero demo
  ========================================================== */
  var DF = {
    dotRadius: 1.5,
    dotSpacing: 14,
    cursorRadius: 500,
    cursorForce: 0.10,
    bulgeOnly: true,
    bulgeStrength: 67,
    glowRadius: 160,
    sparkle: false,
    waveAmplitude: 0,
    gradientFrom: 'rgba(255,255,255,0.18)',
    gradientTo: 'rgba(255,255,255,0.08)',
    glowColor: '#110F18'
  };

  var TWO_PI = Math.PI * 2;

  function createDotField() {
    var canvas = document.createElement('canvas');
    dotsHost.appendChild(canvas);
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) { dotsHost.removeChild(canvas); return null; }

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var glowId = 'dot-field-glow-' + Math.random().toString(36).slice(2, 9);
    var svg = document.createElementNS(SVG_NS, 'svg');
    var defs = document.createElementNS(SVG_NS, 'defs');
    var grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', glowId);
    var stop0 = document.createElementNS(SVG_NS, 'stop');
    stop0.setAttribute('offset', '0%');
    stop0.setAttribute('stop-color', DF.glowColor);
    var stop1 = document.createElementNS(SVG_NS, 'stop');
    stop1.setAttribute('offset', '100%');
    stop1.setAttribute('stop-color', 'transparent');
    grad.appendChild(stop0);
    grad.appendChild(stop1);
    defs.appendChild(grad);
    svg.appendChild(defs);
    var glowEl = document.createElementNS(SVG_NS, 'circle');
    glowEl.setAttribute('cx', '-9999');
    glowEl.setAttribute('cy', '-9999');
    glowEl.setAttribute('r', DF.glowRadius);
    glowEl.setAttribute('fill', 'url(#' + glowId + ')');
    glowEl.style.opacity = '0';
    glowEl.style.willChange = 'opacity';
    svg.appendChild(glowEl);
    dotsHost.appendChild(svg);

    var dots = [];
    var size = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
    var mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    var glowOpacity = 0;
    var engagement = 0;
    var frameCount = 0;

    function buildDots(w, h) {
      var step = DF.dotRadius + DF.dotSpacing;
      var cols = Math.floor(w / step);
      var rows = Math.floor(h / step);
      var padX = (w % step) / 2;
      var padY = (h % step) / 2;
      dots = new Array(rows * cols);
      var idx = 0;
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          var ax = padX + col * step + step / 2;
          var ay = padY + row * step + step / 2;
          dots[idx++] = { ax: ax, ay: ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
        }
      }
    }

    function resize() {
      var rect = dotsHost.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      size = { w: w, h: h, offsetX: rect.left + window.scrollX, offsetY: rect.top + window.scrollY };
      buildDots(w, h);
    }
    resize();

    window.addEventListener('mousemove', function (e) {
      mouse.x = e.pageX - size.offsetX;
      mouse.y = e.pageY - size.offsetY;
    }, { passive: true });

    var speedInterval = setInterval(function () {
      var dx = mouse.prevX - mouse.x;
      var dy = mouse.prevY - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (dist - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    }, 20);

    function render() {
      frameCount++;
      var w = size.w;
      var h = size.h;
      var len = dots.length;
      var t = frameCount * 0.02;

      var targetEngagement = Math.min(mouse.speed / 5, 1);
      engagement += (targetEngagement - engagement) * 0.06;
      if (engagement < 0.001) engagement = 0;
      glowOpacity += (engagement - glowOpacity) * 0.08;

      glowEl.setAttribute('cx', mouse.x);
      glowEl.setAttribute('cy', mouse.y);
      glowEl.style.opacity = glowOpacity;

      ctx.clearRect(0, 0, w, h);

      var grd = ctx.createLinearGradient(0, 0, w, h);
      grd.addColorStop(0, DF.gradientFrom);
      grd.addColorStop(1, DF.gradientTo);
      ctx.fillStyle = grd;

      var cr = DF.cursorRadius;
      var crSq = cr * cr;
      var rad = DF.dotRadius / 2;
      var isBulge = DF.bulgeOnly;

      ctx.beginPath();

      for (var i = 0; i < len; i++) {
        var d = dots[i];
        var dx = mouse.x - d.ax;
        var dy = mouse.y - d.ay;
        var distSq = dx * dx + dy * dy;

        if (distSq < crSq && engagement > 0.01) {
          var dist = Math.sqrt(distSq);
          if (isBulge) {
            var tt = 1 - dist / cr;
            var push = tt * tt * DF.bulgeStrength * engagement;
            var angle = Math.atan2(dy, dx);
            d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
            d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
          } else {
            var angle2 = Math.atan2(dy, dx);
            var move = (500 / dist) * (mouse.speed * DF.cursorForce);
            d.vx += Math.cos(angle2) * -move;
            d.vy += Math.sin(angle2) * -move;
          }
        } else if (isBulge) {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }

        if (!isBulge) {
          d.vx *= 0.9;
          d.vy *= 0.9;
          d.x = d.ax + d.vx;
          d.y = d.ay + d.vy;
          d.sx += (d.x - d.sx) * 0.1;
          d.sy += (d.y - d.sy) * 0.1;
        }

        var drawX = d.sx;
        var drawY = d.sy;
        if (DF.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + t) * DF.waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + t * 0.7) * DF.waveAmplitude * 0.5;
        }

        if (DF.sparkle) {
          var hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
          if ((hash % 100) < 3) {
            ctx.moveTo(drawX + rad * 1.8, drawY);
            ctx.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
          } else {
            ctx.moveTo(drawX + rad, drawY);
            ctx.arc(drawX, drawY, rad, 0, TWO_PI);
          }
        } else {
          ctx.moveTo(drawX + rad, drawY);
          ctx.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      }

      ctx.fill();
    }

    return {
      render: render,
      resize: resize,
      destroy: function () { clearInterval(speedInterval); }
    };
  }

  /* ==========================================================
     Boot: shared loop, offscreen pause, reduced-motion static
  ========================================================== */
  var bends = createColorBends();
  var dotField = createDotField();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (bends) bends.resize();
      if (dotField) dotField.resize();
      if (reduceMotion) renderOnce();
    }, 100);
  });

  function renderOnce() {
    if (bends) bends.render(0, 0);
    if (dotField) dotField.render();
  }

  if (reduceMotion) {
    renderOnce();
    return;
  }

  var rafId = null;
  var running = false;
  var start = performance.now();
  var last = start;

  function loop(now) {
    var elapsed = (now - start) / 1000;
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (bends) bends.render(elapsed, dt);
    if (dotField) dotField.render();
    rafId = requestAnimationFrame(loop);
  }

  function setRunning(on) {
    if (on && !running) {
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    } else if (!on && running) {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      setRunning(entries[0].isIntersecting);
    }).observe(hero);
  } else {
    setRunning(true);
  }
})();
