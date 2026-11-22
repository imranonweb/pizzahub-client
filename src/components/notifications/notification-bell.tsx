"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/components/providers/notification-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "./notification-dropdown";

interface NotificationBellProps {
  className?: string;
  align?: "start" | "center" | "end";
}

export function NotificationBell({
  className,
  align = "end",
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { unreadCount, isLoading } = useNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            className={cn(
              "relative size-9 rounded-xl bg-card transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              open && "bg-muted text-foreground",
              className,
            )}
          />
        }
      >
        <Bell
          className="size-4.5 text-muted-foreground transition-colors group-hover:text-foreground"
          aria-hidden="true"
        />

        {/* Unread Indicator Badge */}
        {!isLoading && unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align={align}
        side="bottom"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl p-0 sm:w-96"
      >
        <NotificationDropdown onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
