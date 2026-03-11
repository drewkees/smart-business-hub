export function SettingsPanel() {
  const items = [
    { title: "Business Profile", desc: "Name, address, logo, business type" },
    { title: "User & Role Management", desc: "Manage staff accounts and permissions" },
    { title: "Notifications", desc: "Low stock alerts, updates, reports" },
    { title: "Security", desc: "Password policy, 2FA, session settings" },
    { title: "Appearance", desc: "Theme, color scheme, layout preferences" },
    { title: "POS Configuration", desc: "Receipt format, tax settings, payment methods" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">System Settings</h1>
      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.title} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="font-semibold text-slate-900">{s.title}</p>
            <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
