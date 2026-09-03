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

var homeGrid = document.getElementById('home-grid');
var listGrid = document.getElementById('list-grid');
var detailRoot = document.getElementById('detail-root');

if (homeGrid || listGrid || detailRoot) {
  fetch(ROOT + 'data/projects.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var projects = data.projects || [];

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

        // 이미지 구간에 도달하면 표시, 하단 버튼을 만나면 숨김
        var imagesReached = false;
        var buttonsVisible = false;
        var updateFloat = function () {
          var show = imagesReached && !buttonsVisible;
          floatPrev.classList.toggle('off', !show);
          floatNext.classList.toggle('off', !show);
        };
        // 기준: 첫 번째 이미지의 밑단이 화면 안에 들어왔을 때
        var firstImage = detailRoot.querySelector('.detail-image-xl');
        var checkFirstImage = function () {
          imagesReached = firstImage.getBoundingClientRect().bottom <= window.innerHeight;
          updateFloat();
        };
        if (lenis) lenis.on('scroll', checkFirstImage);
        else window.addEventListener('scroll', checkFirstImage, { passive: true });
        checkFirstImage();
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
  if (!document.getElementById('home-grid')) return;
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


// 컬러 피커: 메뉴바 오른쪽 끝(홈에만). 고른 색은 포인트 도트(--accent)에 바로 반영되고 이 브라우저에 기억된다.
// UI는 cosmos.so 검색바의 색 선택기(채도·명도 면 + 색상 띠)를 1/4 크기로 옮긴 것. 고르는 즉시 적용, Reset은 기본 노랑.
(function () {
  var nav = document.querySelector('.nav');
  // 컬러 원은 홈(#home-grid가 있는 페이지)에만 둔다 — 도트 배경은 마인드맵에도 있지만 조작은 홈에서만
  if (!nav || !document.getElementById('home-grid') || document.querySelector('.color-pick')) return;

  var KEY = 'accent';
  var DEFAULT = '#FFFB7C';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved && /^#[0-9a-f]{6}$/i.test(saved)) document.documentElement.style.setProperty('--accent', saved);

  var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<ellipse cx="6.796" cy="17.118" rx="1.952" ry="1.941" fill="#4694F6"/>' +
    '<ellipse cx="17.205" cy="17.231" rx="1.952" ry="1.941" fill="#C877CB"/>' +
    '<ellipse cx="6.796" cy="6.882" rx="1.952" ry="1.941" fill="#81B386"/>' +
    '<ellipse cx="17.205" cy="6.769" rx="1.952" ry="1.941" fill="#9C6030"/>' +
    '<ellipse cx="19.548" cy="11.686" rx="1.952" ry="1.941" fill="#A0213E"/>' +
    '<ellipse cx="12" cy="4.441" rx="1.952" ry="1.941" fill="#EBB042"/>' +
    '<ellipse cx="4.452" cy="11.686" rx="1.952" ry="1.941" fill="#77CDD0"/>' +
    '<ellipse cx="12" cy="19.559" rx="1.952" ry="1.941" fill="#6951F5"/></svg>';

  var wrap = document.createElement('div');
  wrap.className = 'color-pick';
  wrap.innerHTML =
    '<button class="cp-trigger" type="button" aria-label="Accent color" aria-expanded="false">' + ICON + '</button>' +
    '<div class="cp-pop" role="dialog" aria-label="Accent color">' +
      '<div class="cp-sv"><div class="cp-cursor"></div></div>' +
      '<div class="cp-hue"><div class="cp-thumb"></div></div>' +
      '<div class="cp-row">' +
        '<button class="cp-reset" type="button">Reset</button>' +
      '</div>' +
    '</div>';
  (nav.querySelector('.nav-bar') || nav).appendChild(wrap);   // 메뉴바 오른쪽 끝

  var trigger = wrap.querySelector('.cp-trigger');
  var pop = wrap.querySelector('.cp-pop');
  var sv = wrap.querySelector('.cp-sv');
  var cursor = wrap.querySelector('.cp-cursor');
  var hue = wrap.querySelector('.cp-hue');
  var thumb = wrap.querySelector('.cp-thumb');

  // ---- 색 변환 (h 0~360, s·v 0~1) ----
  function hsvToHex(h, s, v) {
    var c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c, r, g, b;
    if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; } else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
    return '#' + [r, g, b].map(function (n) { return ('0' + Math.round((n + m) * 255).toString(16)).slice(-2); }).join('').toUpperCase();
  }
  function hexToHsv(hex) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return { h: h, s: max ? d / max : 0, v: max };
  }

  var state = hexToHsv((saved && /^#[0-9a-f]{6}$/i.test(saved)) ? saved : DEFAULT);

  function paint() {
    var hex = hsvToHex(state.h, state.s, state.v);
    sv.style.setProperty('--cp-h', state.h.toFixed(1));
    cursor.style.left = (state.s * 100) + '%';
    cursor.style.top = ((1 - state.v) * 100) + '%';
    cursor.style.background = hex;
    thumb.style.left = (state.h / 360 * 100) + '%';
    thumb.style.background = 'hsl(' + state.h.toFixed(1) + ' 100% 50%)';
    document.documentElement.style.setProperty('--accent', hex);   // 도트에 바로 반영
    return hex;
  }
  function persist() {
    try { localStorage.setItem(KEY, paint()); } catch (e) {}
  }
  paint();

  // ---- 드래그: 면(채도·명도)과 띠(색상) ----
  function drag(el, onMove) {
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      onMove(e);
      var move = function (ev) { onMove(ev); };
      var up = function () {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        persist();
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  }
  drag(sv, function (e) {
    var r = sv.getBoundingClientRect();
    state.s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    state.v = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height));
    paint();
  });
  drag(hue, function (e) {
    var r = hue.getBoundingClientRect();
    state.h = Math.min(359.99, Math.max(0, (e.clientX - r.left) / r.width * 360));
    paint();
  });

  // 열고 닫기 (클릭). 회전·호버 열림은 톤에 맞지 않아 뺐다 — 등장 스프링만 남김
  function setOpen(open) {
    wrap.classList.toggle('open', open);
    trigger.setAttribute('aria-expanded', String(open));
  }
  trigger.addEventListener('click', function () { setOpen(!wrap.classList.contains('open')); });
  // Reset: 기본 노랑으로 되돌린다 (닫지는 않음 — 바로 다시 고를 수 있게)
  wrap.querySelector('.cp-reset').addEventListener('click', function () { state = hexToHsv(DEFAULT); persist(); });
  document.addEventListener('pointerdown', function (e) {
    if (wrap.classList.contains('open') && !wrap.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();
