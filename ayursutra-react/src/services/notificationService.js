import API from './api';

export const getNotifications = async () => {
    const res = await API.get('/notifications');
    return res.data;
};

export const markRead = async (id) => {
    const res = await API.put(`/notifications/${id}/read`);
    return res.data;
};

export const markAllRead = async () => {
    const res = await API.put('/notifications/read-all/mark');
    return res.data;
};

export const sendManualNotification = async (data) => {
    const res = await API.post('/notifications/send', data);
    return res.data;
};

export const getNotificationPrefs = async () => {
    const res = await API.get('/notifications/prefs');
    return res.data.data;
};

export const updateNotificationPrefs = async (prefs) => {
    const res = await API.put('/notifications/prefs', prefs);
    return res.data.data;
};
