// 부드러운 스크롤 (Lenis) — quangdinh.im 참고: 관성 있는 무게감·속도감
var lenis = null;
if (window.Lenis) {
  lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true,
    wheelMultiplier: 1
  });
  requestAnimationFrame(function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  });
}

// 페이지 진입 전환: 노란 점이 글리치와 함께 잠깐 스쳤다 사라진다
// 홈은 배경에 점이 이미 있으므로, 새 점을 띄우지 않고 그 점들이 등장할 때 같은 글리치를 입힌다
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var DUR_G = 900;

  var heroImage = document.querySelector('.hero-image');
  if (heroImage) {
    heroImage.style.animation = 'enter-jitter ' + DUR_G + 'ms steps(1, end) both';

    heroImage.querySelectorAll('.dot').forEach(function (dot) {
      // 기존 drift 값을 살린 채 flicker를 두 번째 애니메이션으로 얹는다
      var cs = getComputedStyle(dot);
      var driftDur = cs.animationDuration;
      var driftDelay = cs.animationDelay;
      var flickerDelay = (Math.random() * 200).toFixed(0) + 'ms';

      dot.style.animationName = 'drift, enter-flicker';
      dot.style.animationDuration = driftDur + ', ' + DUR_G + 'ms';
      dot.style.animationDelay = driftDelay + ', ' + flickerDelay;
      dot.style.animationTimingFunction = 'ease-in-out, steps(1, end)';
      dot.style.animationIterationCount = 'infinite, 1';
      dot.style.animationDirection = 'alternate, normal';
      // forwards: 시작 전에는 원래대로 보이게 둔다 (탭이 비활성이라 애니메이션이
      // 시작되지 않아도 배경 점이 사라지지 않도록)
      dot.style.animationFillMode = 'none, forwards';
    });
    return;
  }

  var COUNT = 30;
  var DUR = 900;      // 전환 길이(ms)
  var DRIFT = 8;      // 제자리에서 흐르는 총 거리(px)
  var CLUSTERS = 3;
  var CLUMP = 0.7;    // 무리에 속하는 점의 비율 — 나머지는 화면 전체에 흩뿌림

  function rand(a, b) { return a + Math.random() * (b - a); }
  function bell() { return ((Math.random() + Math.random() + Math.random()) / 3) * 2 - 1; }

  var layer = document.createElement('div');
  layer.className = 'enter-dots';
  layer.setAttribute('aria-hidden', 'true');

  var clusters = [];
  for (var c = 0; c < CLUSTERS; c++) clusters.push({ x: rand(8, 92), y: rand(8, 92) });

  var spreadX = 26 - CLUMP * 18;
  var spreadY = 30 - CLUMP * 20;

  for (var i = 0; i < COUNT; i++) {
    var g = document.createElement('span');
    g.className = 'g';
    var d = document.createElement('span');
    d.className = 'd';
    g.appendChild(d);

    // 뭉치는 자리와 성긴 자리를 만들어 밀도 대비를 준다
    if (Math.random() < CLUMP) {
      var cl = clusters[Math.floor(Math.random() * clusters.length)];
      g.style.left = Math.max(-3, Math.min(99, cl.x + bell() * spreadX)) + 'vw';
      g.style.top = Math.max(-3, Math.min(99, cl.y + bell() * spreadY)) + 'vh';
    } else {
      g.style.left = rand(-3, 99) + 'vw';
      g.style.top = rand(-3, 99) + 'vh';
    }

    // 점마다 제각기 다른 방향으로
    var ang = rand(0, Math.PI * 2);
    var dx = Math.cos(ang) * (DRIFT / 2);
    var dy = Math.sin(ang) * (DRIFT / 2);
    d.style.setProperty('--fx', dx.toFixed(2) + 'px');
    d.style.setProperty('--fy', dy.toFixed(2) + 'px');
    d.style.setProperty('--tx', (-dx).toFixed(2) + 'px');
    d.style.setProperty('--ty', (-dy).toFixed(2) + 'px');

    var delay = rand(0, 200) + 'ms';
    d.style.animation = 'enter-drift ' + DUR + 'ms cubic-bezier(.33,0,.2,1) both';
    d.style.animationDelay = delay;
    g.style.animation = 'enter-glitch ' + DUR + 'ms steps(1, end) both';
    g.style.animationDelay = delay;

    layer.appendChild(g);
  }

  document.body.appendChild(layer);
  setTimeout(function () { layer.remove(); }, DUR + 320);
})();

// 커서: 노란 원을 실제 요소로 그려 포인터를 따라가게 한다
// (마우스가 있는 환경에서만 — 터치 기기는 기본 동작 유지)
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  var cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);
  document.documentElement.classList.add('custom-cursor');

  // pointermove로 듣는다 — 점을 잡을 때 pointerdown 기본 동작을 막으면 mousemove가 끊기기 때문
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    cursorDot.style.transform = 'translate3d(' + e.clientX + 'px, ' + e.clientY + 'px, 0)';
    cursorDot.classList.add('on');
  });

  document.addEventListener('mouseleave', function () {
    cursorDot.classList.remove('on');
  });
}

