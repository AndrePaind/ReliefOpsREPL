import { db } from "@workspace/db";
import {
  hubsTable, itemsTable, hubStockTable,
  requestsTable, requestItemsTable,
  transfersTable, transferItemsTable,
  volunteersTable, tasksTable,
  activityLogTable,
  organizationsTable, orgMembersTable,
  boardPostsTable,
} from "@workspace/db";

async function seed() {
  console.log("Seeding ReliefOps Sudan demo data…");

  // ── Demo Organization ─────────────────────────────────────────────────────
  const DEMO_ORG_NAME = "UNICEF Sudan";
  let [demoOrg] = await db.select().from(organizationsTable).then((rows) => rows.filter((r) => r.name === DEMO_ORG_NAME));
  if (!demoOrg) {
    [demoOrg] = await db.insert(organizationsTable).values({
      name: DEMO_ORG_NAME,
      description: "UNICEF humanitarian operations in Sudan — logistics coordination",
      inviteCode: "SUDAN1",
      createdBy: "seed",
    }).returning();
    console.log(`  Created org: ${DEMO_ORG_NAME} (invite: SUDAN1)`);
  }

  // ── Hubs (Sudan locations) ─────────────────────────────────────────────────
  const hubDefs = [
    {
      name: "Khartoum Central Hub",
      address: "Al-Mek Nimir St, Khartoum, Sudan",
      lat: 15.5007,
      lng: 32.5599,
      imageUrl: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&q=80",
    },
    {
      name: "Port Sudan Depot",
      address: "Near Red Sea Port, Port Sudan",
      lat: 19.6158,
      lng: 37.2164,
      imageUrl: "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800&q=80",
    },
    {
      name: "El Fasher Field Base",
      address: "North Darfur, El Fasher, Sudan",
      lat: 13.6279,
      lng: 25.3494,
      imageUrl: "https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=800&q=80",
    },
    {
      name: "Kassala Relief Point",
      address: "Al Kassala, Kassala State, Sudan",
      lat: 15.4607,
      lng: 36.3997,
      imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80",
    },
  ];

  const insertedHubs: typeof hubsTable.$inferSelect[] = [];
  for (const def of hubDefs) {
    let [hub] = await db.select().from(hubsTable).then((rows) => rows.filter((r) => r.name === def.name && r.orgId === demoOrg.id));
    if (!hub) {
      [hub] = await db.insert(hubsTable).values({ ...def, orgId: demoOrg.id }).returning();
    }
    insertedHubs.push(hub);
  }

  const hubByName = (name: string) => insertedHubs.find((h) => h.name === name)!;
  const krt = hubByName("Khartoum Central Hub");
  const psd = hubByName("Port Sudan Depot");
  const elf = hubByName("El Fasher Field Base");
  const kas = hubByName("Kassala Relief Point");

  // ── Items ─────────────────────────────────────────────────────────────────
  const itemDefs = [
    { name: "Amoxicillin 500mg", category: "Medicine", unit: "boxes", barcode: "5901234123457", tracksExpiry: true },
    { name: "Oral Rehydration Salts", category: "Medicine", unit: "sachets", barcode: "5901234123459", tracksExpiry: true },
    { name: "Ibuprofen 400mg", category: "Medicine", unit: "boxes", barcode: "5901234123458", tracksExpiry: true },
    { name: "Cholera Treatment Kit", category: "Medicine", unit: "kits", barcode: "5901234123480", tracksExpiry: true },
    { name: "Insulin (10ml vial)", category: "Medicine", unit: "vials", barcode: "5901234123471", tracksExpiry: true },
    { name: "Rice (5kg bag)", category: "Food", unit: "bags", barcode: "5901234123460", tracksExpiry: true },
    { name: "High-Energy Biscuits", category: "Food", unit: "boxes", barcode: "5901234123481", tracksExpiry: true },
    { name: "Canned Lentils", category: "Food", unit: "cans", barcode: "5901234123482", tracksExpiry: true },
    { name: "Water Purification Tablets", category: "Food", unit: "packs", barcode: "5901234123483", tracksExpiry: true },
    { name: "Bottled Water (1.5L)", category: "Food", unit: "bottles", barcode: "5901234123462", tracksExpiry: false },
    { name: "Soap (bar)", category: "Hygiene", unit: "bars", barcode: "5901234123464", tracksExpiry: false },
    { name: "Sanitary Pads", category: "Hygiene", unit: "packs", barcode: "5901234123466", tracksExpiry: false },
    { name: "Hygiene Kit", category: "Hygiene", unit: "kits", barcode: "5901234123484", tracksExpiry: false },
    { name: "Disposable Gloves (M)", category: "First Aid", unit: "boxes", barcode: "5901234123467", tracksExpiry: true },
    { name: "Sterile Bandages", category: "First Aid", unit: "packs", barcode: "5901234123468", tracksExpiry: true },
    { name: "Trauma First Aid Kit", category: "First Aid", unit: "kits", barcode: "5901234123485", tracksExpiry: true },
    { name: "Thermal Blankets", category: "First Aid", unit: "units", barcode: "5901234123470", tracksExpiry: false },
  ] as const;

  const insertedItems: typeof itemsTable.$inferSelect[] = [];
  for (const def of itemDefs) {
    let existing = await db.select().from(itemsTable).then((rows) => rows.find((r) => r.name === def.name));
    if (existing) { insertedItems.push(existing); continue; }
    const [item] = await db.insert(itemsTable).values({ name: def.name, category: def.category as any, unit: def.unit, barcode: def.barcode, tracksExpiry: def.tracksExpiry }).returning();
    insertedItems.push(item);
  }

  const itemByName = (name: string) => insertedItems.find((i) => i.name === name)!;

  // ── Hub Stock ─────────────────────────────────────────────────────────────
  const today = new Date();
  const expIn60 = new Date(today.getTime() + 60 * 86400000).toISOString().slice(0, 10);
  const expIn20 = new Date(today.getTime() + 20 * 86400000).toISOString().slice(0, 10);
  const expIn10 = new Date(today.getTime() + 10 * 86400000).toISOString().slice(0, 10);

  const stockDefs: Array<{ hub: typeof krt; itemName: string; quantity: number; expiry?: string }> = [
    // Khartoum Central Hub
    { hub: krt, itemName: "Amoxicillin 500mg", quantity: 200, expiry: expIn60 },
    { hub: krt, itemName: "Oral Rehydration Salts", quantity: 500 },
    { hub: krt, itemName: "Ibuprofen 400mg", quantity: 8, expiry: expIn20 },
    { hub: krt, itemName: "Cholera Treatment Kit", quantity: 30, expiry: expIn60 },
    { hub: krt, itemName: "Insulin (10ml vial)", quantity: 6, expiry: expIn20 },
    { hub: krt, itemName: "Rice (5kg bag)", quantity: 400 },
    { hub: krt, itemName: "High-Energy Biscuits", quantity: 250, expiry: expIn60 },
    { hub: krt, itemName: "Water Purification Tablets", quantity: 300 },
    { hub: krt, itemName: "Soap (bar)", quantity: 400 },
    { hub: krt, itemName: "Hygiene Kit", quantity: 120 },
    { hub: krt, itemName: "Disposable Gloves (M)", quantity: 80 },
    { hub: krt, itemName: "Sterile Bandages", quantity: 3, expiry: expIn10 },
    { hub: krt, itemName: "Thermal Blankets", quantity: 150 },
    // Port Sudan Depot
    { hub: psd, itemName: "Rice (5kg bag)", quantity: 1200 },
    { hub: psd, itemName: "Canned Lentils", quantity: 800 },
    { hub: psd, itemName: "High-Energy Biscuits", quantity: 600, expiry: expIn60 },
    { hub: psd, itemName: "Bottled Water (1.5L)", quantity: 2000 },
    { hub: psd, itemName: "Water Purification Tablets", quantity: 500 },
    { hub: psd, itemName: "Amoxicillin 500mg", quantity: 80, expiry: expIn60 },
    { hub: psd, itemName: "Oral Rehydration Salts", quantity: 400 },
    { hub: psd, itemName: "Soap (bar)", quantity: 700 },
    { hub: psd, itemName: "Thermal Blankets", quantity: 300 },
    { hub: psd, itemName: "Trauma First Aid Kit", quantity: 25, expiry: expIn60 },
    // El Fasher Field Base
    { hub: elf, itemName: "Oral Rehydration Salts", quantity: 7 },
    { hub: elf, itemName: "Cholera Treatment Kit", quantity: 4, expiry: expIn20 },
    { hub: elf, itemName: "Rice (5kg bag)", quantity: 60 },
    { hub: elf, itemName: "High-Energy Biscuits", quantity: 5, expiry: expIn10 },
    { hub: elf, itemName: "Water Purification Tablets", quantity: 40 },
    { hub: elf, itemName: "Soap (bar)", quantity: 30 },
    { hub: elf, itemName: "Sanitary Pads", quantity: 3 },
    { hub: elf, itemName: "Sterile Bandages", quantity: 20, expiry: expIn60 },
    { hub: elf, itemName: "Thermal Blankets", quantity: 80 },
    { hub: elf, itemName: "Trauma First Aid Kit", quantity: 8, expiry: expIn60 },
    // Kassala Relief Point
    { hub: kas, itemName: "Amoxicillin 500mg", quantity: 45, expiry: expIn60 },
    { hub: kas, itemName: "Oral Rehydration Salts", quantity: 200 },
    { hub: kas, itemName: "Ibuprofen 400mg", quantity: 60 },
    { hub: kas, itemName: "Rice (5kg bag)", quantity: 180 },
    { hub: kas, itemName: "Canned Lentils", quantity: 150 },
    { hub: kas, itemName: "Hygiene Kit", quantity: 60 },
    { hub: kas, itemName: "Disposable Gloves (M)", quantity: 35 },
    { hub: kas, itemName: "Sterile Bandages", quantity: 55, expiry: expIn60 },
    { hub: kas, itemName: "Thermal Blankets", quantity: 90 },
  ];

  for (const s of stockDefs) {
    if (!s.hub) continue;
    const item = itemByName(s.itemName);
    if (!item) continue;
    const existing = await db.select().from(hubStockTable)
      .then((rows) => rows.find((r) => r.hubId === s.hub.id && r.itemId === item.id));
    if (existing) continue;
    await db.insert(hubStockTable).values({ hubId: s.hub.id, itemId: item.id, quantity: s.quantity, expiryDate: s.expiry ?? null });
  }

  // ── Volunteers ────────────────────────────────────────────────────────────
  const volDefs = [
    { fullName: "Amira Hassan", email: "amira@example.com", lat: 15.51, lng: 32.56, hasVehicle: true, availabilityStatus: "Available" },
    { fullName: "Omar Khalid", email: "omar@example.com", lat: 15.49, lng: 32.55, hasVehicle: true, availabilityStatus: "Busy" },
    { fullName: "Fatima Nour", email: "fatima@example.com", lat: 19.62, lng: 37.22, hasVehicle: false, availabilityStatus: "Available" },
    { fullName: "Yusuf Abdelrahman", email: "yusuf@example.com", lat: 19.61, lng: 37.21, hasVehicle: true, availabilityStatus: "Available" },
    { fullName: "Maha Ibrahim", email: "maha@example.com", lat: 13.63, lng: 25.35, hasVehicle: false, availabilityStatus: "Available" },
    { fullName: "Ahmed Salih", email: "ahmed@example.com", lat: 13.62, lng: 25.34, hasVehicle: true, availabilityStatus: "Offline" },
    { fullName: "Samira Ali", email: "samira@example.com", lat: 15.46, lng: 36.40, hasVehicle: false, availabilityStatus: "Available" },
    { fullName: "Tariq Osman", email: "tariq@example.com", lat: 15.47, lng: 36.41, hasVehicle: true, availabilityStatus: "Busy" },
  ] as const;

  const insertedVols: typeof volunteersTable.$inferSelect[] = [];
  for (const v of volDefs) {
    const existing = await db.select().from(volunteersTable)
      .then((rows) => rows.find((r) => r.fullName === v.fullName && r.orgId === demoOrg.id));
    if (existing) { insertedVols.push(existing); continue; }
    const [vol] = await db.insert(volunteersTable).values({ ...v, orgId: demoOrg.id } as any).returning();
    insertedVols.push(vol);
  }

  const volByName = (name: string) => insertedVols.find((v) => v.fullName === name)!;

  // ── Requests ──────────────────────────────────────────────────────────────
  const req1Existing = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === elf.id && r.priority === "Critical" && r.orgId === demoOrg.id));

  let req1: typeof requestsTable.$inferSelect;
  if (req1Existing) {
    req1 = req1Existing;
  } else {
    [req1] = await db.insert(requestsTable).values({
      orgId: demoOrg.id,
      requestingHubId: elf.id,
      priority: "Critical",
      status: "Open",
      notes: "Critical shortage at El Fasher following displacement surge. 2,000+ IDPs in camp. Cholera outbreak risk.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: req1.id, itemId: itemByName("Cholera Treatment Kit").id, quantityNeeded: 20 },
      { requestId: req1.id, itemId: itemByName("Oral Rehydration Salts").id, quantityNeeded: 300 },
      { requestId: req1.id, itemId: itemByName("Water Purification Tablets").id, quantityNeeded: 200 },
    ]);
  }

  const req2Existing = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === kas.id && r.priority === "Urgent" && r.orgId === demoOrg.id));

  let req2: typeof requestsTable.$inferSelect;
  if (req2Existing) {
    req2 = req2Existing;
  } else {
    [req2] = await db.insert(requestsTable).values({
      orgId: demoOrg.id,
      requestingHubId: kas.id,
      priority: "Urgent",
      status: "Assigned",
      notes: "Kassala refugee camp needs hygiene supplies for 800 families. Sanitation crisis developing.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: req2.id, itemId: itemByName("Hygiene Kit").id, quantityNeeded: 80 },
      { requestId: req2.id, itemId: itemByName("Soap (bar)").id, quantityNeeded: 200 },
      { requestId: req2.id, itemId: itemByName("Sanitary Pads").id, quantityNeeded: 100 },
    ]);
  }

  const req3Existing = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === elf.id && r.priority === "Urgent" && r.orgId === demoOrg.id));

  let req3: typeof requestsTable.$inferSelect;
  if (req3Existing) {
    req3 = req3Existing;
  } else {
    [req3] = await db.insert(requestsTable).values({
      orgId: demoOrg.id,
      requestingHubId: elf.id,
      priority: "Urgent",
      status: "Draft",
      notes: "Food restocking needed before next distribution cycle (3 days). High-energy biscuits critically low.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: req3.id, itemId: itemByName("Rice (5kg bag)").id, quantityNeeded: 200 },
      { requestId: req3.id, itemId: itemByName("High-Energy Biscuits").id, quantityNeeded: 150 },
      { requestId: req3.id, itemId: itemByName("Canned Lentils").id, quantityNeeded: 100 },
    ]);
  }

  // ── Transfers + Tasks ─────────────────────────────────────────────────────
  const existingTransfer = await db.select().from(transfersTable)
    .then((rows) => rows.find((r) => r.requestId === req2.id && r.orgId === demoOrg.id));

  if (!existingTransfer) {
    const [transfer1] = await db.insert(transfersTable).values({
      orgId: demoOrg.id,
      requestId: req2.id,
      fromHubId: krt.id,
      toHubId: kas.id,
      status: "Dispatched",
      etaMinutes: 480,
    }).returning();

    await db.insert(transferItemsTable).values([
      { transferId: transfer1.id, itemId: itemByName("Hygiene Kit").id, quantity: 60 },
      { transferId: transfer1.id, itemId: itemByName("Soap (bar)").id, quantity: 150 },
    ]);

    const omar = volByName("Omar Khalid");
    const tariq = volByName("Tariq Osman");
    if (omar) {
      await db.insert(tasksTable).values({ orgId: demoOrg.id, transferId: transfer1.id, volunteerId: omar.id, type: "Pickup", status: "In Progress" });
    }
    if (tariq) {
      await db.insert(tasksTable).values({ orgId: demoOrg.id, transferId: transfer1.id, volunteerId: tariq.id, type: "Delivery/Transfer", status: "Assigned" });
    }
  }

  // ── Activity Log ──────────────────────────────────────────────────────────
  const existingActivity = await db.select().from(activityLogTable)
    .then((rows) => rows.filter((r) => r.orgId === demoOrg.id).length);

  if (existingActivity === 0) {
    await db.insert(activityLogTable).values([
      { orgId: demoOrg.id, entityType: "request", entityId: req1.id, action: "created", payload: { priority: "Critical", hub: "El Fasher" } },
      { orgId: demoOrg.id, entityType: "request", entityId: req2.id, action: "created", payload: { priority: "Urgent", hub: "Kassala" } },
      { orgId: demoOrg.id, entityType: "request", entityId: req2.id, action: "status_changed", payload: { status: "Assigned" } },
      { orgId: demoOrg.id, entityType: "transfer", entityId: "demo-transfer-1", action: "created", payload: { from: "Khartoum", to: "Kassala" } },
      { orgId: demoOrg.id, entityType: "transfer", entityId: "demo-transfer-1", action: "dispatched", payload: { fromHub: "Khartoum Central Hub" } },
      { orgId: demoOrg.id, entityType: "request", entityId: req3.id, action: "created", payload: { priority: "Urgent", hub: "El Fasher" } },
      { orgId: demoOrg.id, entityType: "stock", entityId: "csv-import", action: "csv_imported", payload: { imported: 12, updated: 0 } },
    ]);
  }

  // ── Shared Board Posts ─────────────────────────────────────────────────────
  const existingPosts = await db.select().from(boardPostsTable)
    .then((rows) => rows.filter((r) => r.orgId === demoOrg.id).length);

  if (existingPosts === 0) {
    await db.insert(boardPostsTable).values([
      {
        orgId: demoOrg.id,
        orgName: demoOrg.name,
        type: "Availability",
        title: "Surplus rice and lentils at Port Sudan — available for transfer",
        content: "We have significant stock of staple foods at Port Sudan. Can arrange convoy to Khartoum, El Fasher or Kassala within 72h.",
        itemName: "Rice (5kg bag)",
        quantity: 500,
        location: "Port Sudan Depot",
        status: "Active",
        createdBy: "seed",
      },
      {
        orgId: demoOrg.id,
        orgName: demoOrg.name,
        type: "Need",
        title: "Urgent: Cholera treatment kits needed at El Fasher",
        content: "El Fasher field base is critically low on cholera treatment supplies. Outbreak risk is high. Any NGO with surplus please contact immediately.",
        itemName: "Cholera Treatment Kit",
        quantity: 20,
        location: "El Fasher, North Darfur",
        status: "Active",
        createdBy: "seed",
      },
      {
        orgId: demoOrg.id,
        orgName: demoOrg.name,
        type: "Announcement",
        title: "Convoy route Khartoum → Kassala safe as of May 2026",
        content: "Road conditions on A1 highway confirmed passable. Convoy window open daily 06:00–14:00. Coordinate with our Khartoum hub team for joint scheduling.",
        location: "Khartoum to Kassala, A1 Highway",
        status: "Active",
        createdBy: "seed",
      },
    ]);
  }

  // ── Demo Org Members (fake users for team management UI) ─────────────────
  const demoMembers = [
    { userId: "demo:fatima.malik", email: "fatima.malik@unicef.org", fullName: "Fatima Malik", role: "Admin" as const },
    { userId: "demo:omar.sheikh", email: "omar.sheikh@unicef.org", fullName: "Omar Sheikh", role: "Coordinator" as const },
    { userId: "demo:amira.hassan", email: "amira.hassan@unicef.org", fullName: "Amira Hassan", role: "Coordinator" as const },
    { userId: "demo:yusuf.ibrahim", email: "yusuf.ibrahim@unicef.org", fullName: "Yusuf Ibrahim", role: "Coordinator" as const },
    { userId: "demo:sara.nour", email: "sara.nour@unicef.org", fullName: "Sara Nour", role: "Viewer" as const },
  ];

  for (const m of demoMembers) {
    const exists = await db.select().from(orgMembersTable)
      .then((rows) => rows.find((r) => r.userId === m.userId && r.orgId === demoOrg.id));
    if (!exists) {
      await db.insert(orgMembersTable).values({ ...m, orgId: demoOrg.id });
    }
  }
  console.log("  Added 5 demo team members");

  console.log("Seed complete! Demo org invite code: SUDAN1");
}

seed().catch((e) => { console.error(e); process.exit(1); });
