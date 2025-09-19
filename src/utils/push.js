import axiosInstance from '../api/axiosConfig';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function registrarPush(vapidPublicKeyB64Url) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { success: false, message: 'No soportado' };
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { success: false, message: 'Permiso denegado' };

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return { success: true, message: 'Ya registrado' };
  }
  try {
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKeyB64Url)
    });
    const json = sub.toJSON();
    await axiosInstance.post('/push-subscriptions/', {
      endpoint: sub.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent
    });
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function unSubscribeAll() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subs = await registration.pushManager.getSubscription();
  if (subs) {
    try {
      await axiosInstance.post('/push-subscriptions/unregister/', { endpoint: subs.endpoint });
      await subs.unsubscribe();
    } catch (_) { /* ignore */ }
  }
}
