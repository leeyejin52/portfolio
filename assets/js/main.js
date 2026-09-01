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

// 햄버거 메뉴 토글
document.querySelector('.navicon').addEventListener('click', function () {
  document.getElementById('nav-index').toggleAttribute('hidden');
});

// 커서를 따라다니는 노란 점 (프로젝트 위에서만 표시)
var chip = document.createElement('div');
chip.className = 'cursor-chip';
document.body.appendChild(chip);

document.addEventListener('mousemove', function (e) {
  chip.style.transform = 'translate(' + (e.clientX + 16) + 'px, ' + (e.clientY + 16) + 'px)';
});

function bindChip(selector) {
  document.querySelectorAll(selector).forEach(function (el) {
    el.addEventListener('mouseenter', function () { chip.classList.add('on'); });
    el.addEventListener('mouseleave', function () { chip.classList.remove('on'); });
  });
}

// Contact 모달: 어디서든 Contact를 누르면 연락처 정보 표시
var overlay = document.createElement('div');
overlay.className = 'contact-overlay';
overlay.hidden = true;
overlay.innerHTML =
  '<div class="contact-modal">' +
  '<button class="contact-close" aria-label="Close">×</button>' +
  '<p class="contact-title">Contact</p>' +
  '<dl class="credits">' +
  '<dt>Email</dt><dd><a href="mailto:hello@example.com">hello@example.com</a></dd>' +
  '<dt>Phone</dt><dd><a href="tel:+821057911507">+82 10-5791-1507</a></dd>' +
  '<dt>LinkedIn</dt><dd><a href="#">링크가 들어갈 자리</a></dd>' +
  '<dt>Instagram</dt><dd><a href="#">링크가 들어갈 자리</a></dd>' +
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
        bindChip('.project-card');
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
        bindChip('.project-card .thumb');

        // 스냅: 스크롤이 멈추면 가장 가까운 프로젝트가 화면 중앙으로
        if (lenis) {
          var snapping = false;
          var snapTimer = null;
          lenis.on('scroll', function () {
            if (snapping) return;
            clearTimeout(snapTimer);
            snapTimer = setTimeout(function () {
              var vh = window.innerHeight;
              var bestDist = Infinity;
              listGrid.querySelectorAll('.project-card').forEach(function (card) {
                var r = card.getBoundingClientRect();
                var d = (r.top + r.height / 2) - vh / 2;
                if (Math.abs(d) < Math.abs(bestDist)) bestDist = d;
              });
              if (Math.abs(bestDist) > 4 && Math.abs(bestDist) < vh) {
                snapping = true;
                lenis.scrollTo(window.scrollY + bestDist, {
                  duration: 0.9,
                  onComplete: function () { snapping = false; }
                });
              }
            }, 160);
          });
        } else {
          document.documentElement.classList.add('snap-scroll');
        }
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
} else {
  bindChip('.project-card');
}

// 푸터 Back to top: 맨 위로 부드럽게
document.querySelectorAll('.back-top').forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
