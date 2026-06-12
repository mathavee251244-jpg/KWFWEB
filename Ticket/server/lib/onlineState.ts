const online = new Set<string>();

export const setOnline = (userId: string) => online.add(userId);
export const setOffline = (userId: string) => online.delete(userId);
export const getOnlineUsers = () => Array.from(online);
export const isOnline = (userId: string) => online.has(userId);
