# ReliefOps Replit Build Brief

ReliefOps is a crisis logistics web app for NGOs and non-profits. It is designed for fast reallocation of medicine, food, hygiene supplies, and first-aid items across multiple shelters or hubs after climate events or other crises. The main problem it solves is poor visibility caused by spreadsheets and fragmented coordination, while the core promise is faster matching and dispatch through live stock visibility, request handling, and volunteer task assignment.[cite:96][cite:74]

## Product goal

Build a production-looking MVP that feels immediately usable in a hackathon demo. The app should let an NGO coordinator upload existing stock from CSV, view stock across many hubs, receive incoming requests, rank candidate hubs by route travel time, create transfers, and assign volunteers to logistics tasks.[cite:96][cite:135]

## Core pitch

Small NGOs often manage crisis stock with spreadsheets and chat tools, which slows coordination and reduces visibility during urgent events.[cite:96][cite:74] ReliefOps turns scattered inventory into a live multi-hub dispatch system with request prioritization, travel-time-based matching, and lightweight volunteer coordination.[cite:96][cite:135]

## Main users

### NGO coordinator
- Sees global inventory visibility across hubs.
- Reviews urgent requests.
- Chooses the best dispatch source based on route travel time.
- Creates and tracks transfers.
- Can edit stock only for their own hub through role-based permissions.[cite:147][cite:149]

### Volunteer lead
- Views available volunteers.
- Assigns volunteers to logistics tasks.
- Matches by location, vehicle, and availability.
- Can assign multiple tasks to the same volunteer when needed.[cite:122]

## Problem statement

Current workflows rely on spreadsheets, old systems, and poor stock visibility. The app should reduce time spent figuring out what is available, where it is, and who can move it. The focus is not generic inventory management; the focus is crisis reallocation and fast dispatch across multiple hubs.[cite:96][cite:97]

## One-sentence promise

This app helps NGO coordinators and volunteer leads reallocate medicine, first-aid instruments, food, and relief supplies across many hubs more quickly and clearly than classic spreadsheet-based systems during crisis and climate events.

## MVP scope

### Included
- Multi-hub inventory visibility.
- Global dashboard and hub-specific views.
- CSV upload to update stock.
- Manual stock entry.
- Camera barcode scanning in supported browsers.
- Request creation with priorities and statuses.
- Matching of candidate hubs by route travel time.
- Transfer planning from one or more hubs.
- Volunteer task assignment.
- Stock reduction only when a transfer is marked Dispatched.
- Expiry tracking for medicine and food.
- Optional image for item or hub, with icon fallback.
- Low-stock warning.
- Duplicate-item warning.[cite:110][cite:111][cite:135][cite:134]

### Not the focus
- Full enterprise ERP.
- Complex forecasting models.
- Advanced map interface.
- Full donor management.
- Complex approval chains.

## Key workflows

### Workflow 1: Import stock
1. Coordinator uploads a CSV exported from an old spreadsheet.
2. System updates existing stock rows instead of replacing all data.
3. Stock becomes visible globally and by hub.

### Workflow 2: Create urgent request
1. Coordinator or field-side operator creates a request.
2. Request contains multiple items and simple quantity units.
3. Request gets a priority and lifecycle status.

### Workflow 3: Match hubs
1. System finds hubs with required items in stock.
2. Candidate hubs are ranked by route travel time, not straight-line distance.
3. Coordinator can choose one or multiple hubs to fulfill the request.[cite:135][cite:127]

### Workflow 4: Dispatch
1. Coordinator creates a transfer.
2. Stock does not decrease yet while transfer is only planned.
3. When status changes to Dispatched, stock is reduced.
4. When status changes to Delivered, request can be completed.[cite:130]

### Workflow 5: Volunteer coordination
1. Volunteer lead sees active transfers.
2. Volunteer lead assigns people to Pickup, Delivery/Transfer, or Stock Count tasks.
3. Matching uses location, availability, and vehicle access.
4. Volunteers may handle multiple tasks at once when needed.[cite:122]

## Product rules

