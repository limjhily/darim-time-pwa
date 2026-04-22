/**
 * 홈 화면 — 이륙 시간 입력 + 역산 타임라인
 */

import { calculateTimeline, formatTime, formatDuration, DEFAULT_DURATIONS } from '../utils/timeCalculator.js';
import { loadDurations } from '../utils/storage.js';
import { scheduleAlarm, cancelAlarm, isAlarmActive, requestNotificationPermission } from '../utils/notifications.js';

let currentTakeoffTime = null;
let alarmActive = false;
let currentTimeline = [];

/**
 * 홈 페이지 HTML을 반환합니다.
 */
export function renderHomePage() {
  // 오늘 현재 시각 기준 초기 시간 설정
  const now = new Date();
  const defaultHour = String(now.getHours()).padStart(2, '0');
  const defaultMin = String(now.getMinutes()).padStart(2, '0');
  const defaultTime = `${defaultHour}:${defaultMin}`;

  return `
    <div class="time-input-section">
      <p class="section-label">이륙 시간 ✈️</p>
      <div class="time-picker-card">
        <!-- iOS 호환: input을 시간 표시 위에 투명하게 overlay하여 실제 탭 이벤트로 피커 오픈 -->
        <div class="time-display-wrapper">
          <div class="time-display" id="timeDisplay" aria-hidden="true">
            ${defaultTime}
          </div>
          <input
            type="time"
            id="timeInputNative"
            class="time-input-overlay"
            value="${defaultTime}"
            aria-label="이륙 시간 선택"
          />
        </div>
        <p class="time-label">탭하여 이륙 시간 설정</p>
        <div class="time-adjust-row">
          <button class="time-adjust-btn" id="btnMinus30" aria-label="30분 빼기">−30분</button>
          <button class="time-adjust-btn" id="btnMinus10" aria-label="10분 빼기">−10분</button>
          <button class="time-adjust-btn" id="btnPlus10" aria-label="10분 더하기">+10분</button>
          <button class="time-adjust-btn" id="btnPlus30" aria-label="30분 더하기">+30분</button>
        </div>
      </div>
    </div>

    <div class="timeline-section" id="timelineSection">
      <div class="empty-state" id="emptyState">
        <span class="empty-emoji">✈️</span>
        <p>위에서 이륙 시간을 선택하면<br/>역산 타임라인이 표시됩니다</p>
      </div>
      <div class="timeline" id="timeline"></div>
    </div>
  `;
}

/**
 * 홈 페이지 이벤트 리스너를 등록합니다.
 */
export function initHomePage() {
  const timeDisplay = document.getElementById('timeDisplay');
  const timeInput = document.getElementById('timeInputNative');

  // iOS 호환: input이 이미 overlay이므로 별도 click 이벤트 불필요
  // (사용자가 직접 input을 탭 → iOS 네이티브 피커 자동 오픈)

  // 네이티브 시간 피커 변경 이벤트
  timeInput.addEventListener('change', (e) => {
    const [h, m] = e.target.value.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    // 이미 지난 시각이면 다음 날로 설정
    if (date < new Date()) {
      date.setDate(date.getDate() + 1);
    }
    currentTakeoffTime = date;
    timeDisplay.textContent = formatTime(date);
    updateTimeline();
  });

  // 빠른 조절 버튼
  document.getElementById('btnMinus30').addEventListener('click', () => adjustTime(-30));
  document.getElementById('btnMinus10').addEventListener('click', () => adjustTime(-10));
  document.getElementById('btnPlus10').addEventListener('click', () => adjustTime(10));
  document.getElementById('btnPlus30').addEventListener('click', () => adjustTime(30));

  // 초기 타임라인 계산 (현재 시각 기준)
  const now = new Date();
  // 초기 이륙 시각: 현재 시각에서 +3시간 30분 (합리적인 기본값)
  currentTakeoffTime = new Date(now.getTime() + (3 * 60 + 30) * 60 * 1000);
  currentTakeoffTime.setSeconds(0, 0);
  const h = String(currentTakeoffTime.getHours()).padStart(2, '0');
  const m = String(currentTakeoffTime.getMinutes()).padStart(2, '0');
  document.getElementById('timeDisplay').textContent = `${h}:${m}`;
  document.getElementById('timeInputNative').value = `${h}:${m}`;
  updateTimeline();
}

/**
 * 이륙 시각을 분 단위로 조정합니다.
 * @param {number} minutes - 더하거나 뺄 분 수
 */
function adjustTime(minutes) {
  if (!currentTakeoffTime) {
    const now = new Date();
    currentTakeoffTime = new Date(now);
    currentTakeoffTime.setSeconds(0, 0);
  }
  currentTakeoffTime = new Date(currentTakeoffTime.getTime() + minutes * 60 * 1000);
  const h = String(currentTakeoffTime.getHours()).padStart(2, '0');
  const m = String(currentTakeoffTime.getMinutes()).padStart(2, '0');
  document.getElementById('timeDisplay').textContent = `${h}:${m}`;
  document.getElementById('timeInputNative').value = `${h}:${m}`;
  updateTimeline();
}

