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
      imageUrl: "https://images.unsplash.com/photo-1609281247554-27e0c77c5eb4?w=800&q=80",
    },
    {
      name: "Port Sudan Depot",
      address: "Near Red Sea Port, Port Sudan",
      lat: 19.6158,
      lng: 37.2164,
      imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    },
    {
      name: "El Fasher Field Base",
      address: "North Darfur, El Fasher, Sudan",
      lat: 13.6279,
      lng: 25.3494,
      imageUrl: "https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80",
    },
    {
      name: "Kassala Relief Point",
      address: "Al Kassala, Kassala State, Sudan",
      lat: 15.4607,
      lng: 36.3997,
      imageUrl: "https://images.unsplash.com/photo-1532635241-17e820acc59f?w=800&q=80",
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

  console.log("Seed complete! Demo org: UNICEF Sudan (SUDAN1)");

  // ════════════════════════════════════════════════════════════════════════════
  // MISSION 2 — MSF Syria
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\nSeeding MSF Syria demo data…");

  const SYRIA_ORG_NAME = "MSF Syria";
  let [syriaOrg] = await db.select().from(organizationsTable).then((rows) => rows.filter((r) => r.name === SYRIA_ORG_NAME));
  if (!syriaOrg) {
    [syriaOrg] = await db.insert(organizationsTable).values({
      name: SYRIA_ORG_NAME,
      description: "Médecins Sans Frontières — Syria emergency medical and logistics operations",
      inviteCode: "SYRIA1",
      createdBy: "seed",
    }).returning();
    console.log(`  Created org: ${SYRIA_ORG_NAME} (invite: SYRIA1)`);
  }

  // ── Syria Hubs ─────────────────────────────────────────────────────────────
  const syriaHubDefs = [
    {
      name: "Damascus Coordination Hub",
      address: "Mazzeh District, Damascus, Syria",
      lat: 33.5138,
      lng: 36.2765,
      imageUrl: "https://images.unsplash.com/photo-1609281247554-27e0c77c5eb4?w=800&q=80",
    },
    {
      name: "Aleppo Field Hospital",
      address: "Al-Masharqa, Aleppo, Syria",
      lat: 36.2021,
      lng: 37.1343,
      imageUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
    },
    {
      name: "Idlib Relief Base",
      address: "Bab al-Hawa Crossing Area, Idlib, Syria",
      lat: 35.9284,
      lng: 36.6277,
      imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
    },
    {
      name: "Raqqa Distribution Point",
      address: "Al-Rashid District, Raqqa, Syria",
      lat: 35.9519,
      lng: 39.0130,
      imageUrl: "https://images.unsplash.com/photo-1473445730015-841f29a9490b?w=800&q=80",
    },
  ];

  const syriaHubs: typeof hubsTable.$inferSelect[] = [];
  for (const def of syriaHubDefs) {
    let [hub] = await db.select().from(hubsTable).then((rows) => rows.filter((r) => r.name === def.name && r.orgId === syriaOrg.id));
    if (!hub) {
      [hub] = await db.insert(hubsTable).values({ ...def, orgId: syriaOrg.id }).returning();
    }
    syriaHubs.push(hub);
  }
  const sHub = (name: string) => syriaHubs.find((h) => h.name === name)!;
  const sdmsc = sHub("Damascus Coordination Hub");
  const salep = sHub("Aleppo Field Hospital");
  const sidlb = sHub("Idlib Relief Base");
  const sraqq = sHub("Raqqa Distribution Point");

  // ── Syria Stock ────────────────────────────────────────────────────────────
  const expIn45 = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
  const expIn15 = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
  const expIn7  = new Date(Date.now() + 7  * 86400000).toISOString().slice(0, 10);

  const syriaStockDefs: Array<{ hub: typeof sdmsc; itemName: string; quantity: number; expiry?: string }> = [
    // Damascus — large coordination hub
    { hub: sdmsc, itemName: "Amoxicillin 500mg",       quantity: 300, expiry: expIn45 },
    { hub: sdmsc, itemName: "Ibuprofen 400mg",          quantity: 200, expiry: expIn45 },
    { hub: sdmsc, itemName: "Insulin (10ml vial)",      quantity: 40,  expiry: expIn15 },
    { hub: sdmsc, itemName: "Sterile Bandages",         quantity: 120, expiry: expIn45 },
    { hub: sdmsc, itemName: "Trauma First Aid Kit",     quantity: 35,  expiry: expIn45 },
    { hub: sdmsc, itemName: "Disposable Gloves (M)",    quantity: 150 },
    { hub: sdmsc, itemName: "Rice (5kg bag)",           quantity: 600 },
    { hub: sdmsc, itemName: "Canned Lentils",           quantity: 400 },
    { hub: sdmsc, itemName: "Bottled Water (1.5L)",     quantity: 1500 },
    { hub: sdmsc, itemName: "Thermal Blankets",         quantity: 250 },
    { hub: sdmsc, itemName: "Hygiene Kit",              quantity: 180 },
    // Aleppo — field hospital, medical-heavy
    { hub: salep, itemName: "Amoxicillin 500mg",       quantity: 80,  expiry: expIn45 },
    { hub: salep, itemName: "Oral Rehydration Salts",  quantity: 200 },
    { hub: salep, itemName: "Ibuprofen 400mg",          quantity: 5,   expiry: expIn7  },
    { hub: salep, itemName: "Insulin (10ml vial)",      quantity: 3,   expiry: expIn15 },
    { hub: salep, itemName: "Sterile Bandages",         quantity: 20,  expiry: expIn45 },
    { hub: salep, itemName: "Trauma First Aid Kit",     quantity: 6,   expiry: expIn45 },
    { hub: salep, itemName: "Disposable Gloves (M)",    quantity: 60 },
    { hub: salep, itemName: "Thermal Blankets",         quantity: 80 },
    // Idlib — border crossing, high throughput
    { hub: sidlb, itemName: "Rice (5kg bag)",           quantity: 900 },
    { hub: sidlb, itemName: "High-Energy Biscuits",     quantity: 400, expiry: expIn45 },
    { hub: sidlb, itemName: "Canned Lentils",           quantity: 600 },
    { hub: sidlb, itemName: "Water Purification Tablets", quantity: 700 },
    { hub: sidlb, itemName: "Soap (bar)",               quantity: 500 },
    { hub: sidlb, itemName: "Sanitary Pads",            quantity: 200 },
    { hub: sidlb, itemName: "Hygiene Kit",              quantity: 100 },
    { hub: sidlb, itemName: "Thermal Blankets",         quantity: 350 },
    // Raqqa — remote, critically low on several items
    { hub: sraqq, itemName: "Amoxicillin 500mg",       quantity: 12,  expiry: expIn45 },
    { hub: sraqq, itemName: "Oral Rehydration Salts",  quantity: 30 },
    { hub: sraqq, itemName: "Rice (5kg bag)",           quantity: 45 },
    { hub: sraqq, itemName: "Bottled Water (1.5L)",     quantity: 80 },
    { hub: sraqq, itemName: "Sterile Bandages",         quantity: 8,   expiry: expIn7  },
    { hub: sraqq, itemName: "Thermal Blankets",         quantity: 40 },
  ];

  for (const s of syriaStockDefs) {
    if (!s.hub) continue;
    const item = insertedItems.find((i) => i.name === s.itemName);
    if (!item) continue;
    const exists = await db.select().from(hubStockTable)
      .then((rows) => rows.find((r) => r.hubId === s.hub.id && r.itemId === item.id));
    if (exists) continue;
    await db.insert(hubStockTable).values({ hubId: s.hub.id, itemId: item.id, quantity: s.quantity, expiryDate: s.expiry ?? null });
  }
  console.log("  Seeded Syria hub stock");

  // ── Syria Volunteers ───────────────────────────────────────────────────────
  const syriaVolDefs = [
    { fullName: "Nour Al-Rashid",    email: "nour@example.com",    lat: 33.51, lng: 36.28, hasVehicle: true,  availabilityStatus: "Available" },
    { fullName: "Khalil Mansour",    email: "khalil@example.com",  lat: 36.20, lng: 37.13, hasVehicle: true,  availabilityStatus: "Busy"      },
    { fullName: "Layla Yousef",      email: "layla@example.com",   lat: 35.93, lng: 36.63, hasVehicle: false, availabilityStatus: "Available" },
    { fullName: "Hassan Al-Ahmad",   email: "hassan@example.com",  lat: 35.93, lng: 36.62, hasVehicle: true,  availabilityStatus: "Available" },
    { fullName: "Rima Barakat",      email: "rima@example.com",    lat: 35.95, lng: 39.01, hasVehicle: false, availabilityStatus: "Available" },
    { fullName: "Tariq Nassar",      email: "tariq.s@example.com", lat: 33.50, lng: 36.27, hasVehicle: true,  availabilityStatus: "Offline"   },
  ] as const;

  const syriaVols: typeof volunteersTable.$inferSelect[] = [];
  for (const v of syriaVolDefs) {
    const exists = await db.select().from(volunteersTable)
      .then((rows) => rows.find((r) => r.email === v.email && r.orgId === syriaOrg.id));
    if (exists) { syriaVols.push(exists); continue; }
    const [vol] = await db.insert(volunteersTable).values({ ...v, orgId: syriaOrg.id } as any).returning();
    syriaVols.push(vol);
  }
  const sVolByName = (name: string) => syriaVols.find((v) => v.fullName === name)!;

  // ── Syria Requests ─────────────────────────────────────────────────────────
  const sReq1Exists = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === sraqq.id && r.priority === "Critical" && r.orgId === syriaOrg.id));

  let sReq1: typeof requestsTable.$inferSelect;
  if (sReq1Exists) {
    sReq1 = sReq1Exists;
  } else {
    [sReq1] = await db.insert(requestsTable).values({
      orgId: syriaOrg.id,
      requestingHubId: sraqq.id,
      priority: "Critical",
      status: "Open",
      notes: "Raqqa field point critically low on medicines and food. Road access intermittent. 1,400+ displaced families in camp vicinity.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: sReq1.id, itemId: itemByName("Amoxicillin 500mg").id,    quantityNeeded: 100 },
      { requestId: sReq1.id, itemId: itemByName("Sterile Bandages").id,     quantityNeeded: 80  },
      { requestId: sReq1.id, itemId: itemByName("Rice (5kg bag)").id,       quantityNeeded: 200 },
      { requestId: sReq1.id, itemId: itemByName("Bottled Water (1.5L)").id, quantityNeeded: 500 },
    ]);
  }

  const sReq2Exists = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === salep.id && r.priority === "Urgent" && r.orgId === syriaOrg.id));

  let sReq2: typeof requestsTable.$inferSelect;
  if (sReq2Exists) {
    sReq2 = sReq2Exists;
  } else {
    [sReq2] = await db.insert(requestsTable).values({
      orgId: syriaOrg.id,
      requestingHubId: salep.id,
      priority: "Urgent",
      status: "Assigned",
      notes: "Aleppo field hospital running low on surgical supplies and insulin. Expecting casualties from north Aleppo within 48h.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: sReq2.id, itemId: itemByName("Ibuprofen 400mg").id,       quantityNeeded: 100 },
      { requestId: sReq2.id, itemId: itemByName("Insulin (10ml vial)").id,   quantityNeeded: 20  },
      { requestId: sReq2.id, itemId: itemByName("Trauma First Aid Kit").id,  quantityNeeded: 15  },
    ]);
  }

  const sReq3Exists = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === sidlb.id && r.priority === "Medium" && r.orgId === syriaOrg.id));

  if (!sReq3Exists) {
    const [sReq3] = await db.insert(requestsTable).values({
      orgId: syriaOrg.id,
      requestingHubId: sidlb.id,
      priority: "Medium",
      status: "Draft",
      notes: "Idlib border crossing anticipates 600 new arrivals this week. Requesting hygiene and shelter replenishment.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: sReq3.id, itemId: itemByName("Hygiene Kit").id,           quantityNeeded: 100 },
      { requestId: sReq3.id, itemId: itemByName("Thermal Blankets").id,      quantityNeeded: 200 },
      { requestId: sReq3.id, itemId: itemByName("Sanitary Pads").id,         quantityNeeded: 120 },
    ]);
  }

  // ── Syria Transfer ─────────────────────────────────────────────────────────
  const sTransferExists = await db.select().from(transfersTable)
    .then((rows) => rows.find((r) => r.requestId === sReq2.id && r.orgId === syriaOrg.id));

  if (!sTransferExists) {
    const [sTransfer] = await db.insert(transfersTable).values({
      orgId: syriaOrg.id,
      requestId: sReq2.id,
      fromHubId: sdmsc.id,
      toHubId: salep.id,
      status: "In Transit",
      etaMinutes: 300,
    }).returning();
    await db.insert(transferItemsTable).values([
      { transferId: sTransfer.id, itemId: itemByName("Ibuprofen 400mg").id,      quantity: 100 },
      { transferId: sTransfer.id, itemId: itemByName("Insulin (10ml vial)").id,  quantity: 15  },
      { transferId: sTransfer.id, itemId: itemByName("Trauma First Aid Kit").id, quantity: 10  },
    ]);
    const nour = sVolByName("Nour Al-Rashid");
    const khalil = sVolByName("Khalil Mansour");
    if (nour)   await db.insert(tasksTable).values({ orgId: syriaOrg.id, transferId: sTransfer.id, volunteerId: nour.id,   type: "Pickup",            status: "Completed"   });
    if (khalil) await db.insert(tasksTable).values({ orgId: syriaOrg.id, transferId: sTransfer.id, volunteerId: khalil.id, type: "Delivery/Transfer", status: "In Progress" });
  }

  // ── Syria Activity Log ─────────────────────────────────────────────────────
  const sActCount = await db.select().from(activityLogTable)
    .then((rows) => rows.filter((r) => r.orgId === syriaOrg.id).length);

  if (sActCount === 0) {
    await db.insert(activityLogTable).values([
      { orgId: syriaOrg.id, entityType: "request",  entityId: sReq1.id, action: "created",        payload: { priority: "Critical", hub: "Raqqa" } },
      { orgId: syriaOrg.id, entityType: "request",  entityId: sReq2.id, action: "created",        payload: { priority: "Urgent",   hub: "Aleppo" } },
      { orgId: syriaOrg.id, entityType: "request",  entityId: sReq2.id, action: "status_changed", payload: { status: "Assigned" } },
      { orgId: syriaOrg.id, entityType: "transfer", entityId: "syria-t1", action: "created",      payload: { from: "Damascus", to: "Aleppo" } },
      { orgId: syriaOrg.id, entityType: "transfer", entityId: "syria-t1", action: "dispatched",   payload: { fromHub: "Damascus Coordination Hub" } },
    ]);
  }

  // ── Syria Board Posts ──────────────────────────────────────────────────────
  const sPostCount = await db.select().from(boardPostsTable)
    .then((rows) => rows.filter((r) => r.orgId === syriaOrg.id).length);

  if (sPostCount === 0) {
    await db.insert(boardPostsTable).values([
      {
        orgId: syriaOrg.id,
        orgName: syriaOrg.name,
        type: "Need",
        title: "Critical: antibiotics and trauma kits needed at Raqqa",
        content: "Raqqa field point is running dangerously low. Road conditions unpredictable — air or alternative corridor preferred. Contact us urgently.",
        itemName: "Amoxicillin 500mg",
        quantity: 100,
        location: "Raqqa Distribution Point, Syria",
        status: "Active",
        createdBy: "seed",
      },
      {
        orgId: syriaOrg.id,
        orgName: syriaOrg.name,
        type: "Availability",
        title: "Surplus blankets and food stocks at Idlib — available for cross-org transfer",
        content: "Idlib border base has received a large donation. We can spare 150 thermal blankets and 200 bags of rice. First-come basis — message our Damascus hub.",
        itemName: "Thermal Blankets",
        quantity: 150,
        location: "Idlib Relief Base, Syria",
        status: "Active",
        createdBy: "seed",
      },
      {
        orgId: syriaOrg.id,
        orgName: syriaOrg.name,
        type: "Announcement",
        title: "M5 highway Damascus–Aleppo: confirmed operational window 07:00–13:00",
        content: "Security assessment confirms M5 is passable. We will run a joint convoy Thursday at 07:00. Any NGOs with cargo to move north, coordinate with our Damascus hub before Wednesday.",
        location: "M5 Highway, Damascus to Aleppo",
        status: "Active",
        createdBy: "seed",
      },
    ]);
  }

  // ── Syria Demo Team Members ────────────────────────────────────────────────
  const syriaDemoMembers = [
    { userId: "demo:lena.hartmann",  email: "l.hartmann@msf.org",  fullName: "Lena Hartmann",  role: "Admin"       as const },
    { userId: "demo:ali.karimi",     email: "a.karimi@msf.org",    fullName: "Ali Karimi",     role: "Coordinator" as const },
    { userId: "demo:sofia.reyes",    email: "s.reyes@msf.org",     fullName: "Sofia Reyes",    role: "Coordinator" as const },
    { userId: "demo:marc.dubois",    email: "m.dubois@msf.org",    fullName: "Marc Dubois",    role: "Coordinator" as const },
    { userId: "demo:hana.yamamoto",  email: "h.yamamoto@msf.org",  fullName: "Hana Yamamoto",  role: "Viewer"      as const },
  ];

  for (const m of syriaDemoMembers) {
    const exists = await db.select().from(orgMembersTable)
      .then((rows) => rows.find((r) => r.userId === m.userId && r.orgId === syriaOrg.id));
    if (!exists) {
      await db.insert(orgMembersTable).values({ ...m, orgId: syriaOrg.id });
    }
  }
  console.log("  Added 5 Syria demo team members");
  console.log("Seed complete! MSF Syria invite code: SYRIA1");

  // ════════════════════════════════════════════════════════════════════════════
  // MISSION 3 — IRC Yemen  (invite: YEMEN1, admin: andrea.paindelli@gmail.com)
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\nSeeding IRC Yemen demo data…");

  const YEMEN_ORG_NAME = "IRC Yemen";
  let [yemenOrg] = await db.select().from(organizationsTable).then((rows) => rows.filter((r) => r.name === YEMEN_ORG_NAME));
  if (!yemenOrg) {
    [yemenOrg] = await db.insert(organizationsTable).values({
      name: YEMEN_ORG_NAME,
      description: "International Rescue Committee — Yemen emergency response and logistics",
      inviteCode: "YEMEN1",
      createdBy: "seed",
    }).returning();
    console.log("  Created org: IRC Yemen (invite: YEMEN1)");
  }

  // Pre-assign Andrea as Admin via pending invite — claimed automatically on first join
  const andreaEmail = "andrea.paindelli@gmail.com";
  const andreaExists = await db.select().from(orgMembersTable)
    .then((rows) => rows.find((r) => r.orgId === yemenOrg.id && r.email === andreaEmail));
  if (!andreaExists) {
    await db.insert(orgMembersTable).values({
      orgId: yemenOrg.id,
      userId: `pending:${andreaEmail}`,
      email: andreaEmail,
      fullName: "Andrea Paindelli",
      role: "Admin",
    });
    console.log("  Pre-assigned andrea.paindelli@gmail.com as Admin");
  }

  // ── Yemen Hubs ─────────────────────────────────────────────────────────────
  const yemenHubDefs = [
    {
      name: "Sana'a Coordination Centre",
      address: "Hadda District, Sana'a, Yemen",
      lat: 15.3694, lng: 44.1910,
      imageUrl: "https://images.unsplash.com/photo-1609281247554-27e0c77c5eb4?w=800&q=80",
    },
    {
      name: "Aden Port Distribution Hub",
      address: "Tawahi District, Aden, Yemen",
      lat: 12.7797, lng: 44.9941,
      imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    },
    {
      name: "Marib Field Base",
      address: "Marib City, Marib Governorate, Yemen",
      lat: 15.4693, lng: 45.3200,
      imageUrl: "https://images.unsplash.com/photo-1532635241-17e820acc59f?w=800&q=80",
    },
    {
      name: "Hodeidah Relief Point",
      address: "Al-Hawak District, Hodeidah, Yemen",
      lat: 14.7978, lng: 42.9511,
      imageUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
    },
  ];

  const yemenHubs: typeof hubsTable.$inferSelect[] = [];
  for (const def of yemenHubDefs) {
    let [hub] = await db.select().from(hubsTable).then((rows) => rows.filter((r) => r.name === def.name && r.orgId === yemenOrg.id));
    if (!hub) [hub] = await db.insert(hubsTable).values({ ...def, orgId: yemenOrg.id }).returning();
    yemenHubs.push(hub);
  }
  const yHub = (name: string) => yemenHubs.find((h) => h.name === name)!;
  const ysana = yHub("Sana'a Coordination Centre");
  const yaden = yHub("Aden Port Distribution Hub");
  const ymarib = yHub("Marib Field Base");
  const yhode = yHub("Hodeidah Relief Point");

  // ── Yemen Stock ────────────────────────────────────────────────────────────
  const yExpIn50 = new Date(Date.now() + 50 * 86400000).toISOString().slice(0, 10);
  const yExpIn12 = new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10);
  const yExpIn5  = new Date(Date.now() + 5  * 86400000).toISOString().slice(0, 10);

  const yemenStockDefs: Array<{ hub: typeof ysana; itemName: string; quantity: number; expiry?: string }> = [
    { hub: ysana,  itemName: "Amoxicillin 500mg",        quantity: 250, expiry: yExpIn50 },
    { hub: ysana,  itemName: "Oral Rehydration Salts",   quantity: 600 },
    { hub: ysana,  itemName: "Insulin (10ml vial)",      quantity: 30,  expiry: yExpIn12 },
    { hub: ysana,  itemName: "Rice (5kg bag)",            quantity: 800 },
    { hub: ysana,  itemName: "High-Energy Biscuits",      quantity: 400, expiry: yExpIn50 },
    { hub: ysana,  itemName: "Bottled Water (1.5L)",      quantity: 2000 },
    { hub: ysana,  itemName: "Hygiene Kit",               quantity: 200 },
    { hub: ysana,  itemName: "Thermal Blankets",          quantity: 300 },
    { hub: yaden,  itemName: "Rice (5kg bag)",            quantity: 1500 },
    { hub: yaden,  itemName: "Canned Lentils",            quantity: 900 },
    { hub: yaden,  itemName: "Water Purification Tablets",quantity: 800 },
    { hub: yaden,  itemName: "Soap (bar)",                quantity: 600 },
    { hub: yaden,  itemName: "Trauma First Aid Kit",      quantity: 40,  expiry: yExpIn50 },
    { hub: yaden,  itemName: "Thermal Blankets",          quantity: 400 },
    { hub: ymarib, itemName: "Amoxicillin 500mg",        quantity: 18,  expiry: yExpIn50 },
    { hub: ymarib, itemName: "Oral Rehydration Salts",   quantity: 50 },
    { hub: ymarib, itemName: "Sterile Bandages",          quantity: 6,   expiry: yExpIn5  },
    { hub: ymarib, itemName: "Rice (5kg bag)",            quantity: 70 },
    { hub: ymarib, itemName: "High-Energy Biscuits",      quantity: 8,   expiry: yExpIn12 },
    { hub: ymarib, itemName: "Bottled Water (1.5L)",      quantity: 120 },
    { hub: yhode,  itemName: "Oral Rehydration Salts",   quantity: 300 },
    { hub: yhode,  itemName: "Rice (5kg bag)",            quantity: 400 },
    { hub: yhode,  itemName: "Soap (bar)",                quantity: 350 },
    { hub: yhode,  itemName: "Sanitary Pads",             quantity: 150 },
    { hub: yhode,  itemName: "Cholera Treatment Kit",    quantity: 15,  expiry: yExpIn50 },
    { hub: yhode,  itemName: "Thermal Blankets",          quantity: 180 },
  ];

  for (const s of yemenStockDefs) {
    if (!s.hub) continue;
    const item = insertedItems.find((i) => i.name === s.itemName);
    if (!item) continue;
    const exists = await db.select().from(hubStockTable)
      .then((rows) => rows.find((r) => r.hubId === s.hub.id && r.itemId === item.id));
    if (exists) continue;
    await db.insert(hubStockTable).values({ hubId: s.hub.id, itemId: item.id, quantity: s.quantity, expiryDate: s.expiry ?? null });
  }

  // ── Yemen Volunteers ───────────────────────────────────────────────────────
  const yemenVolDefs = [
    { fullName: "Hana Al-Qurashi",  email: "hana.y@example.com",  lat: 15.37, lng: 44.19, hasVehicle: true,  availabilityStatus: "Available" },
    { fullName: "Bilal Mansouri",   email: "bilal.y@example.com", lat: 12.78, lng: 44.99, hasVehicle: true,  availabilityStatus: "Available" },
    { fullName: "Leila Saeed",      email: "leila.y@example.com", lat: 15.47, lng: 45.32, hasVehicle: false, availabilityStatus: "Busy"      },
    { fullName: "Rashid Al-Hamdi",  email: "rashid.y@example.com",lat: 14.80, lng: 42.95, hasVehicle: true,  availabilityStatus: "Available" },
    { fullName: "Mona Taher",       email: "mona.y@example.com",  lat: 15.38, lng: 44.20, hasVehicle: false, availabilityStatus: "Offline"   },
  ] as const;

  for (const v of yemenVolDefs) {
    const exists = await db.select().from(volunteersTable)
      .then((rows) => rows.find((r) => r.email === v.email && r.orgId === yemenOrg.id));
    if (!exists) await db.insert(volunteersTable).values({ ...v, orgId: yemenOrg.id } as any);
  }

  // ── Yemen Requests ─────────────────────────────────────────────────────────
  const yReq1Exists = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === ymarib.id && r.orgId === yemenOrg.id));
  if (!yReq1Exists) {
    const [yr1] = await db.insert(requestsTable).values({
      orgId: yemenOrg.id, requestingHubId: ymarib.id, priority: "Critical", status: "Open",
      notes: "Marib field base critically low on food and medicine. 3,000 IDPs in nearby camps.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: yr1.id, itemId: itemByName("Amoxicillin 500mg").id,   quantityNeeded: 150 },
      { requestId: yr1.id, itemId: itemByName("Rice (5kg bag)").id,       quantityNeeded: 300 },
      { requestId: yr1.id, itemId: itemByName("High-Energy Biscuits").id, quantityNeeded: 200 },
    ]);
  }

  const yReq2Exists = await db.select().from(requestsTable)
    .then((rows) => rows.find((r) => r.requestingHubId === yhode.id && r.orgId === yemenOrg.id));
  if (!yReq2Exists) {
    const [yr2] = await db.insert(requestsTable).values({
      orgId: yemenOrg.id, requestingHubId: yhode.id, priority: "Urgent", status: "Draft",
      notes: "Hodeidah port area cholera alert. Need treatment kits and ORS urgently.",
    }).returning();
    await db.insert(requestItemsTable).values([
      { requestId: yr2.id, itemId: itemByName("Cholera Treatment Kit").id,    quantityNeeded: 30 },
      { requestId: yr2.id, itemId: itemByName("Oral Rehydration Salts").id,   quantityNeeded: 400 },
      { requestId: yr2.id, itemId: itemByName("Water Purification Tablets").id, quantityNeeded: 300 },
    ]);
  }

  // ── Yemen Board Posts ──────────────────────────────────────────────────────
  const yPostCount = await db.select().from(boardPostsTable)
    .then((rows) => rows.filter((r) => r.orgId === yemenOrg.id).length);
  if (yPostCount === 0) {
    await db.insert(boardPostsTable).values([
      {
        orgId: yemenOrg.id, orgName: yemenOrg.name, type: "Need",
        title: "Urgent: cholera treatment kits needed at Hodeidah port",
        content: "Cholera cases rising near Hodeidah. We need treatment kits and ORS immediately. Any NGO with surplus please contact IRC Yemen.",
        itemName: "Cholera Treatment Kit", quantity: 30,
        location: "Hodeidah Relief Point, Yemen", status: "Active", createdBy: "seed",
      },
      {
        orgId: yemenOrg.id, orgName: yemenOrg.name, type: "Availability",
        title: "Surplus food stocks at Aden — available for transfer north",
        content: "Aden hub has received a large sea shipment. 500 rice bags and 200 lentil cans available. We can arrange truck convoy to Sana'a or Marib.",
        itemName: "Rice (5kg bag)", quantity: 500,
        location: "Aden Port Distribution Hub, Yemen", status: "Active", createdBy: "seed",
      },
    ]);
  }

  // ── Yemen Demo Team Members ────────────────────────────────────────────────
  const yemenDemoMembers = [
    { userId: "demo:carlos.garcia",  email: "c.garcia@rescue.org",  fullName: "Carlos García",   role: "Coordinator" as const },
    { userId: "demo:priya.nair",     email: "p.nair@rescue.org",    fullName: "Priya Nair",      role: "Coordinator" as const },
    { userId: "demo:jean.dupont",    email: "j.dupont@rescue.org",  fullName: "Jean Dupont",     role: "Viewer"      as const },
  ];
  for (const m of yemenDemoMembers) {
    const exists = await db.select().from(orgMembersTable)
      .then((rows) => rows.find((r) => r.userId === m.userId && r.orgId === yemenOrg.id));
    if (!exists) await db.insert(orgMembersTable).values({ ...m, orgId: yemenOrg.id });
  }
  console.log("  Added Yemen demo team members");
  console.log("Seed complete! IRC Yemen invite code: YEMEN1 | Admin: andrea.paindelli@gmail.com");
}

seed().catch((e) => { console.error(e); process.exit(1); });
