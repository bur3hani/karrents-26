import React, { useState } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Trash2, 
  AlertTriangle, 
  Info,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'ALERT' | 'WARNING' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkText?: string;
  linkTarget?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_01',
      type: 'ALERT',
      title: 'Emergency Patches Released: Apache ActiveMQ RCE',
      message: 'Urgent exploitation of CVE-2023-46604 (Remote Code Execution) is tracked in production sectors. Deploy localized Java runtime argument barriers immediately.',
      timestamp: '2026-07-15T15:04:00Z',
      isRead: false,
      linkText: 'Inspect CVE Details',
      linkTarget: 'cve'
    },
    {
      id: 'notif_02',
      type: 'WARNING',
      title: 'SSL Certificate Nearing Expiry',
      message: 'Diagnostic target cert for staging.banking-internal.net is expiring in 3 days. Prepare immediate RSA-4096 rollover certificate blocks.',
      timestamp: '2026-07-15T10:12:00Z',
      isRead: false,
      linkText: 'Check Active Cert Status',
      linkTarget: 'ssl'
    },
    {
      id: 'notif_03',
      type: 'SUCCESS',
      title: 'HTTP Headers Audit Complete',
      message: 'Vulnerability scan report completed with score of 80/100 (Grade B) for target github.com. Threat risk minimized.',
      timestamp: '2026-07-15T09:34:00Z',
      isRead: true,
      linkText: 'View Saved Report',
      linkTarget: 'saved-reports'
    }
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ALERT': return <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />;
      default: return <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  const getBorderColor = (type: string, isRead: boolean) => {
    if (isRead) return 'border-zinc-800/40 bg-zinc-900/15';
    switch (type) {
      case 'ALERT': return 'border-red-500/30 bg-red-500/5';
      case 'WARNING': return 'border-amber-500/30 bg-amber-500/5';
      case 'SUCCESS': return 'border-green-500/30 bg-green-500/5';
      default: return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <div id="notifications-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            Security Notification Center
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time feed indicators mapping emergency CVE bulletins, CISA exploitation lists, and certificate rollovers.
          </p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button
            id="btn-mark-all-read"
            onClick={handleMarkAllAsRead}
            className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800 text-xs px-3.5 py-1.5 rounded-lg transition-colors font-semibold"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications feed */}
      <div className="max-w-3xl mx-auto space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            id={`notif-item-${n.id}`}
            onClick={() => handleMarkAsRead(n.id)}
            className={`border p-4.5 rounded-xl transition-all flex items-start gap-3.5 relative cursor-pointer ${getBorderColor(n.type, n.isRead)}`}
          >
            {getIcon(n.type)}
            
            <div className="space-y-1 flex-1 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className={`font-bold text-zinc-200 ${!n.isRead ? 'text-white font-extrabold' : ''}`}>{n.title}</span>
                <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-zinc-400 leading-relaxed">{n.message}</p>
              
              {n.linkText && (
                <div className="pt-2">
                  <span className="text-blue-400 font-bold inline-flex items-center gap-0.5 hover:underline text-[10px]">
                    <span>{n.linkText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}
            </div>

            <button
              id={`btn-delete-notif-${n.id}`}
              onClick={(e) => handleDelete(n.id, e)}
              className="text-zinc-500 hover:text-red-400 transition-colors p-1"
              title="Delete notification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {!n.isRead && (
              <span className="absolute top-4 left-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-16 text-center text-zinc-500 space-y-2">
            <Bell className="w-12 h-12 mx-auto text-zinc-600" />
            <h3 className="font-bold text-zinc-300 text-sm">Clear Horizons</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              No pending security events or infrastructure certificate expirations detected. Enjoy the clear slate!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
