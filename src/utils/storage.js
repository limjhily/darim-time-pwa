/**
 * localStorage를 통한 설정 저장/불러오기
 * AsyncStorage (React Native) 역할을 대체합니다.
 */

const STORAGE_KEY = 'darimT_durations';

/**
 * 소요시간 설정을 localStorage에 저장합니다.
 * @param {Object} durations - 각 단계 소요시간 객체
 */
export function saveDurations(durations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(durations));
  } catch (e) {
    console.error('[Storage] 저장 실패:', e);
  }
}

/**
 * localStorage에서 소요시간 설정을 불러옵니다.
 * @returns {Object|null} 저장된 설정 또는 null
 */
export function loadDurations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[Storage] 불러오기 실패:', e);
    return null;
  }
}

/**
 * 저장된 소요시간 설정을 초기화합니다.
 */
export function clearDurations() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('[Storage] 초기화 실패:', e);
  }
}
