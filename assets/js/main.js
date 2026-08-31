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

document.querySelectorAll('.project-card').forEach(function (el) {
  el.addEventListener('mouseenter', function () { chip.classList.add('on'); });
  el.addEventListener('mouseleave', function () { chip.classList.remove('on'); });
});

// 메뉴가 곧 필터: ?type=논문 / ?year=2025 로 열면 해당 프로젝트 카드만 남김
var params = new URLSearchParams(location.search);
var filterType = params.get('type');
var filterYear = params.get('year');

if (filterType || filterYear) {
  // 필터로 들어온 화면은 무조건 1열 정렬 + 프로젝트 단위 스냅 스크롤
  document.documentElement.classList.add('snap-scroll');
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
}
