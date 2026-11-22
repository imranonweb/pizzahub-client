"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { toast } from "@/components/ui/toast";
import {
  type AppNotification,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  markNotificationAsRead as apiMarkAsRead,
  fetchNotifications,
} from "@/lib/notifications-api";

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  isRefetching: boolean;
  source: "live" | "unavailable";
  notice?: string;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider.",
    );
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthSession();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [source, setSource] = useState<"live" | "unavailable">("unavailable");
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const loadNotifications = useCallback(
    async (isBackground = false) => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        setTotalCount(0);
        setSource("unavailable");
        setNotice(undefined);
        setIsLoading(false);
        setIsRefetching(false);
        return;
      }

      if (isBackground) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await fetchNotifications({ page: 1, limit: 20 });
        setSource(response.source);
        setNotifications(response.items);
        setUnreadCount(response.unreadCount);
        setTotalCount(response.totalCount);
        setNotice(response.notice);
      } catch (error) {
        setSource("unavailable");
        setNotice(
          error instanceof Error
            ? error.message
            : "Failed to load notifications.",
        );
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    const res = await apiMarkAsRead(id);
    if (!res.ok) {
      toast.add({
        title: "Could not mark notification as read",
        description: res.message,
        type: "error",
      });
      return false;
    }

    setNotifications((prev) => {
      let wasUnread = false;
      const next = prev.map((item) => {
        if (item.id === id) {
          if (!item.read) {
            wasUnread = true;
          }
          return res.notification ?? { ...item, read: true };
        }
        return item;
      });
      if (wasUnread) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return next;
    });

    return true;
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    const res = await apiMarkAllAsRead();
    if (!res.ok) {
      toast.add({
        title: "Could not mark notifications as read",
        description: res.message,
        type: "error",
      });
      return false;
    }

    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);

    toast.add({
      title: "Notifications cleared",
      description:
        res.count > 0
          ? `${res.count} ${res.count === 1 ? "notification" : "notifications"} marked as read.`
          : "All notifications are already read.",
      type: "success",
    });

    return true;
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      totalCount,
      isLoading,
      isRefetching,
      source,
      notice,
      markAsRead,
      markAllAsRead,
      refresh: () => loadNotifications(true),
    }),
    [
      notifications,
      unreadCount,
      totalCount,
      isLoading,
      isRefetching,
      source,
      notice,
      markAsRead,
      markAllAsRead,
      loadNotifications,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
