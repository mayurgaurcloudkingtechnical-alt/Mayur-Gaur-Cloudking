"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  CreditCard,
  Briefcase,
  FileText,
} from "lucide-react";
import { NotificationType } from "@prisma/client";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  const { data, refetch } = api.notifications.getMyNotifications.useQuery({
    limit: 10,
  });

  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllMutation = api.notifications.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.items || [];

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.FEE_PAYMENT:
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case NotificationType.CERTIFICATE:
        return <GraduationCap className="w-4 h-4 text-purple-600" />;
      case NotificationType.PLACEMENT:
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case NotificationType.PAYROLL:
        return <FileText className="w-4 h-4 text-indigo-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const timeAgo = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            {/* Popover Header */}
            <div className="p-3.5 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.isRead) {
                        markAsReadMutation.mutate({ notificationId: item.id });
                      }
                    }}
                    className={`p-3.5 px-4 flex gap-3 items-start transition cursor-pointer hover:bg-slate-50 ${
                      !item.isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 flex-shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${
                          !item.isRead ? "text-slate-900" : "text-slate-700"
                        }`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                        {item.message}
                      </p>
                      {item.link && (
                        <a
                          href={item.link}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 mt-1"
                        >
                          View Details <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