// 배경 점 잡아 옮기기 — 마우스 환경에서만
// 배경 레이어는 클릭을 받지 않으므로(콘텐츠 가림 방지) 포인터 위치로 어느 점 위인지 직접 판정한다.
// 잡으면 떠다니기(drift)를 멈추고 따라오게 하고, 놓으면 관성으로 미끄러진 뒤 그 자리에서 다시 떠다닌다.
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var layer = document.querySelector('.hero-image');
  if (!layer) return;
  var dots = Array.prototype.slice.call(layer.querySelectorAll('.dot'));
  if (!dots.length) return;

  var cursor = document.querySelector('.cursor-dot');
  var SLOP = 4;          // 점 가장자리 바깥 여유(px)
  var FRICTION = 0.94;   // 프레임당 속도 감쇠
  var BOUNCE = 0.55;     // 화면 가장자리에 부딪힐 때 되튀는 비율

  // 놓은 뒤 drift를 다시 걸 때 쓸 주기를 미리 기억해 둔다 (animation을 none으로 지우면 사라지므로)
  dots.forEach(function (d) {
    d.dataset.drift = getComputedStyle(d).animationDuration.split(',')[0].trim() || '10s';
  });

  var held = null, offX = 0, offY = 0;
  var x = 0, y = 0, px = 0, py = 0, vx = 0, vy = 0, lastT = 0;
  var glide = 0;

  function dotAt(cx, cy) {
    for (var i = dots.length - 1; i >= 0; i--) {
      var r = dots[i].getBoundingClientRect();
      var rad = r.width / 2 + SLOP;
      var dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      if (dx * dx + dy * dy <= rad * rad) return dots[i];
    }
    return null;
  }

  // 링크·버튼·카드 위에서는 그 요소의 클릭이 우선
  function overInteractive(el) {
    return !!(el && el.closest && el.closest('a, button, input, textarea, select, label, [role="button"], .project-card, .nav'));
  }

  function place(d, nx, ny) {
    d.style.left = nx + 'px';
    d.style.top = ny + 'px';
  }

  function resumeDrift(d) {
    d.classList.remove('held');
    d.style.animation = 'drift ' + d.dataset.drift + ' ease-in-out 0s infinite alternate';
  }

  // 호버: 점 위에 오면 커서 링이 살짝 커진다
  var hoverPending = false;
  document.addEventListener('pointermove', function (e) {
    if (held || hoverPending || !cursor || e.pointerType !== 'mouse') return;
    hoverPending = true;
    requestAnimationFrame(function () {
      hoverPending = false;
      var on = !overInteractive(e.target) && !!dotAt(e.clientX, e.clientY);
      cursor.classList.toggle('grab', on);
    });
  });

  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || held || overInteractive(e.target)) return;
    var d = dotAt(e.clientX, e.clientY);
    if (!d) return;
    e.preventDefault();
    if (glide) { cancelAnimationFrame(glide); glide = 0; }

    // 지금 보이는 자리(애니메이션 포함)를 그대로 고정하고 떠다니기를 멈춘다
    var r = d.getBoundingClientRect();
    d.style.animation = 'none';
    d.style.transform = 'none';
    place(d, r.left, r.top);
    layer.appendChild(d);                   // 다른 점 위로 올라오게
    d.classList.add('held');
    document.documentElement.classList.add('dragging-dot');
    if (cursor) cursor.classList.add('grab');

    held = d;
    offX = e.clientX - r.left;
    offY = e.clientY - r.top;
    x = px = r.left; y = py = r.top;
    vx = vy = 0;
    lastT = e.timeStamp;
  });

  document.addEventListener('pointermove', function (e) {
    if (!held) return;
    var t = e.timeStamp, dt = Math.max(1, t - lastT);
    px = x; py = y;
    x = e.clientX - offX;
    y = e.clientY - offY;
    vx = (x - px) / dt;                     // px/ms
    vy = (y - py) / dt;
    lastT = t;
    place(held, x, y);
  });

  function release() {
    if (!held) return;
    var d = held;
    held = null;
    document.documentElement.classList.remove('dragging-dot');
    if (cursor) cursor.classList.remove('grab');

    // 던진 속도로 미끄러지다 멈추면 그 자리에서 다시 떠다닌다
    var size = d.getBoundingClientRect().width;
    var prev = performance.now();
    function step(now) {
      var dt = Math.min(32, now - prev); prev = now;
      x += vx * dt; y += vy * dt;
      var maxX = window.innerWidth - size, maxY = window.innerHeight - size;
      if (x < 0) { x = 0; vx = -vx * BOUNCE; }
      if (x > maxX) { x = maxX; vx = -vx * BOUNCE; }
      if (y < 0) { y = 0; vy = -vy * BOUNCE; }
      if (y > maxY) { y = maxY; vy = -vy * BOUNCE; }
      vx *= FRICTION; vy *= FRICTION;
      place(d, x, y);
      if (Math.abs(vx) > 0.02 || Math.abs(vy) > 0.02) {
        glide = requestAnimationFrame(step);
      } else {
        glide = 0;
        resumeDrift(d);
      }
    }
    glide = requestAnimationFrame(step);
  }

  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);
  window.addEventListener('blur', release);
})();

