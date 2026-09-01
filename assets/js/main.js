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

  document.addEventListener('mousemove', function (e) {
    cursorDot.style.transform = 'translate3d(' + e.clientX + 'px, ' + e.clientY + 'px, 0)';
    cursorDot.classList.add('on');
  });

  document.addEventListener('mouseleave', function () {
    cursorDot.classList.remove('on');
  });
}

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

  navicon.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    navicon.setAttribute('aria-expanded', String(open));
    panel.inert = !open;   // 닫혔을 때 메뉴 링크로 탭 이동되지 않도록
  });
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
  fetch(ROOT + 'data/projects.json')
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
        var typeGroups = { '기획 · PM': ['기획', 'PM'] };
        var wantedTypes = filterType ? (typeGroups[filterType] || [filterType]) : null;

        var shown = projects.filter(function (p) {
          var typeOk = !wantedTypes || wantedTypes.some(function (t) { return (p.types || []).indexOf(t) !== -1; });
          var yearOk = !filterYear || p.year === filterYear;
          return typeOk && yearOk;
        });

        listGrid.classList.add('single-column');
        listGrid.innerHTML = shown.map(function (p) {
          return '<div class="project-card">' +
            '<a class="thumb-link" href="' + detailURL(p) + '">' + thumbHTML(p) + '</a>' +
            '<h3>' + esc(p.title) + '</h3>' +
            '<p class="meta">' + esc(p.category) + ' · ' + esc(p.periodLabel) + '</p>' +
            '</div>';
        }).join('');
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
  fetch(ROOT + 'data/awards.json')
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

// 스크롤 안내: 아래에 내용이 더 있다는 표시. 스크롤을 시작하면 사라진다
(function () {
  // 스크롤할 게 없는 페이지에는 띄우지 않는다
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
