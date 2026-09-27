/**
 * Notifications service
 * Fetches private notifications for the authenticated user from the backend API.
 */

function getAuthHeaders() {
  const token = localStorage.getItem('pa_auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function getNotifications(userId, role) {
  try {
    const res = await fetch('/api/my-notifications', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.warn("API getNotifications error:", error);
  }
  return [];
}

export async function markAsRead(notificationId) {
  try {
    const res = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      window.dispatchEvent(new Event('notifications_updated'));
      return true;
    }
  } catch (e) {
    console.warn("Error marking notification read:", e);
  }
  return false;
}

export async function markAllAsRead(userId) {
  try {
    const list = await getNotifications(userId);
    for (const notif of list) {
      if (!notif.read && !notif.is_read) {
        await markAsRead(notif.id);
      }
    }
    window.dispatchEvent(new Event('notifications_updated'));
  } catch (e) {}
}

export async function dismissNotification(notificationId) {
  await markAsRead(notificationId);
}

export async function clearReadNotifications(userId) {
  window.dispatchEvent(new Event('notifications_updated'));
}

export async function deleteNotification(notificationId) {
  await markAsRead(notificationId);
}

export async function clearAllNotifications(userId) {
  await markAllAsRead(userId);
}

export async function createNotification({ userId, title, message, type, link }) {
  return { id: `notif_${Date.now()}`, title, message };
}
