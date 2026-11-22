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
  isLoading: boolean;
  isRefetching: boolean;
  source: "live" | "unavailable";
  notice?: string;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [source, setSource] = useState<"live" | "unavailable">("unavailable");
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const loadNotifications = useCallback(
    async (isBackground = false) => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
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
        const response = await fetchNotifications();
        setSource(response.source);
        setNotifications(response.items);
        setUnreadCount(response.unreadCount);
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

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (source === "live") {
        const res = await apiMarkAsRead(id);
        if (!res.ok) {
          toast.add({
            title: "Notification update",
            description: res.message,
            type: "info",
          });
        }
      }
    },
    [source],
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);

    if (source === "live") {
      const res = await apiMarkAllAsRead();
      if (!res.ok) {
        toast.add({
          title: "Notification update",
          description: res.message,
          type: "info",
        });
      } else {
        toast.add({
          title: "Notifications cleared",
          description: "All notifications have been marked as read.",
          type: "success",
        });
      }
    } else {
      toast.add({
        title: "All marked as read",
        description: "Unread notification badges cleared locally.",
        type: "success",
      });
    }
  }, [source]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
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
