/**
 * Web Notifications API를 사용한 알림 예약/취소
 *
 * ⚠️ iOS 호환성 주의:
 *   - iOS 16.4+ PWA(홈 화면 추가)에서만 Web Notifications 지원
 *   - 일반 Safari에서는 Notification API 자체가 없거나 'denied' 고정
 *   → 알람 활성화 상태는 알림 권한과 완전히 분리하여 관리
 *   → 권한 없어도 알람 버튼은 활성화되며, 가능한 경우에만 실제 알림 발송
 */

const ALARM_STORAGE_KEY = 'darimT_alarm';

/**
 * 알림 권한을 요청합니다.
 * @returns {Promise<boolean>} 발송 가능 여부 (false여도 알람 자체는 활성화 가능)
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    // iOS Safari 등 Notification API 미지원 환경
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    return false;
  }
}

/**
 * 기상 시각에 알람을 예약합니다.
 * 알림 권한과 무관하게 알람 상태는 항상 활성화됩니다.
 *
 * @param {Date} wakeupTime - 기상 시각
 * @returns {Promise<{success: boolean, canNotify: boolean}>}
 *   success: 알람 활성화 성공 여부 (시각이 미래이면 true)
 *   canNotify: 실제 Web Notification 발송 가능 여부
 */
export async function scheduleAlarm(wakeupTime) {
  const now = Date.now();
  const targetMs = wakeupTime.getTime();
  const delayMs = targetMs - now;

  if (delayMs <= 0) {
    // 기상 시각이 이미 지남
    return { success: false, canNotify: false };
  }

  // 기존 알람 취소
  cancelAlarm();

  // 알람 정보 저장 (권한과 무관하게 항상 저장)
  const alarmInfo = {
    scheduledAt: now,
    wakeupTime: targetMs,
  };
  localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarmInfo));

  // 알림 권한 확인 (없어도 알람 자체는 성공)
  const canNotify = await requestNotificationPermission();

  if (canNotify) {
    // Web Notification 예약 (권한 있는 경우)
    const timerId = setTimeout(() => {
      try {
        const title = '⏰ 기상 시간입니다!';
        const options = {
          body: '비행 준비를 시작하세요. DaRim\'s Moment ✈️',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'darimT-alarm',
          vibrate: [200, 100, 200, 100, 200], // 진동 패턴 (지원하는 모바일 기기용)
          requireInteraction: true,
        };

        // 모바일 PWA에서는 ServiceWorker를 통한 알림이 가장 안정적임
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, options);
          }).catch(() => {
            // ServiceWorker 실패 시 기본 Notification 폴백
            new Notification(title, options);
          });
        } else {
          // 서비스 워커 없는 환경용 기존 방식
          new Notification(title, options);
        }
      } catch (e) {
        console.warn('[Notifications] 알림 발송 실패:', e);
      }
      localStorage.removeItem(ALARM_STORAGE_KEY);
    }, delayMs);

    window.__darimAlarmTimer = timerId;
  }

  // 권한 여부와 무관하게 알람 활성화 성공 반환
  return { success: true, canNotify };
}

/**
 * 예약된 알람을 취소합니다.
 */
export function cancelAlarm() {
  if (window.__darimAlarmTimer !== undefined) {
    clearTimeout(window.__darimAlarmTimer);
    window.__darimAlarmTimer = undefined;
  }
  localStorage.removeItem(ALARM_STORAGE_KEY);
}

/**
 * 저장된 알람 정보를 불러옵니다.
 * @returns {Object|null}
 */
export function loadAlarmInfo() {
  try {
    const raw = localStorage.getItem(ALARM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 현재 알람이 활성 상태인지 확인합니다.
 * @returns {boolean}
 */
export function isAlarmActive() {
  const info = loadAlarmInfo();
  if (!info) return false;
  return info.wakeupTime > Date.now();
}