// 햄버거 메뉴 토글 — hidden 대신 클래스로 여닫아야 높이 전환이 걸린다
(function () {
  var navicon = document.querySelector('.navicon');
  var panel = document.getElementById('nav-index');
  if (!navicon || !panel) return;

  // 스크립트가 없을 때를 위해 HTML에는 hidden을 두고, 여기서 걷어낸다
  panel.removeAttribute('hidden');
  panel.inert = true;
  navicon.setAttribute('aria-expanded', 'false');

  // 컬럼을 차례로 펼치기 위해 항목마다 시작 시각(--d)을 누적해서 심는다.
  // About이 한 줄씩 다 나온 다음 Project Type, 그다음 Year 순.
  var STEP = 0.05;   // 항목 사이 간격(초)
  var GAP = 0.08;    // 컬럼과 컬럼 사이 쉼(초)
  var base = 0;

  panel.querySelectorAll('.index-group').forEach(function (group) {
    var items = group.querySelectorAll('.group-label, .group-links a');
    items.forEach(function (el, i) {
      el.style.setProperty('--d', (base + i * STEP).toFixed(2) + 's');
    });
    base += items.length * STEP + GAP;
  });

  var openedAt = 0, openedY = 0;
  function setOpen(open) {
    panel.classList.toggle('open', open);
    navicon.setAttribute('aria-expanded', String(open));
    panel.inert = !open;   // 닫혔을 때 메뉴 링크로 탭 이동되지 않도록
    if (open) { openedAt = Date.now(); openedY = window.scrollY; }
  }

  navicon.addEventListener('click', function () {
    setOpen(!panel.classList.contains('open'));
  });

  // 열어둔 채 스크롤하면 닫는다 — 스크롤은 "내용을 보겟다"는 신호.
  // 여는 클릭 직후(300ms)와 살짝 건드린 정도(40px 미만)는 무시하고, 닫힘은 평소보다 빠르게(quick) 접는다.
  var SCROLL_CLOSE_DELAY = 300, SCROLL_CLOSE_DIST = 40;
  function closeOnScroll() {
    if (!panel.classList.contains('open')) return;
    if (Date.now() - openedAt < SCROLL_CLOSE_DELAY) return;
    if (Math.abs(window.scrollY - openedY) < SCROLL_CLOSE_DIST) return;
    panel.classList.add('quick');
    setOpen(false);
    var done = function (e) {
      if (e.target !== panel) return;
      panel.classList.remove('quick');
      panel.removeEventListener('transitionend', done);
    };
    panel.addEventListener('transitionend', done);
  }
  window.addEventListener('scroll', closeOnScroll, { passive: true });
  if (lenis) lenis.on('scroll', closeOnScroll);
})();

// Contact 모달: 어디서든 Contact를 누르면 연락처 정보 표시
var overlay = document.createElement('div');
overlay.className = 'contact-overlay';
overlay.hidden = true;
overlay.innerHTML =
  '<div class="contact-modal">' +
  '<button class="contact-close" aria-label="Close">×</button>' +
  '<p class="contact-title">Contact</p>' +
  '<dl class="credits">' +
  '<dt>Email</dt><dd><a href="mailto:yejin0502@gmail.com">yejin0502@gmail.com</a></dd>' +
  '<dt>LinkedIn</dt><dd><a href="https://www.linkedin.com/in/yejinlee0502/">linkedin.com/in/yejinlee0502</a></dd>' +
  '<dt>Instagram</dt><dd><a href="https://www.instagram.com/ee_owol/">@ee_owol</a></dd>' +
  '<dt>GitHub</dt><dd><a href="https://github.com/leeyejin52">github.com/leeyejin52</a></dd>' +
  '</dl></div>';
document.body.appendChild(overlay);

document.querySelectorAll('a').forEach(function (a) {
  if (a.textContent.trim() === 'Contact') {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      overlay.hidden = false;
    });
  }
});

overlay.addEventListener('click', function (e) {
  if (e.target === overlay || e.target.classList.contains('contact-close')) overlay.hidden = true;
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') overlay.hidden = true;
});