/**
 * 타임라인을 다시 계산하고 렌더링합니다.
 */
function updateTimeline() {
  if (!currentTakeoffTime) return;

  const savedDurations = loadDurations();
  const durations = { ...DEFAULT_DURATIONS, ...(savedDurations || {}) };
  currentTimeline = calculateTimeline(currentTakeoffTime, durations);

  renderTimeline();
}

/**
 * 타임라인 카드 목록을 DOM에 렌더링합니다.
 */
function renderTimeline() {
  const timelineEl = document.getElementById('timeline');
  const emptyState = document.getElementById('emptyState');

  emptyState.classList.add('hidden');
  timelineEl.innerHTML = '';

  currentTimeline.forEach((item) => {
    const card = createTimelineCard(item);
    timelineEl.appendChild(card);
  });
}

/**
 * 타임라인 카드 DOM 요소를 생성합니다.
 * @param {Object} item - 타임라인 아이템
 * @returns {HTMLElement}
 */
function createTimelineCard(item) {
  const card = document.createElement('div');
  // wakeup 카드 강조, takeoff 카드는 별도 클래스
  const extraClass = item.id === 'wakeup' ? ' wakeup' : item.id === 'takeoff' ? ' takeoff' : '';
  card.className = `timeline-card${extraClass}`;
  card.dataset.id = item.id;

  // 소요시간: 아래 카드(다음 단계)와의 간격
  const durationText = item.duration
    ? `<p class="card-duration">↓ ${formatDuration(item.duration)}</p>`
    : '';

  // 기상 카드: 이모지를 알람 토글 버튼으로 사용 (별도 알람 버튼 없음)
  const emojiEl = item.isAlarm
    ? `<button
        class="alarm-emoji-btn ${alarmActive ? 'active' : 'inactive'}"
        id="alarmEmojiBtn"
        aria-label="${alarmActive ? '알람 취소' : '알람 설정'}"
        title="${alarmActive ? '알람 취소' : '탭하여 기상 알람 설정'}"
      >${item.emoji}</button>`
    : `<span class="card-emoji">${item.emoji}</span>`;

  // 수평 레이아웃: [이모지(기상은 버튼)] [라벨+소요시간] [시간(오른쪽)]
  card.innerHTML = `
    ${emojiEl}
    <div class="card-main">
      <p class="card-label">${item.label}</p>
      ${durationText}
    </div>
    <p class="card-time">${formatTime(item.time)}</p>
  `;

  // 기상 이모지 버튼에 알람 토글 이벤트 연결
  if (item.isAlarm) {
    card.querySelector('#alarmEmojiBtn').addEventListener('click', handleAlarmToggle);
  }

  return card;
}

/**
 * 알람 토글 이벤트 핸들러
 */
async function handleAlarmToggle() {
  // 기상 시각 아이템 찾기
  const wakeupItem = currentTimeline.find((i) => i.id === 'wakeup');
  if (!wakeupItem) return;

  if (alarmActive) {
    // 알람 취소
    cancelAlarm();
    alarmActive = false;
    showToast('알람이 취소되었습니다');
  } else {
    // 알람 예약 — 권한 여부와 무관하게 알람 상태 활성화
    const result = await scheduleAlarm(wakeupItem.time);
    if (!result.success) {
      // 기상 시각이 이미 지난 경우
      showToast('기상 시각이 이미 지났습니다');
      return;
    }
    alarmActive = true;
    if (result.canNotify) {
      showToast(`🔔 ${formatTime(wakeupItem.time)} 알람 설정 완료`);
    } else {
      // 알림 권한 없어도 알람 상태는 활성화 (앱 포그라운드 유지 시 작동)
      showToast(`⏰ ${formatTime(wakeupItem.time)} 기상 시각 설정됨`);
    }
  }

  // 이모지 버튼 UI 업데이트 (기상 카드의 ⏰ 버튼)
  const emojiBtn = document.getElementById('alarmEmojiBtn');
  if (emojiBtn) {
    // active / inactive 클래스로 CSS가 시각적 구분을 자동 적용
    emojiBtn.className = `alarm-emoji-btn ${alarmActive ? 'active' : 'inactive'}`;
    emojiBtn.setAttribute('aria-label', alarmActive ? '알람 취소' : '알람 설정');
    emojiBtn.setAttribute('title', alarmActive ? '알람 취소' : '탭하여 기상 알람 설정');
  }
}

/**
 * 설정 변경 후 외부에서 호출하여 타임라인을 갱신합니다.
 */
export function refreshTimeline() {
  updateTimeline();
}

/**
 * 화면 하단에 토스트 메시지를 표시합니다.
 * @param {string} message
 */
function showToast(message) {
  // router.js의 전역 showToast 사용
  window.showToast?.(message);
}
