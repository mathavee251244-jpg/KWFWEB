# Icons Directory

วาง custom icon assets ที่นี่เมื่อพร้อม

## โครงสร้างที่แนะนำ

```
src/assets/icons/
├── app/              — App module icons (PNG/SVG 48x48 หรือ 96x96 @2x)
│   ├── home.svg
│   ├── submit-ticket.svg
│   ├── my-tickets.svg
│   ├── all-tickets.svg
│   ├── it-dashboard.svg
│   ├── knowledge-base.svg
│   ├── system-status.svg
│   ├── user-management.svg
│   ├── ot-record.svg
│   ├── email-dashboard.svg
│   └── speed-test.svg
├── status/           — Ticket status icons (16x16)
│   ├── new.svg
│   ├── assigned.svg
│   ├── in-progress.svg
│   ├── resolved.svg
│   └── closed.svg
└── logo/             — Company logo / branding
    ├── logo.svg
    └── logo-white.svg
```

## การใช้งาน

เมื่อมี icon พร้อมแล้ว ให้นำไปแทนที่ใน:
- `src/components/layout/Desktop.tsx` — Desktop icon tiles
- `src/components/layout/AppWindow.tsx` — Title bar icon
- `src/App.tsx` — moduleMap icon

ปัจจุบันใช้ Lucide React icons เป็น placeholder