/* ============================================================
   콘텐츠 렌더링 — 모든 프로젝트 정보는 data/projects.json 한 파일이 정본.
   Pages CMS에서 그 파일을 수정하면 홈·리스트·상세가 함께 바뀐다.
   ============================================================ */

// 페이지가 저장소 루트인지 /projects/ 안인지에 따라 경로 접두어 결정
var ROOT = location.pathname.indexOf('/projects/') !== -1 ? '../' : '';

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function thumbHTML(p) {
  if (p.thumbnail) {
    return '<img class="thumb" src="' + esc(ROOT + p.thumbnail) + '" alt="' + esc(p.title) + '">';
  }
  return '<div class="thumb"></div>';
}

function detailURL(p) {
  return ROOT + 'projects/detail.html?id=' + p.id;
}

// 홈 쇼케이스 — brand.squarespace.com/campaign 의 인트로를 따른다.
// 1단계(1.3화면): 첫 프로젝트 한 장이 화면을 꽉 채운 채 작아져 가운데 타일이 된다.
// 2단계(1.5화면): 그 타일이 왼쪽으로 가고 나머지가 오른쪽에서 들어와 한 줄이 된다.
// 3단계(줄이 화면보다 길 때만): 계속 스크롤하면 줄이 왼쪽으로 흐른다. 모두 스크롤 위치에 묶여 있다(되감기 가능).
function renderShowcase(section, projects) {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sticky = section.querySelector('.showcase-sticky');
  var n = projects.length;
  if (!n) return;

  var GAP_RATIO = 0.31;          // 타일 사이 간격 = 타일 너비의 31% (어느 단계에서든 유지)

  sticky.innerHTML =
    '<a class="showcase-frame" data-i="0" href="' + detailURL(projects[0]) + '">' + thumbHTML(projects[0]) + '</a>' +
    projects.slice(1).map(function (p, k) {
      return '<a class="showcase-tile" data-i="' + (k + 1) + '" href="' + detailURL(p) + '">' + thumbHTML(p) + '</a>';
    }).join('');

  var frame = sticky.querySelector('.showcase-frame');
  var tiles = Array.prototype.slice.call(sticky.querySelectorAll('.showcase-tile'));
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  // 축소 곡선: 처음과 끝은 느리고 가운데가 가파른 가감속 (측정값에 맞춤)
  var easeShrink = function (t) { var a = t * t * t, b = (1 - t) * (1 - t) * (1 - t); return a / (a + b); };
  var easeRow = function (t) { return t * t * (3 - 2 * t); };

  var vw, stageH, navH, pad, W1, H1, W2, H2, G1, G2, A, B, C, HOLD, overflow;
  var measure = function () {
    vw = sticky.clientWidth;
    navH = parseFloat(getComputedStyle(section).getPropertyValue('--nav-h')) || 72;
    pad = parseFloat(getComputedStyle(section).getPropertyValue('--pad')) || 32;
    stageH = window.innerHeight - navH;
    W1 = clamp(vw * 0.243, 180, 400); H1 = W1;   // 축소 직후 타일 (정사각형)
    W2 = clamp(vw * 0.157, 120, 260); H2 = W2;   // 줄에 섰을 때 타일 (정사각형)
    G1 = W1 * GAP_RATIO; G2 = W2 * GAP_RATIO;               // 각 단계의 타일 사이 간격
    A = stageH * 1.3;                                       // 축소 구간
    B = stageH * 1.5;                                       // 줄로 모이는 구간
    overflow = Math.max(0, pad + n * W2 + (n - 1) * G2 + pad - vw);   // 줄이 화면보다 긴 만큼
    C = overflow ? Math.max(stageH, overflow * 0.8) : 0;    // 줄이 흐르는 구간
    HOLD = stageH * 0.5;                                    // 다 모인 채 잠깐 머무는 구간
    section.style.height = (stageH + (reduce ? 0 : A + B + C + HOLD)) + 'px';
  };

  var place = function (el, x, y, w, h) {
    el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    el.style.width = w.toFixed(1) + 'px';
    el.style.height = h.toFixed(1) + 'px';
  };

  var update = function () {
    var s = clamp(navH - section.getBoundingClientRect().top, 0, A + B + C + HOLD);
    if (reduce) s = A + B;   // 움직임을 줄인 환경: 완성된 줄만 보여준다

    var pA = clamp(s / A, 0, 1), eA = easeShrink(pA);
    var pB = clamp((s - A) / B, 0, 1), eB = easeRow(pB);
    var pC = C ? clamp((s - A - B) / C, 0, 1) : 0;
    var drift = -pC * overflow;
    var cy = stageH / 2;

    // 큰 프레임: 꽉 찬 화면 → 가운데 타일(1단계) → 왼쪽 끝 작은 타일(2단계)
    var w, h, x;
    if (pB === 0) {
      w = lerp(vw, W1, eA); h = lerp(stageH, H1, eA); x = (vw - w) / 2;
    } else {
      w = lerp(W1, W2, eB); h = lerp(H1, H2, eB); x = lerp((vw - W1) / 2, pad, eB);
    }
    place(frame, x + drift, cy - h / 2, w, h);

    // 나머지 타일: 오른쪽 가장자리에 살짝 걸친 채 기다리다 줄로 들어온다
    var tw = lerp(W1, W2, eB), th = lerp(H1, H2, eB);
    tiles.forEach(function (t, k) {
      var i = k + 1;
      var x0 = vw * 0.98 + k * (W1 + G1);
      var x1 = pad + i * (W2 + G2);
      place(t, lerp(x0, x1, eB) + drift, cy - th / 2, tw, th);
    });
  };

  measure();
  update();
  if (lenis) lenis.on('scroll', update);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
}

