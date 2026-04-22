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