- Main product type: hybrid, but mostly Relief Inventory Tracker.
- Main users: NGO coordinator and volunteer lead.
- Main pain: no visibility and old spreadsheet-based workflows.
- Core objects: item stock, donation or sending request, volunteer task assignment.
- Locations: many shelters or hubs.
- Time sensitivity: real-time operations.
- Demo wow factor: upload stock file and instantly operate a ready-to-use crisis dispatch app.
- Input methods: CSV upload, barcode camera scan, manual entry.
- Success metrics: faster matching and faster dispatch.
- Item quantities: simple units only.
- Expiry tracking: medicine and food.
- Stock edits: only coordinator of that hub.
- Request statuses: Draft, Open, Assigned, Dispatched, Delivered.
- Request priorities: Low, Medium, Urgent, Critical.
- Volunteer matching: location, vehicle, availability.
- Task types: Pickup, Delivery/Transfer, Stock Count.
- Distance logic: route travel time.
- Image support: optional, fallback to icon.
- Dispatch logic: reduce stock only when marked Dispatched.
- V1 view: ranked list by distance/travel time, not a map.

## User stories

### Coordinator stories
- As an NGO coordinator, I want to upload stock from CSV so spreadsheet data becomes live inventory quickly.
- As an NGO coordinator, I want to see stock across all hubs so I can compare availability fast.
- As an NGO coordinator, I want candidate hubs ranked by route travel time so I can choose the fastest dispatch source.[cite:135]
- As an NGO coordinator, I want to split a request across multiple hubs so urgent requests can still be fulfilled.
- As an NGO coordinator, I want stock to decrease only when a transfer is marked Dispatched so planned transfers do not distort inventory.[cite:130]
- As an NGO coordinator, I want low-stock and duplicate-item warnings so I can reduce stockouts and bad data.[cite:74][cite:88]

### Volunteer lead stories
- As a volunteer lead, I want to assign volunteers to Pickup, Delivery/Transfer, or Stock Count tasks so operational work is coordinated clearly.
- As a volunteer lead, I want to filter volunteers by location, vehicle, and availability so the assigned person can actually perform the task.
- As a volunteer lead, I want volunteers to hold multiple tasks when necessary so operations stay flexible.

### Hub coordinator stories
- As a hub coordinator, I want to edit only my hub's inventory so stock responsibility is clear and protected by role permissions.[cite:147][cite:149]
- As a hub coordinator, I want to update stock through manual entry or barcode camera scan so I can work quickly in the field or warehouse.[cite:110][cite:111]

## Acceptance criteria

- Requests support statuses Draft, Open, Assigned, Dispatched, and Delivered.
- Requests support priorities Low, Medium, Urgent, and Critical.
- A request can be fulfilled from one or more hubs.
- Candidate hubs are ranked by route travel time.[cite:135]
- Stock decreases only when the transfer status becomes Dispatched.[cite:130]
- Only the coordinator assigned to a hub can modify that hub's stock.[cite:147][cite:149]
- CSV import updates matching rows instead of replacing all stock.
- Barcode scanning works with device camera in supported browsers.[cite:110][cite:154]
- Volunteers can have multiple active tasks.
- Task types are limited to Pickup, Delivery/Transfer, and Stock Count.
- Medicine and food items can track expiry dates.[cite:134]
- If an image is missing, the UI shows a category or hub icon instead.
- The app supports both a global dashboard and hub-specific stock views.

## Technical stack

- Frontend: React + Vite in Replit.
- Styling: Tailwind CSS, optionally shadcn/ui for speed.
- Backend and database: Supabase.
- Auth and authorization: Supabase Auth and Row Level Security policies using `auth.uid()` and membership checks.[cite:147][cite:153]
- Travel time ranking: OpenRouteService Matrix API.[cite:135][cite:156]
- Barcode scanning: `html5-qrcode`.[cite:110][cite:154]
- CSV parsing: PapaParse.

## Replit secrets

Create these environment secrets in Replit:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ORS_API_KEY`

## Suggested file structure

```text
src/
  components/
    BarcodeScanner.tsx
    StockUpload.tsx
    TaskAssignModal.tsx
    StatCard.tsx
    PriorityBadge.tsx
  lib/
    supabase.ts
    ors.ts
    csv.ts
    utils.ts
  pages/
    Login.tsx
    Dashboard.tsx
    Hubs.tsx
    HubDetail.tsx
    Requests.tsx
    RequestDetail.tsx
    Volunteers.tsx
    ActivityLog.tsx
  types/
    db.ts
  App.tsx
  main.tsx