// 상세 기능 소개 — 왼쪽 글, 가운데 기기 프레임, 오른쪽 점이 화면에 붙어 있고,
// 스크롤은 (1) 몇 번째 기능인지 (2) 그 기능 화면이 프레임 안에서 얼마나 내려갔는지를 정한다.
// 기능 하나당 스크롤 길이의 앞뒤 15%는 화면이 멈춰 있어 바뀐 직후 읽을 틈이 생긴다.
function renderFeatures(root, features) {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var list = (features && features.length) ? features : [
    { title: '기능 제목이 들어갈 자리', text: '이 기능이 어떤 문제를 풀었는지 설명이 들어갈 자리입니다. 스크롤하면 오른쪽 화면이 함께 내려갑니다.' },
    { title: '두 번째 기능', text: '두 번째 기능 설명이 들어갈 자리입니다.' },
    { title: '세 번째 기능', text: '세 번째 기능 설명이 들어갈 자리입니다.' }
  ];
  var n = list.length;

  root.classList.add('features');
  root.style.setProperty('--n', n);
  root.innerHTML =
    '<div class="feat-track"></div>' +
    '<div class="feat-text">' + list.map(function (f) {
      return '<div class="feat-caption"><h2>' + esc(f.title) + '</h2><p>' + esc(f.text) + '</p></div>';
    }).join('') + '</div>' +
    '<div class="feat-stage"><div class="feat-device">' + list.map(function (f) {
      var inner;
      if (f.video) {
        inner = '<video muted playsinline preload="auto" src="' + esc(ROOT + f.video) + '"></video>';
      } else if (f.image) {
        inner = '<img src="' + esc(ROOT + f.image) + '" alt="' + esc(f.title) + '">';
      } else {
        inner = '<div class="feat-placeholder"><span></span><span></span><span></span><span></span><span></span><span></span></div>';
      }
      return '<div class="feat-screen">' + inner + '</div>';
    }).join('') + '</div></div>' +
    '<div class="feat-dots" aria-hidden="true">' + list.map(function () { return '<i></i>'; }).join('') + '</div>';

  var captions = Array.prototype.slice.call(root.querySelectorAll('.feat-caption'));
  var screens = Array.prototype.slice.call(root.querySelectorAll('.feat-screen'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.feat-dots i'));
  var stage = root.querySelector('.feat-stage');
  var device = root.querySelector('.feat-device');
  var current = -1;

  // 화면이 프레임보다 긴 만큼(--over)이 곧 그 기능에서 굴릴 수 있는 거리
  var measure = function () {
    var h = device.clientHeight;
    screens.forEach(function (s) {
      var c = s.firstElementChild;
      if (!c || c.tagName === 'VIDEO') return;
      s.style.setProperty('--over', Math.max(0, c.scrollHeight - h) + 'px');
    });
  };

  var setActive = function (i) {
    if (i === current) return;
    current = i;
    captions.forEach(function (c, k) { c.classList.toggle('on', k === i); });
    screens.forEach(function (s, k) {
      s.classList.toggle('on', k === i);
      var v = s.querySelector('video');
      if (!v) return;
      if (k === i) { v.currentTime = 0; v.play().catch(function () {}); }
      else v.pause();
    });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
  };

  var update = function () {
    var rect = root.getBoundingClientRect();
    var stickTop = parseFloat(getComputedStyle(stage).top) || 0;
    var total = root.offsetHeight - stage.offsetHeight;   // 무대가 붙어 있는 총 스크롤 거리
    if (!(total > 0)) return;                              // 레이아웃 전이면 건너뜀
    var scrolled = Math.max(0, Math.min(total, stickTop - rect.top));
    var per = total / n;
    var idx = Math.max(0, Math.min(n - 1, Math.floor(scrolled / per)));
    var raw = (scrolled - idx * per) / per;
    var prog = reduce ? 0 : Math.max(0, Math.min(1, (raw - 0.15) / 0.7));
    screens[idx].style.setProperty('--p', prog);
    setActive(idx);
  };

  measure();
  update();
  if (lenis) lenis.on('scroll', update);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  root.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('load', function () { measure(); update(); });
  });
}

