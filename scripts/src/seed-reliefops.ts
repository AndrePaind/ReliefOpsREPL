import { db } from "@workspace/db";
import {
  hubsTable, itemsTable, hubStockTable,
  requestsTable, requestItemsTable,
  transfersTable, transferItemsTable,
  volunteersTable, tasksTable,
  activityLogTable,
} from "@workspace/db";

async function seed() {
  console.log("Seeding ReliefOps demo data…");

  // ── Hubs ──────────────────────────────────────────────────────────────────
  const [hubBCN] = await db.insert(hubsTable).values({
    name: "Barcelona Central",
    address: "Carrer de Provença 123, Barcelona",
    lat: 41.3874,
    lng: 2.1686,
    imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&q=80",
  }).onConflictDoNothing().returning();

  const [hubGIR] = await db.insert(hubsTable).values({
    name: "Girona Depot",
    address: "Carrer de Santa Clara 45, Girona",
    lat: 41.9794,
    lng: 2.8214,
    imageUrl: "https://images.unsplash.com/photo-1565793979484-1c50e1f77e52?w=800&q=80",
  }).onConflictDoNothing().returning();

  const [hubTGN] = await db.insert(hubsTable).values({
    name: "Tarragona Relief Point",
    address: "Rambla Nova 78, Tarragona",
    lat: 41.1189,
    lng: 1.2445,
    imageUrl: "https://images.unsplash.com/photo-1610141490498-bbea1c1df3f3?w=800&q=80",
  }).onConflictDoNothing().returning();

  // Use existing hubs if conflict (re-run safety)
  const hubs = await db.select().from(hubsTable);
  const bcn = hubs.find((h) => h.name === "Barcelona Central")!;
  const gir = hubs.find((h) => h.name === "Girona Depot")!;
  const tgn = hubs.find((h) => h.name === "Tarragona Relief Point")!;

  // ── Items ─────────────────────────────────────────────────────────────────
  const itemDefs = [
    { name: "Amoxicillin 500mg", category: "Medicine", unit: "boxes", barcode: "5901234123457", tracksExpiry: true },
    { name: "Ibuprofen 400mg", category: "Medicine", unit: "boxes", barcode: "5901234123458", tracksExpiry: true },
    { name: "Oral Rehydration Salts", category: "Medicine", unit: "sachets", barcode: "5901234123459", tracksExpiry: true },
    { name: "Rice (5kg bag)", category: "Food", unit: "bags", barcode: "5901234123460", tracksExpiry: true },
    { name: "Canned Beans", category: "Food", unit: "cans", barcode: "5901234123461", tracksExpiry: true },
    { name: "Bottled Water (1.5L)", category: "Food", unit: "bottles", barcode: "5901234123462", tracksExpiry: false },
    { name: "Protein Bars", category: "Food", unit: "boxes", barcode: "5901234123463", tracksExpiry: true },
    { name: "Soap (bar)", category: "Hygiene", unit: "bars", barcode: "5901234123464", tracksExpiry: false },
    { name: "Toothbrush Kit", category: "Hygiene", unit: "kits", barcode: "5901234123465", tracksExpiry: false },
    { name: "Sanitary Pads", category: "Hygiene", unit: "packs", barcode: "5901234123466", tracksExpiry: false },
    { name: "Disposable Gloves (M)", category: "First Aid", unit: "boxes", barcode: "5901234123467", tracksExpiry: true },
    { name: "Sterile Bandages", category: "First Aid", unit: "packs", barcode: "5901234123468", tracksExpiry: true },
    { name: "Antiseptic Wipes", category: "First Aid", unit: "boxes", barcode: "5901234123469", tracksExpiry: true },
    { name: "Thermal Blankets", category: "First Aid", unit: "units", barcode: "5901234123470", tracksExpiry: false },
    { name: "Insulin (10ml vial)", category: "Medicine", unit: "vials", barcode: "5901234123471", tracksExpiry: true },
  ] as const;

  const insertedItems: typeof itemsTable.$inferSelect[] = [];
  for (const def of itemDefs) {
    const existing = await db.select().from(itemsTable).then((rows) => rows.find((r) => r.name === def.name));
    if (existing) { insertedItems.push(existing); continue; }
    const [item] = await db.insert(itemsTable).values({
      name: def.name,
      category: def.category as any,
      unit: def.unit,
      barcode: def.barcode,
      tracksExpiry: def.tracksExpiry,
    }).returning();
    insertedItems.push(item);
  }

  const itemByName = (name: string) => insertedItems.find((i) => i.name === name)!;

  // ── Hub Stock ─────────────────────────────────────────────────────────────
  const today = new Date();
  const expIn60 = new Date(today.getTime() + 60 * 86400000).toISOString().slice(0, 10);
  const expIn20 = new Date(today.getTime() + 20 * 86400000).toISOString().slice(0, 10); // warning!
  const expIn10 = new Date(today.getTime() + 10 * 86400000).toISOString().slice(0, 10); // warning!

  const stockDefs: Array<{ hub: typeof bcn; itemName: string; quantity: number; expiry?: string }> = [
    // BCN
    { hub: bcn, itemName: "Amoxicillin 500mg", quantity: 120, expiry: expIn60 },
    { hub: bcn, itemName: "Ibuprofen 400mg", quantity: 8, expiry: expIn20 },  // LOW STOCK + expiry warning
    { hub: bcn, itemName: "Oral Rehydration Salts", quantity: 45 },
    { hub: bcn, itemName: "Rice (5kg bag)", quantity: 200 },
    { hub: bcn, itemName: "Canned Beans", quantity: 350 },
    { hub: bcn, itemName: "Bottled Water (1.5L)", quantity: 500 },
    { hub: bcn, itemName: "Protein Bars", quantity: 80, expiry: expIn60 },
    { hub: bcn, itemName: "Soap (bar)", quantity: 150 },
    { hub: bcn, itemName: "Sanitary Pads", quantity: 5 },  // LOW STOCK
    { hub: bcn, itemName: "Disposable Gloves (M)", quantity: 40 },
    { hub: bcn, itemName: "Sterile Bandages", quantity: 3, expiry: expIn10 }, // LOW + expiry warning
    { hub: bcn, itemName: "Antiseptic Wipes", quantity: 60 },
    { hub: bcn, itemName: "Thermal Blankets", quantity: 25 },
    { hub: bcn, itemName: "Insulin (10ml vial)", quantity: 6, expiry: expIn20 }, // LOW STOCK + expiry warning
    // GIR
    { hub: gir, itemName: "Amoxicillin 500mg", quantity: 30, expiry: expIn60 },
    { hub: gir, itemName: "Ibuprofen 400mg", quantity: 50 },
    { hub: gir, itemName: "Rice (5kg bag)", quantity: 80 },
    { hub: gir, itemName: "Canned Beans", quantity: 120 },
    { hub: gir, itemName: "Bottled Water (1.5L)", quantity: 200 },
    { hub: gir, itemName: "Soap (bar)", quantity: 40 },
    { hub: gir, itemName: "Toothbrush Kit", quantity: 55 },
    { hub: gir, itemName: "Disposable Gloves (M)", quantity: 25 },
    { hub: gir, itemName: "Sterile Bandages", quantity: 80 },
    { hub: gir, itemName: "Thermal Blankets", quantity: 15 },
    { hub: gir, itemName: "Insulin (10ml vial)", quantity: 20, expiry: expIn60 },
    // TGN
    { hub: tgn, itemName: "Oral Rehydration Salts", quantity: 200 },
    { hub: tgn, itemName: "Rice (5kg bag)", quantity: 150 },
    { hub: tgn, itemName: "Canned Beans", quantity: 90 },
    { hub: tgn, itemName: "Protein Bars", quantity: 7, expiry: expIn10 }, // LOW + expiry warning
    { hub: tgn, itemName: "Soap (bar)", quantity: 100 },
    { hub: tgn, itemName: "Sanitary Pads", quantity: 60 },
    { hub: tgn, itemName: "Antiseptic Wipes", quantity: 4 },  // LOW STOCK
    { hub: tgn, itemName: "Thermal Blankets", quantity: 50 },
    { hub: tgn, itemName: "Ibuprofen 400mg", quantity: 35 },
    { hub: tgn, itemName: "Disposable Gloves (M)", quantity: 12 },
  ];

  for (const s of stockDefs) {
    const item = itemByName(s.itemName);
    if (!item) continue;
    const existing = await db.select().from(hubStockTable)
      .then((rows) => rows.find((r) => r.hubId === s.hub.id && r.itemId === item.id));
    if (existing) continue;
    await db.insert(hubStockTable).values({
      hubId: s.hub.id, itemId: item.id, quantity: s.quantity, expiryDate: s.expiry ?? null,
    });
  }

  // ── Volunteers ────────────────────────────────────────────────────────────
  const volDefs = [
    { fullName: "Elena Gómez", lat: 41.39, lng: 2.17, hasVehicle: true, availabilityStatus: "Available" },
    { fullName: "Marc Ferrer", lat: 41.38, lng: 2.16, hasVehicle: false, availabilityStatus: "Available" },
    { fullName: "Laia Puig", lat: 41.98, lng: 2.82, hasVehicle: true, availabilityStatus: "Busy" },
    { fullName: "Oriol Mas", lat: 41.97, lng: 2.81, hasVehicle: false, availabilityStatus: "Available" },
    { fullName: "Núria Vila", lat: 41.12, lng: 1.24, hasVehicle: true, availabilityStatus: "Available" },
    { fullName: "David Costa", lat: 41.11, lng: 1.23, hasVehicle: true, availabilityStatus: "Offline" },
    { fullName: "Sofia Roca", lat: 41.40, lng: 2.18, hasVehicle: false, availabilityStatus: "Available" },
    { fullName: "Pau Blanco", lat: 41.99, lng: 2.83, hasVehicle: true, availabilityStatus: "Busy" },
  ] as const;

  const insertedVols: typeof volunteersTable.$inferSelect[] = [];
  for (const v of volDefs) {
    const existing = await db.select().from(volunteersTable).then((rows) => rows.find((r) => r.fullName === v.fullName));
    if (existing) { insertedVols.push(existing); continue; }
    const [vol] = await db.insert(volunteersTable).values(v as any).returning();
    insertedVols.push(vol);
  }

  const volByName = (name: string) => insertedVols.find((v) => v.fullName === name)!;

  // ── Requests ──────────────────────────────────────────────────────────────
  const req1Existing = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === tgn.id && r.priority === "Critical"));

  let req1: typeof requestsTable.$inferSelect;
  if (req1Existing) {
    req1 = req1Existing;
  } else {
    [req1] = await db.insert(requestsTable).values({
      requestingHubId: tgn.id,
      priority: "Critical",
      status: "Open",
      notes: "Urgent medicine shortage following flood displacement. 400 people in temporary shelter.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: req1.id, itemId: itemByName("Amoxicillin 500mg").id, quantityNeeded: 50 },
      { requestId: req1.id, itemId: itemByName("Insulin (10ml vial)").id, quantityNeeded: 10 },
      { requestId: req1.id, itemId: itemByName("Sterile Bandages").id, quantityNeeded: 30 },
    ]);
  }

  const req2Existing = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === gir.id && r.priority === "Urgent"));

  let req2: typeof requestsTable.$inferSelect;
  if (req2Existing) {
    req2 = req2Existing;
  } else {
    [req2] = await db.insert(requestsTable).values({
      requestingHubId: gir.id,
      priority: "Urgent",
      status: "Assigned",
      notes: "Camp Nou Norte shelter running out of sanitary supplies. 200 displaced families.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: req2.id, itemId: itemByName("Sanitary Pads").id, quantityNeeded: 40 },
      { requestId: req2.id, itemId: itemByName("Soap (bar)").id, quantityNeeded: 80 },
      { requestId: req2.id, itemId: itemByName("Toothbrush Kit").id, quantityNeeded: 50 },
    ]);
  }

  const req3Existing = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === tgn.id && r.priority === "Medium"));

  let req3: typeof requestsTable.$inferSelect;
  if (req3Existing) {
    req3 = req3Existing;
  } else {
    [req3] = await db.insert(requestsTable).values({
      requestingHubId: tgn.id,
      priority: "Medium",
      status: "Draft",
      notes: "Restocking food supplies after distribution event.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: req3.id, itemId: itemByName("Rice (5kg bag)").id, quantityNeeded: 100 },
      { requestId: req3.id, itemId: itemByName("Canned Beans").id, quantityNeeded: 150 },
      { requestId: req3.id, itemId: itemByName("Protein Bars").id, quantityNeeded: 60 },
    ]);
  }

  // ── Transfers + Tasks ─────────────────────────────────────────────────────
  const existingTransfer = await db.select().from(transfersTable)
    .then((rows) => rows.find((r) => r.requestId === req2.id));

  if (!existingTransfer) {
    const [transfer1] = await db.insert(transfersTable).values({
      requestId: req2.id,
      fromHubId: bcn.id,
      toHubId: gir.id,
      status: "Dispatched",
      etaMinutes: 90,
    }).returning();

    await db.insert(transferItemsTable).values([
      { transferId: transfer1.id, itemId: itemByName("Sanitary Pads").id, quantity: 40 },
      { transferId: transfer1.id, itemId: itemByName("Soap (bar)").id, quantity: 80 },
    ]);

    const laia = volByName("Laia Puig");
    const pau = volByName("Pau Blanco");
    if (laia) {
      const [task1] = await db.insert(tasksTable).values({
        transferId: transfer1.id,
        volunteerId: laia.id,
        type: "Pickup",
        status: "In Progress",
      }).returning();
    }
    if (pau) {
      const [task2] = await db.insert(tasksTable).values({
        transferId: transfer1.id,
        volunteerId: pau.id,
        type: "Delivery/Transfer",
        status: "Assigned",
      }).returning();
    }
  }

  // ── Activity Log ──────────────────────────────────────────────────────────
  const existingActivity = await db.select().from(activityLogTable).then((rows) => rows.length);
  if (existingActivity === 0) {
    await db.insert(activityLogTable).values([
      { entityType: "request", entityId: req1.id, action: "created", payload: { priority: "Critical" } },
      { entityType: "request", entityId: req2.id, action: "created", payload: { priority: "Urgent" } },
      { entityType: "request", entityId: req2.id, action: "status_changed", payload: { status: "Assigned" } },
      { entityType: "transfer", entityId: "demo-transfer", action: "created", payload: { fromHub: "Barcelona", toHub: "Girona" } },
      { entityType: "transfer", entityId: "demo-transfer", action: "dispatched", payload: { fromHubId: bcn.id } },
      { entityType: "request", entityId: req3.id, action: "created", payload: { priority: "Medium" } },
    ]);
  }

  console.log("Seed complete!");
}

seed().catch((e) => { console.error(e); process.exit(1); });
