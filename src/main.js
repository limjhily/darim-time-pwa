/**
 * main.js — 앱 엔트리포인트
 * CSS 임포트, 앱 셸 마운트, 라우터 초기화를 담당합니다.
 */

import './style.css';
import { createAppShell, initRouter } from './router.js';

// 앱 루트에 셸 마운트
const appEl = document.getElementById('app');
appEl.innerHTML = createAppShell();

// 라우터 초기화 (초기 페이지 렌더링 포함)
initRouter();

// === 테마(다크/라이트 모드) 관리 ===
const THEME_KEY = 'darimT_theme';
const themeBtn = document.getElementById('themeToggleBtn');
const rootElement = document.documentElement;

// 1. 초기 테마 로드
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) {
  rootElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
} else {
  // 저장된 거 없으면 OS 모드 확인 후 아이콘 업데이트
  const isSetupDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  updateThemeIcon(isSetupDark ? 'dark' : 'light');
}

// 2. 테마 스위치 이벤트
themeBtn.addEventListener('click', () => {
  // 현재 테마 구하기 (수동 설정이 없으면 OS 설정 따름)
  let current = rootElement.getAttribute('data-theme');
  if (!current) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    current = prefersDark ? 'dark' : 'light';
  }

  // 테마 반전
  const newTheme = current === 'dark' ? 'light' : 'dark';
  
  // DOM 및 스토리지 업데이트
  rootElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  updateThemeIcon(newTheme);
});

// 아이콘 업데이트 헬퍼
function updateThemeIcon(theme) {
  // 다크 모드일 땐 해(라이트로 전환), 라이트 모드일 땐 달(다크로 전환) 모양 아이콘 표시
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeBtn.setAttribute('title', theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경');
}