var homeGrid = document.getElementById('home-grid');
var showcase = document.getElementById('showcase');
var listGrid = document.getElementById('list-grid');
var detailRoot = document.getElementById('detail-root');

if (homeGrid || showcase || listGrid || detailRoot) {
  fetch(ROOT + 'data/projects.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var projects = data.projects || [];

      // 홈: 쇼케이스
      if (showcase) renderShowcase(showcase, projects);

      // 홈: 카드 전체가 링크
      if (homeGrid) {
        homeGrid.innerHTML = projects.map(function (p) {
          return '<a class="project-card" href="' + detailURL(p) + '">' +
            thumbHTML(p) +
            '<h3>' + esc(p.title) + '</h3>' +
            '<p class="meta">' + esc(p.category) + ' · ' + esc(p.periodLabel) + '</p>' +
            '</a>';
        }).join('');
      }

      // 리스트: 1열 나열, 이미지만 링크. 메뉴의 유형·연도가 곧 필터
      if (listGrid) {
        var params = new URLSearchParams(location.search);
        var filterType = params.get('type');
        var filterYear = params.get('year');
        var shown = projects.filter(function (p) {
          var typeOk = !filterType || (p.types || []).indexOf(filterType) !== -1;
          var yearOk = !filterYear || p.year === filterYear;
          return typeOk && yearOk;
        });
        // 유형 필터일 때만 order(작을수록 앞)로 앞당김, 나머지는 배열 순서(최신순) 유지
        if (filterType) {
          shown = shown.map(function (p, i) { return { p: p, i: i }; }).sort(function (a, b) {
            var ao = a.p.order != null ? a.p.order : 1e9, bo = b.p.order != null ? b.p.order : 1e9;
            return ao - bo || a.i - b.i;
          }).map(function (x) { return x.p; });
        }

        var section = listGrid.closest('.work-grid');
        var stageMQ = window.matchMedia('(min-width: 1025px)');

        // 태블릿 이하: 카드가 세로로 이어지는 목록
        var renderRows = function () {
          listGrid.className = 'project-grid single-column';
          listGrid.innerHTML = shown.map(function (p) {
            return '<div class="project-card">' +
              '<a class="thumb-link" href="' + detailURL(p) + '">' + thumbHTML(p) + '</a>' +
              '<h3>' + esc(p.title) + '</h3>' +
              '<p class="meta">' + esc(p.category) + ' · ' + esc(p.periodLabel) + '</p>' +
              '</div>';
          }).join('');
          if (section) section.classList.remove('is-stage');
        };

        // 데스크톱: 화면에 붙어 있는 무대 하나. 제목·이미지·메타 자리는 고정되고
        // 스크롤은 몇 번째 프로젝트를 보여줄지만 정한다. 이미지는 프레임 안에서 밀려 올라오고,
        // 제목·메타는 한 줄 창 안에서 위로 굴러 넘어가는 롤링 텍스트로 갈아끼워진다.
        var renderStage = function () {
          var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          var ROLL = 600;     // 텍스트 롤링 길이(ms) — CSS 애니메이션과 맞춘다
          var PUSH = 800;     // 이미지 밀어올림 길이(ms) — CSS transition과 맞춘다
          var STEP = 0.45;    // 한 장 넘기는 데 필요한 스크롤 = 화면 높이의 비율

          listGrid.className = 'stage-track';
          if (section) section.classList.add('is-stage');
          listGrid.innerHTML = '<div class="stage">' +
            '<h3 class="stage-name"></h3>' +
            '<a class="stage-frame thumb-link" href="#"></a>' +
            '<p class="meta stage-meta"></p>' +
            '</div>';
          var nameEl = listGrid.querySelector('.stage-name');
          var frame = listGrid.querySelector('.stage-frame');
          var metaEl = listGrid.querySelector('.stage-meta');
          var current = -1;

          // 롤링: 새 글줄은 아래(되돌릴 땐 위)에서 올라와 자리를 잡고, 이전 글줄은 반대로 밀려 나간다.
          // 창(el)은 overflow hidden이라 밖으로 나간 글줄은 잘려 보인다.
          var roll = function (el, text, dir) {
            var line = document.createElement('span');
            line.className = 'roll-line';
            line.textContent = text;
            el.querySelectorAll('.roll-out').forEach(function (o) { o.remove(); });
            var old = el.querySelector('.roll-line');
            if (reduce) {
              if (old) old.remove();
              el.appendChild(line);
              return;
            }
            // 두 글줄의 줄 수가 다르면 각자 자기 높이만큼 움직이다 창 안에서 겹친다.
            // 둘 다 큰 쪽 높이만큼 같은 거리를 움직이게 해 교차하지 않도록 한다.
            var oldH = old ? old.offsetHeight : 0;
            if (old) {
              old.classList.remove('in-up', 'in-down');
              old.classList.add('roll-out');
            }
            el.appendChild(line);
            var dist = Math.max(oldH, line.offsetHeight);
            el.style.setProperty('--roll', dist + 'px');
            if (old) {
              old.classList.add(dir > 0 ? 'out-up' : 'out-down');
              setTimeout(function () { old.remove(); }, ROLL);
            }
            line.classList.add(dir > 0 ? 'in-up' : 'in-down');
          };

          var show = function (idx, animate) {
            var p = shown[idx];
            var dir = idx > current ? 1 : -1;   // 아래로 넘기면 1, 위로 되돌리면 -1
            current = idx;
            frame.href = detailURL(p);
            roll(nameEl, p.title, dir);
            roll(metaEl, p.category + ' · ' + p.periodLabel, dir);

            var olds = Array.prototype.slice.call(frame.querySelectorAll('.thumb'));
            var tmp = document.createElement('div');
            tmp.innerHTML = thumbHTML(p);
            var img = tmp.firstChild;

            if (!animate || reduce) {
              olds.forEach(function (o) { o.remove(); });
              frame.appendChild(img);
              return;
            }
            img.classList.add(dir > 0 ? 'from-below' : 'from-above');
            frame.appendChild(img);
            void img.offsetWidth;
            img.classList.remove('from-below', 'from-above');
            olds.forEach(function (o) {
              o.classList.remove('from-below', 'from-above', 'to-above', 'to-below');
              o.classList.add(dir > 0 ? 'to-above' : 'to-below');
              setTimeout(function () { o.remove(); }, PUSH);
            });
          };

          var trackTop = 0;
          var stepPx = function () { return window.innerHeight * STEP; };
          var measure = function () {
            // 트랙 높이 = (장 수 - 1) × 한 장 스크롤 + 무대 높이. 마지막 장까지 무대가 붙어 있게
            listGrid.style.height = ((shown.length - 1) * stepPx() + window.innerHeight) + 'px';
            trackTop = listGrid.getBoundingClientRect().top + window.scrollY;
          };
          var update = function () {
            var rel = window.scrollY - trackTop;
            var idx = Math.round(rel / stepPx());   // 한 장 스크롤의 절반을 넘기면 다음 장
            idx = Math.max(0, Math.min(shown.length - 1, idx));
            if (idx !== current) show(idx, true);   // 처음 열 때도 첫 카드가 아래에서 올라온다
          };
          var onResize = function () { measure(); update(); };

          measure();
          update();
          if (lenis) lenis.on('scroll', update);
          window.addEventListener('scroll', update, { passive: true });
          window.addEventListener('resize', onResize);

          return function () {
            if (lenis) lenis.off('scroll', update);
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', onResize);
            listGrid.style.height = '';
          };
        };

        var stageCleanup = null;
        var renderList = function () {
          if (stageCleanup) { stageCleanup(); stageCleanup = null; }
          if (stageMQ.matches && shown.length) stageCleanup = renderStage();
          else renderRows();
        };
        renderList();
        if (stageMQ.addEventListener) stageMQ.addEventListener('change', renderList);
        else stageMQ.addListener(renderList);
      }

      // 상세: detail.html?id=N — 템플릿 한 장으로 모든 프로젝트 표시
      if (detailRoot) {
        var id = parseInt(new URLSearchParams(location.search).get('id'), 10);
        var idx = projects.findIndex(function (p) { return p.id === id; });
        if (idx === -1) idx = 0;
        var p = projects[idx];
        var prev = projects[(idx + 1) % projects.length]; // 더 오래된 것
        var next = projects[(idx - 1 + projects.length) % projects.length]; // 더 최신

        document.title = p.title + ' — Yejin Lee';

        // 1. 대형 썸네일
        var hero = detailRoot.querySelector('.detail-hero-thumb');
        if (p.thumbnail) {
          hero.outerHTML = '<img class="detail-hero-thumb" src="' + esc(ROOT + p.thumbnail) + '" alt="' + esc(p.title) + '">';
        }

        // 2. 프로젝트 정보 (본문 크기 나열)
        var set = function (sel, text) { detailRoot.querySelector(sel).textContent = text; };
        set('.d-title', p.title);
        set('.d-category', p.category);
        set('.d-spec', p.period + ' · ' + p.org);
        set('.d-summary', p.summary);
        set('.d-role', p.role);
        set('.d-team', p.team);
        set('.d-tools', p.tools);
        set('.d-graphnote', p.graphNote || '');

        // 4. 기능 소개
        renderFeatures(detailRoot.querySelector('#feat-root'), p.features);
        var linkDd = detailRoot.querySelector('.d-link');
        linkDd.innerHTML = p.link ? '<a href="' + esc(p.link) + '">' + esc(p.link) + '</a>' : '—';

        // 5. 이전/다음
        var prevA = detailRoot.querySelector('.pn-nav .prev');
        prevA.href = 'detail.html?id=' + prev.id;
        prevA.querySelector('.title').textContent = '← ' + prev.title;
        var nextA = detailRoot.querySelector('.pn-nav .next');
        nextA.href = 'detail.html?id=' + next.id;
        nextA.querySelector('.title').textContent = next.title + ' →';

        // 플로팅 이전/다음: 하단 버튼이 보이기 전까지 화면 양옆에 고정 노출
        var floatPrev = document.createElement('a');
        floatPrev.className = 'pn-float pn-float-prev';
        floatPrev.textContent = '← Previous';
        floatPrev.href = 'detail.html?id=' + prev.id;
        var floatNext = document.createElement('a');
        floatNext.className = 'pn-float pn-float-next';
        floatNext.textContent = 'Next →';
        floatNext.href = 'detail.html?id=' + next.id;
        floatPrev.classList.add('off');
        floatNext.classList.add('off');
        document.body.appendChild(floatPrev);
        document.body.appendChild(floatNext);

        // 기능 구간에 도달하면 표시, 구간이 화면 가운데를 차지하는 동안과 하단 버튼을 만나면 숨김
        // (점 인디케이터가 오른쪽 가장자리에 있어 Next 글자와 겹치지 않도록)
        var imagesReached = false;
        var featActive = false;
        var buttonsVisible = false;
        var updateFloat = function () {
          var show = imagesReached && !featActive && !buttonsVisible;
          floatPrev.classList.toggle('off', !show);
          floatNext.classList.toggle('off', !show);
        };
        var featSec = detailRoot.querySelector('.detail-features');
        var checkFeat = function () {
          var r = featSec.getBoundingClientRect();
          var mid = window.innerHeight * 0.5;
          imagesReached = r.top <= window.innerHeight;
          featActive = r.top < mid && r.bottom > mid;
          updateFloat();
        };
        if (lenis) lenis.on('scroll', checkFeat);
        window.addEventListener('scroll', checkFeat, { passive: true });
        checkFeat();
        new IntersectionObserver(function (entries) {
          buttonsVisible = entries[0].isIntersecting;
          updateFloat();
        }).observe(detailRoot.querySelector('.pn-nav'));
      }
    });
}

