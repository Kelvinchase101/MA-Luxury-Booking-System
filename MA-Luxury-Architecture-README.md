# MA Luxury Booking App Architecture

The monolithic `App.jsx` has been split into a maintainable feature-based structure.

```text
App.jsx
src/
├── config.js
├── components/
│   ├── Admin.jsx                 # Admin barrel / public exports
│   ├── Auth.jsx
│   ├── Availability.jsx
│   ├── Booking.jsx
│   ├── Loader.jsx
│   ├── Navigation.jsx
│   ├── Occupancy.jsx
│   ├── UI.jsx
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── AdminWidgets.jsx
│       ├── EditModal.jsx
│       ├── PropertyStudio.jsx
│       └── SettingsPanel.jsx
├── lib/
│   ├── sheets.js
│   ├── storage.js
│   ├── supabase.js
│   └── utils.js
└── styles/
    └── Style.jsx
```

## Responsibilities

- `App.jsx`: application shell, routing state, composition.
- `config.js`: apartment catalogue defaults, environment configuration, app keys.
- `components/Booking.jsx`: conversational guest booking flow.
- `components/Availability.jsx`: public availability experience.
- `components/Occupancy.jsx`: private admin occupancy view.
- `components/admin/AdminDashboard.jsx`: admin operations dashboard.
- `components/admin/PropertyStudio.jsx`: apartment pricing and gallery management.
- `components/admin/SettingsPanel.jsx`: settings, QR image and integrations.
- `components/admin/EditModal.jsx`: reservation editing.
- `lib/supabase.js`: Supabase Auth, database and Storage API calls.
- `lib/storage.js`: local persistence and gallery fallback.
- `lib/sheets.js`: Google Sheets integration.
- `lib/utils.js`: dates, conflicts and shared helpers.
- `styles/Style.jsx`: application styling.

## Supabase next step

Use the supplied `supabase_schema.sql` first, then `supabase_auth_rls.sql` for the authenticated admin/RLS layer.

Do not put a Supabase service-role key in the React app. Only use the public anon/publishable key in Vite environment variables.
