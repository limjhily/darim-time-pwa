/**
 * 설정 화면 — 소요시간 커스터마이즈
 */

import { DEFAULT_DURATIONS } from '../utils/timeCalculator.js';
import { saveDurations, loadDurations, clearDurations } from '../utils/storage.js';
import { refreshTimeline } from './home.js';

// 설정 항목 메타데이터
const SETTINGS_META = [
  {
    key: 'briefing',
    label: '브리핑 시작',
    emoji: '📋',
    desc: '이륙 전 브리핑 시작까지',
    step: 10,
    min: 60,
    max: 240,
  },
  {
    key: 'airport',
    label: '공항 도착',
    emoji: '🛬',
    desc: '브리핑 전 공항 도착까지',
    step: 10,
    min: 30,
    max: 180,
  },
  {
    key: 'departure',
    label: '집에서 출발',
    emoji: '🚗',
    desc: '공항 도착 전 집 출발까지',
    step: 10,
    min: 10,
    max: 180,
  },
  {
    key: 'preparation',
    label: '비행 준비',
    emoji: '💄',
    desc: '집 출발 전 준비 시간',
    step: 10,
    min: 10,
    max: 180,
  },
  {
    key: 'wakeup',
    label: '기상 여유',
    emoji: '⏰',
    desc: '준비 전 기상 여유 시간',
    step: 10,
    min: 0,
    max: 60,
  },
];

// 현재 설정값 (메모리)
let currentDurations = { ...DEFAULT_DURATIONS };

/**
 * 설정 페이지 HTML을 반환합니다.
 */
export function renderSettingsPage() {
  // 저장된 설정 불러오기
  const saved = loadDurations();
  currentDurations = { ...DEFAULT_DURATIONS, ...(saved || {}) };

  const items = SETTINGS_META.map((meta) => {
    const value = currentDurations[meta.key];
    return `
      <div class="settings-item">
        <span class="settings-item-emoji">${meta.emoji}</span>
        <div class="settings-item-info">
          <p class="settings-item-label">${meta.label}</p>
          <p class="settings-item-desc">${meta.desc}</p>
        </div>
        <div class="stepper" data-key="${meta.key}">
          <button
            class="stepper-btn"
            data-action="minus"
            data-key="${meta.key}"
            aria-label="${meta.label} 줄이기"
          >−</button>
          <span class="stepper-value" id="value-${meta.key}">${value}분</span>
          <button
            class="stepper-btn"
            data-action="plus"
            data-key="${meta.key}"
            aria-label="${meta.label} 늘리기"
          >+</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="settings-section">
      <h2 class="settings-title">준비 단계 설정</h2>
      <p class="settings-subtitle">
        각 단계의 소요시간을 10분 단위로 조절하세요.<br/>
        변경 사항은 자동으로 저장됩니다.
      </p>

      <div class="settings-list" id="settingsList">
        ${items}
      </div>

      <div class="reset-section">
        <button class="reset-btn" id="resetBtn" aria-label="기본값으로 초기화">
          기본값으로 초기화
        </button>
      </div>
    </div>
  `;
}

/**
 * 설정 페이지 이벤트 리스너를 등록합니다.
 */
export function initSettingsPage() {
  const list = document.getElementById('settingsList');
  const resetBtn = document.getElementById('resetBtn');

  // 스테퍼 버튼 이벤트 (이벤트 위임)
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.stepper-btn');
    if (!btn) return;

    const key = btn.dataset.key;
    const action = btn.dataset.action;
    const meta = SETTINGS_META.find((m) => m.key === key);
    if (!meta) return;

    let value = currentDurations[key];
    if (action === 'plus') {
      value = Math.min(value + meta.step, meta.max);
    } else {
      value = Math.max(value - meta.step, meta.min);
    }

    currentDurations[key] = value;

    // UI 업데이트
    const valueEl = document.getElementById(`value-${key}`);
    if (valueEl) valueEl.textContent = `${value}분`;

    // 버튼 피드백 애니메이션
    btn.style.transform = 'scale(0.85)';
    setTimeout(() => (btn.style.transform = ''), 150);

    // localStorage 저장
    saveDurations(currentDurations);

    // 홈 화면 타임라인 갱신
    refreshTimeline();

    window.showToast?.(`${meta.label}: ${value}분`);
  });

  // 초기화 버튼
  resetBtn.addEventListener('click', () => {
    clearDurations();
    currentDurations = { ...DEFAULT_DURATIONS };

    // 모든 스테퍼 값 UI 갱신
    SETTINGS_META.forEach((meta) => {
      const el = document.getElementById(`value-${meta.key}`);
      if (el) el.textContent = `${currentDurations[meta.key]}분`;
    });

    refreshTimeline();
    window.showToast?.('기본값으로 초기화되었습니다');
  });
}