```

## Database model

Create these main tables in Supabase:

- `profiles`
- `hubs`
- `hub_members`
- `items`
- `hub_stock`
- `requests`
- `request_items`
- `transfers`
- `transfer_items`
- `volunteers`
- `tasks`
- `activity_log`

### Suggested schema

```sql
create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  app_role text not null check (app_role in ('coordinator','volunteer_lead')),
  created_at timestamptz default now()
);

create table hubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  image_url text,
  created_at timestamptz default now()
);

create table hub_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hub_id uuid not null references hubs(id) on delete cascade,
  role text not null check (role in ('coordinator','volunteer_lead')),
  unique(user_id, hub_id)
);

create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Medicine','Food','Hygiene','First Aid')),
  barcode text,
  unit text not null default 'units',
  image_url text,
  tracks_expiry boolean not null default false,
  created_at timestamptz default now()
);

create table hub_stock (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references hubs(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  expiry_date date,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  unique(hub_id, item_id, expiry_date)
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  requesting_hub_id uuid not null references hubs(id),
  priority text not null check (priority in ('Low','Medium','Urgent','Critical')),
  status text not null check (status in ('Draft','Open','Assigned','Dispatched','Delivered')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  item_id uuid not null references items(id),
  quantity_needed integer not null check (quantity_needed > 0)
);

create table transfers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  from_hub_id uuid not null references hubs(id),
  to_hub_id uuid not null references hubs(id),
  status text not null check (status in ('Planned','Dispatched','Delivered')),
  eta_minutes integer,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references transfers(id) on delete cascade,
  item_id uuid not null references items(id),
  quantity integer not null check (quantity > 0)
);

create table volunteers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  lat double precision,
  lng double precision,
  has_vehicle boolean default false,
  availability_status text not null check (availability_status in ('Available','Busy','Offline')),
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid references transfers(id) on delete cascade,
  volunteer_id uuid references volunteers(id) on delete set null,
  type text not null check (type in ('Pickup','Delivery/Transfer','Stock Count')),
  status text not null check (status in ('Open','Assigned','In Progress','Done')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

## Security model

Enable Row Level Security on all exposed tables. Supabase recommends RLS for tables in exposed schemas and supports authorization using `auth.uid()` in policies.[cite:147][cite:149]

### Security goals
- Users must be authenticated.
- Coordinators may edit only stock belonging to their hub.
- Volunteer leads can manage tasks and read volunteer information.
- Members can read data relevant to their own hubs.
- Use `hub_members` as the membership table for access control.[cite:147][cite:153]

### Starter RLS example

```sql
alter table profiles enable row level security;
alter table hubs enable row level security;
alter table hub_members enable row level security;
alter table hub_stock enable row level security;
alter table requests enable row level security;
alter table transfers enable row level security;

create policy "users read own profile"
on profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "members read hubs"
on hubs for select
to authenticated
using (
  id in (
    select hub_id from hub_members
    where user_id = (select auth.uid())
  )
);

create policy "members read stock for their hubs"
on hub_stock for select
to authenticated
using (
  hub_id in (
    select hub_id from hub_members
    where user_id = (select auth.uid())
  )
);

create policy "coordinators update stock for their hubs"
on hub_stock for update
to authenticated
using (
  hub_id in (
    select hub_id from hub_members
    where user_id = (select auth.uid()) and role = 'coordinator'
  )
)
with check (
  hub_id in (
    select hub_id from hub_members
    where user_id = (select auth.uid()) and role = 'coordinator'
  )
);
```

## Travel time matching

Use OpenRouteService Matrix API to rank candidate hubs by route travel time. The app should send a list of coordinates and request duration and distance metrics to rank hubs for dispatch.[cite:135][cite:156]

### ORS helper example

```ts
export async function getTravelTimes(locations: [number, number][]) {
  const res = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
    method: 'POST',
    headers: {
      'Authorization': import.meta.env.VITE_ORS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locations,
      metrics: ['duration', 'distance'],
      sources: ['0'],
      destinations: locations.slice(1).map((_, i) => String(i + 1)),
    }),
  });

  if (!res.ok) throw new Error('ORS matrix failed');
  return res.json();
}
```

## Barcode scanning

Use `html5-qrcode` for camera-based scanning in supported browsers. A React wrapper or direct component integration is acceptable for MVP.[cite:110][cite:154]

### Barcode component example

```tsx
import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function BarcodeScanner({ onScan }: { onScan: (code: string) => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 220, height: 220 } },
      false
    );

    scanner.render(
      (decodedText) => onScan(decodedText),
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScan]);

  return <div id="reader" />;
}
```

## CSV import behavior

CSV import should update existing stock instead of replacing all inventory. Use PapaParse or an equivalent parser. A likely CSV format is:

```text
hub_name,item_name,category,quantity,unit,expiry_date,barcode
```

Recommended behavior:
- Upsert item by barcode or name.
- Upsert stock by hub, item, and expiry date.
- Increase or update quantities according to selected import rule.
- Flag likely duplicates when barcode matches or name similarity is high.[cite:88]

## Suggested screens

### 1. Login
- Email login.
- Role-based redirect.

### 2. Global dashboard
- Cards for urgent requests, low stock, available volunteers, active transfers.
- Cross-hub stock visibility.
- Quick links to create request and import stock.

### 3. Hub detail
- Stock table.
- CSV upload.
- Manual item add.
- Barcode scan.
- Expiry indicators.

### 4. Requests list
- Filter by priority and status.
- Search by hub or item.

### 5. Request detail
- Requested items.
- Candidate hubs ranked by travel time.
- Create transfer from one or more hubs.
- Status controls.

### 6. Volunteers
- Volunteer list.
- Filters: availability, vehicle, distance or location.
- Assign tasks to transfers.

### 7. Activity log
- Timeline of stock edits, transfers, and status changes.

## 24-hour build order

### P0 first
1. Set up Supabase project and auth.
2. Create schema.
3. Seed demo data.
4. Build dashboard shell.
5. Build stock table and hub view.
6. Add CSV import.
7. Add request flow.
8. Add travel-time hub ranking.
9. Add transfers and statuses.
10. Add volunteer assignment.[cite:147][cite:135]

### P1 next
11. Add barcode scanning.[cite:110][cite:154]
12. Add low-stock and duplicate detection.[cite:74][cite:88]
13. Add image fallback and icons.
14. Add activity log.

## Demo script

Use this exact demo flow for judges:

1. Import stock CSV for three hubs.
2. Show the global dashboard instantly populated.
3. Open an urgent request for medicine and food.
4. Show matching hubs ranked by route travel time.[cite:135]
5. Create a transfer from two hubs.
6. Assign volunteers to Pickup and Delivery/Transfer tasks.
7. Mark transfer as Dispatched and show stock reduction.
8. Mark request Delivered and show activity log update.

## Seed data recommendation

Seed the app with:
- 3 hubs, for example Barcelona, Girona, and Tarragona.
- 12 to 20 items across medicine, food, hygiene, and first aid.
- 8 volunteers with mixed availability and vehicle access.
- 3 requests with different priorities.

The app should feel alive immediately; empty CRUD screens will demo poorly in a buildathon setting.[cite:41][cite:50]

## Design guidance

- Make it feel ready for crisis use on first load.
- Prioritize clarity over decoration.
- Use urgency colors sparingly for request priorities.
- Show ranked hub matches as the core moment.
- Use icons when images are missing.
- Keep the global dashboard actionable, not just informational.

## Final instruction for the Replit agent

Build a React + Vite app called ReliefOps for NGOs and crisis response. Use Supabase for auth and database. Users are coordinators and volunteer leads. Coordinators can only edit stock for their own hub. The app tracks relief inventory across multiple hubs, supports CSV stock updates, manual entry, and camera barcode scanning. Users can create supply requests with priority and status, see matching hubs ranked by route travel time using OpenRouteService Matrix API, create transfers from one or more hubs, assign volunteers to Pickup, Delivery/Transfer, or Stock Count tasks, and reduce stock only when a transfer is marked Dispatched. Include a global dashboard, hub view, requests list and detail, volunteer task assignment, and activity log. Categories are Medicine, Food, Hygiene, and First Aid. Add low-stock warnings and duplicate item warnings if possible.
