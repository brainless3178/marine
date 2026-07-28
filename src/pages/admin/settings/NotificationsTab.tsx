import { ToggleLeft, ToggleRight } from 'lucide-react'
import type { NotificationPrefs } from './types'
import { inputClass, labelClass } from './types'

interface NotificationsTabProps {
  notifs: NotificationPrefs
  updateNotif: <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => void
}

export function NotificationsTab({ notifs, updateNotif }: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Order Events</h3>
        <div className="space-y-3">
          {([
            ['orderPlaced', 'New Order Placed', 'Notify when a customer places a new order'],
            ['orderConfirmed', 'Order Confirmed', 'Notify when an order is confirmed by staff'],
            ['orderShipped', 'Order Shipped', 'Notify when tracking info is added'],
            ['orderDelivered', 'Order Delivered', 'Notify when order is marked as delivered'],
            ['orderCancelled', 'Order Cancelled', 'Notify when an order is cancelled'],
          ] as const).map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{title}</p>
                <p className="text-[0.625rem] text-[var(--text-muted)]">{desc}</p>
              </div>
              <button onClick={() => updateNotif(key, !notifs[key])}>
                {notifs[key] ? <ToggleRight size={28} className="text-[var(--success)]" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Inventory Alerts</h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-xs font-bold text-[var(--text-primary)]">Low Stock Alert</p>
            <p className="text-[0.625rem] text-[var(--text-muted)]">Notify when product stock falls below threshold</p>
          </div>
          <button onClick={() => updateNotif('lowStock', !notifs.lowStock)}>
            {notifs.lowStock ? <ToggleRight size={28} className="text-[var(--success)]" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">RFQ Alerts</h3>
        <div className="space-y-3">
          {([
            ['rfqReceived', 'New RFQ Received', 'Notify when a customer submits a new request for quote'],
            ['rfqAssigned', 'RFQ Assigned to You', 'Notify when an RFQ is assigned to your team'],
            ['rfqUrgent', 'Urgent RFQ', 'Notify on high-urgency RFQ submissions'],
          ] as const).map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{title}</p>
                <p className="text-[0.625rem] text-[var(--text-muted)]">{desc}</p>
              </div>
              <button onClick={() => updateNotif(key, !notifs[key])}>
                {notifs[key] ? <ToggleRight size={28} className="text-[var(--success)]" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Reports & Summaries</h3>
        <div className="space-y-3">
          {([
            ['newCustomer', 'New Customer Registration', 'Notify when a new customer account is created'],
            ['weeklyReport', 'Weekly Sales Report', 'Receive a weekly summary of orders and revenue'],
            ['monthlyReport', 'Monthly Business Report', 'Receive a monthly report with analytics and trends'],
          ] as const).map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{title}</p>
                <p className="text-[0.625rem] text-[var(--text-muted)]">{desc}</p>
              </div>
              <button onClick={() => updateNotif(key, !notifs[key])}>
                {notifs[key] ? <ToggleRight size={28} className="text-[var(--success)]" /> : <ToggleLeft size={28} className="text-[var(--text-muted)]" />}
              </button>
            </div>
          ))}
          <div>
            <label className={labelClass}>Report Recipient Email</label>
            <input type="email" value={notifs.reportEmail} onChange={(e) => updateNotif('reportEmail', e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  )
}
