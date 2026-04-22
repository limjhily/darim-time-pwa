/**
 * 비행 시간 역산 계산기
 * 이륙 시간을 기준으로 각 단계의 시각을 역산합니다.
 */

// 기본 소요시간 (단위: 분)
export const DEFAULT_DURATIONS = {
  briefing: 120,   // 브리핑: 이륙 - 2시간
  airport: 60,     // 공항 도착: 브리핑 - 1시간
  departure: 50,   // 집에서 출발: 공항 - 50분
  preparation: 60, // 비행 준비: 집 출발 - 1시간
  wakeup: 20,      // 기상: 준비 - 20분
};

/**
 * 이륙 시간과 소요시간을 받아 전체 타임라인을 계산합니다.
 * @param {Date} takeoffTime - 이륙 시각 Date 객체
 * @param {Object} durations - 각 단계 소요시간 (분)
 * @returns {Array} 타임라인 배열
 */
export function calculateTimeline(takeoffTime, durations) {
  const d = { ...DEFAULT_DURATIONS, ...durations };

  // 각 단계의 시각 계산 (분 단위로 뺄셈)
  const briefingTime = subtractMinutes(takeoffTime, d.briefing);
  const airportTime = subtractMinutes(briefingTime, d.airport);
  const departureTime = subtractMinutes(airportTime, d.departure);
  const prepTime = subtractMinutes(departureTime, d.preparation);
  const wakeupTime = subtractMinutes(prepTime, d.wakeup);

  return [
    {
      id: 'takeoff',
      label: '이륙',
      emoji: '✈️',
      time: takeoffTime,
      duration: d.briefing, // 아래 카드(브리핑)까지의 간격
      isAlarm: false,
    },
    {
      id: 'briefing',
      label: '브리핑 시작',
      emoji: '📋',
      time: briefingTime,
      duration: d.airport,
      isAlarm: false,
    },
    {
      id: 'airport',
      label: '공항 도착',
      emoji: '🛬',
      time: airportTime,
      duration: d.departure,
      isAlarm: false,
    },
    {
      id: 'departure',
      label: '집에서 출발',
      emoji: '🚗',
      time: departureTime,
      duration: d.preparation,
      isAlarm: false,
    },
    {
      id: 'preparation',
      label: '비행 준비',
      emoji: '💄',
      time: prepTime,
      duration: d.wakeup,
      isAlarm: false,
    },
    {
      id: 'wakeup',
      label: '기상',
      emoji: '⏰',
      time: wakeupTime,
      duration: null, // 마지막 항목은 소요시간 없음
      isAlarm: true,  // 알람 설정 가능한 항목
    },
  ];
}

/**
 * Date 객체에서 분을 뺀 새 Date를 반환합니다.
 * @param {Date} date
 * @param {number} minutes
 * @returns {Date}
 */
function subtractMinutes(date, minutes) {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

/**
 * Date 객체를 "HH:MM" 형식의 문자열로 변환합니다.
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * 소요시간(분)을 "X시간 Y분" 형식으로 변환합니다.
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}
