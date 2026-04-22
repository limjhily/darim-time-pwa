/**
 * 탭 라우터 — 홈/설정 탭 전환 및 토스트 메시지 관리
 */

import { renderHomePage, initHomePage } from './pages/home.js';
import { renderSettingsPage, initSettingsPage } from './pages/settings.js';

let currentTab = 'home';

/**
 * 앱의 루트 HTML 구조를 생성하고 반환합니다.
 */
export function createAppShell() {
  return `
    <header class="app-header">
      <h1>DaRim's Moment</h1>
      <button class="theme-toggle-btn" id="themeToggleBtn" aria-label="다크 모드 변경" title="테마 변경">🌙</button>
    </header>

    <main class="page-content" id="pageContent"></main>

    <nav class="tab-bar" role="tablist" aria-label="메인 내비게이션">
      <button
        class="tab-btn active"
        id="tabHome"
        role="tab"
        aria-selected="true"
        aria-controls="pageContent"
        data-tab="home"
      >
        <span class="tab-icon">✈️</span>
        <span class="tab-label">홈</span>
      </button>
      <button
        class="tab-btn"
        id="tabSettings"
        role="tab"
        aria-selected="false"
        aria-controls="pageContent"
        data-tab="settings"
      >
        <span class="tab-icon">⚙️</span>
        <span class="tab-label">설정</span>
      </button>
      <div class="app-version">v26.1.4</div>
    </nav>

    <div class="toast" id="globalToast" role="status" aria-live="polite"></div>
  `;
}

/**
 * 라우터를 초기화하고 탭 이벤트를 등록합니다.
 */
export function initRouter() {
  // 탭 버튼 클릭 이벤트
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab !== currentTab) {
        navigateTo(tab);
      }
    });
  });

  // 전역 toast 함수 등록
  window.showToast = showToast;

  // 초기 페이지 로드
  navigateTo('home');
}

/**
 * 지정된 탭으로 페이지를 전환합니다.
 * @param {string} tab - 'home' | 'settings'
 */
function navigateTo(tab) {
  currentTab = tab;
  const pageContent = document.getElementById('pageContent');

  // 탭 버튼 active 상태 업데이트
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // 페이지 콘텐츠 렌더링
  if (tab === 'home') {
    pageContent.innerHTML = renderHomePage();
    initHomePage();
  } else if (tab === 'settings') {
    pageContent.innerHTML = renderSettingsPage();
    initSettingsPage();
  }

  // 스크롤 맨 위로
  pageContent.scrollTop = 0;
}

/**
 * 하단에 토스트 메시지를 잠깐 표시합니다.
 * @param {string} message
 * @param {number} duration - 표시 시간 (ms)
 */
function showToast(message, duration = 2500) {
  const toast = document.getElementById('globalToast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  // 기존 타이머 초기화
  clearTimeout(toast.__hideTimer);
  toast.__hideTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}
