// 부드러운 스크롤 (Lenis) — quangdinh.im 참고: 관성 있는 무게감·속도감
var lenis = null;
if (window.Lenis) {
  lenis = new Lenis({
    duration: 1.2,          // 스크롤이 목표점까지 미끄러지는 시간
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

// 커서를 따라다니는 "See detail" 배지 (프로젝트 위에서만 표시)
var chip = document.createElement('div');
chip.className = 'cursor-chip';
chip.textContent = 'See detail';
document.body.appendChild(chip);

document.addEventListener('mousemove', function (e) {
  chip.style.transform = 'translate(' + (e.clientX + 16) + 'px, ' + (e.clientY + 16) + 'px)';
});

// 프로젝트 리스트 화면에서는 이미지 위에서만, 그 외에는 카드 전체에서 배지 표시
var chipSelector = document.querySelector('.work-grid') ? '.project-card .thumb' : '.project-card';
document.querySelectorAll(chipSelector).forEach(function (el) {
  el.addEventListener('mouseenter', function () { chip.classList.add('on'); });
  el.addEventListener('mouseleave', function () { chip.classList.remove('on'); });
});

// 전체 프로젝트 페이지(projects.html)는 항상 1열 나열 + 스냅.
// 메뉴의 유형·연도(?type= / ?year=)로 들어오면 그 조건에 맞는 것만 남김.
var params = new URLSearchParams(location.search);
var filterType = params.get('type');
var filterYear = params.get('year');
var isProjectsPage = !!document.querySelector('.work-grid');

if (isProjectsPage) {
  // 1열 정렬 (필터 유무와 무관)
  document.querySelectorAll('.project-grid').forEach(function (grid) {
    grid.classList.add('single-column');
  });

  // "기획 · PM"처럼 묶인 메뉴 항목은 두 태그 중 하나만 있어도 매칭
  var typeGroups = { '기획 · PM': ['기획', 'PM'] };
  var wantedTypes = filterType ? (typeGroups[filterType] || [filterType]) : null;

  document.querySelectorAll('.project-card[data-year]').forEach(function (card) {
    var cardTypes = (card.getAttribute('data-types') || '').split(',');
    var typeOk = !wantedTypes || wantedTypes.some(function (t) { return cardTypes.indexOf(t) !== -1; });
    var yearOk = !filterYear || card.getAttribute('data-year') === filterYear;
    card.style.display = (typeOk && yearOk) ? '' : 'none';
  });

  // 스냅: 스크롤이 멈추면 가장 가까운 프로젝트가 화면 중앙으로 미끄러져 들어옴
  if (lenis) {
    var snapping = false;
    var snapTimer = null;

    lenis.on('scroll', function () {
      if (snapping) return;
      clearTimeout(snapTimer);
      snapTimer = setTimeout(function () {
        var vh = window.innerHeight;
        var bestDist = Infinity;
        document.querySelectorAll('.project-card[data-year]').forEach(function (card) {
          if (card.style.display === 'none') return;
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
    // Lenis가 없을 때만 브라우저 기본 스냅으로 대체
    document.documentElement.classList.add('snap-scroll');
  }
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
  '<dt>Phone</dt><dd>전화번호가 들어갈 자리</dd>' +
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