// 수상 내역 — data/awards.json 이 정본. Pages CMS에서 그 파일을 수정하면 이 페이지가 바뀐다.
var awardsList = document.getElementById('awards-list');
if (awardsList) {
  fetch(ROOT + 'data/awards.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var awards = data.awards || [];
      awardsList.innerHTML = awards.map(function (a) {
        // 둘째 줄: 프로젝트명만 상세로 연결, 부문·주최는 일반 텍스트
        var workHTML = a.projectId ?
          '<a href="' + ROOT + 'projects/detail.html?id=' + esc(a.projectId) + '">' + esc(a.work) + '</a>' :
          esc(a.work);
        var sub = [a.work ? workHTML : '', esc(a.division), esc(a.org)]
          .filter(Boolean).join(' · ');
        return '<div class="career-row">' +
          '<div class="career-body">' +
          '<h3>' + esc(a.award) + '</h3>' +
          (sub ? '<p class="career-org">' + sub + '</p>' : '') +
          (a.kor ? '<p class="career-kor">' + esc(a.kor) + '</p>' : '') +
          '</div>' +
          '<p class="period">' + esc(a.date) + '</p>' +
          '</div>';
      }).join('');
    });
}

// 스크롤 안내: 아래에 내용이 더 있다는 표시. 홈에서만 띄우고, 스크롤을 시작하면 사라진다
(function () {
  if (!document.getElementById('home-grid') && !document.getElementById('showcase')) return;
  // 스크롤할 게 없으면 띄우지 않는다
  if (document.documentElement.scrollHeight <= window.innerHeight + 40) return;

  var hint = document.createElement('button');
  hint.type = 'button';
  hint.className = 'scroll-hint';
  hint.setAttribute('aria-label', '아래로 스크롤');
  hint.textContent = '↓';
  document.body.appendChild(hint);

  hint.addEventListener('click', function () {
    var to = window.scrollY + window.innerHeight * 0.9;
    if (lenis) lenis.scrollTo(to, { duration: 1.2 });
    else window.scrollTo({ top: to, behavior: 'smooth' });
  });

  var update = function () {
    hint.classList.toggle('off', window.scrollY > 80);
  };
  // Lenis가 이벤트를 못 흘릴 때를 대비해 기본 스크롤도 같이 듣는다
  if (lenis) lenis.on('scroll', update);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// 푸터 Back to top: 맨 위로 부드럽게
document.querySelectorAll('.back-top').forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

