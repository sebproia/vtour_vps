/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
const week = ["lundi: 09:00–12:00", "mardi: Fermé", "mercredi: 10:00–20:00", "jeudi: 10:00–20:00", "vendredi: 10:00–22:00", "samedi: 11:00–23:00", "dimanche: 11:00–18:00"];
async function setup() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({subject:"owner"});
  const tourId = await owner.mutation(api.tours.createTour, {name:"Tour",date:"2026-11-09"});
  const placeId = await owner.mutation(api.places.addPlace, {tourId,name:"Restaurant",address:"Paris",coordinates:{lat:48,lng:2},googlePlaceId:"google-1",weeklyOpeningHours:week,tags:["sweet","savory","sweet"]});
  return {t,owner,tourId,placeId};
}
test("date edits recompute saved weekly hours without changing the live stage or reviews", async () => {
  const {t,owner,tourId,placeId}=await setup();
  await owner.mutation(api.places.startLiveMode,{tourId});
  await t.run(ctx=>ctx.db.insert("ratings",{placeId,guestName:"Alex",score:9,comment:"En cours"}));
  await owner.mutation(api.tours.updateTourDate,{tourId,date:"2026-11-10"});
  const snapshot=await t.run(async ctx=>({tour:await ctx.db.get(tourId),place:await ctx.db.get(placeId),ratings:await ctx.db.query("ratings").collect()}));
  expect(snapshot.tour).toMatchObject({date:"2026-11-10",status:"live",currentStepIndex:0});
  expect(snapshot.place).toMatchObject({openingHours:"Fermé",openingHoursDate:"2026-11-10",tags:["sweet","savory"]});
  expect(snapshot.ratings[0].comment).toBe("En cours");
});
test("old one-day hours are cleared on date change and can be refreshed; stale responses cannot overwrite them", async () => {
  const {t,owner,tourId}=await setup();
  const id=await owner.mutation(api.places.addPlace,{tourId,name:"Old",address:"Paris",openingHours:"Ancien horaire",googlePlaceId:"google-old"});
  await owner.mutation(api.tours.updateTourDate,{tourId,date:"2026-11-15"});
  expect((await t.run(ctx=>ctx.db.get(id)))?.openingHours).toBeUndefined();
  await owner.mutation(api.places.updateOpeningHours,{placeId:id,expectedDate:"2026-11-09",googlePlaceId:"google-old",weeklyOpeningHours:week});
  expect((await t.run(ctx=>ctx.db.get(id)))?.openingHours).toBeUndefined();
  await owner.mutation(api.places.updateOpeningHours,{placeId:id,expectedDate:"2026-11-15",googlePlaceId:"google-old",weeklyOpeningHours:week});
  expect((await t.run(ctx=>ctx.db.get(id)))?.openingHours).toBe("11:00–18:00");
});
test.each(["2026-02-30","2026-13-01","not-a-date"])("rejects invalid date %s",async date=>{
  const {owner,tourId}=await setup();
  await expect(owner.mutation(api.tours.updateTourDate,{tourId,date})).rejects.toThrow();
});
test("only the organizer can change date or opening hours", async()=>{
  const {t,tourId,placeId}=await setup();
  for (const client of [t,t.withIdentity({subject:"other"})]) {
    await expect(client.mutation(api.tours.updateTourDate,{tourId,date:"2026-11-11"})).rejects.toThrow();
    await expect(client.mutation(api.places.updateOpeningHours,{placeId,expectedDate:"2026-11-09",coordinates:{lat:48,lng:2},googlePlaceId:"google-1",weeklyOpeningHours:week})).rejects.toThrow();
  }
});
test("manual address edits discard stale coordinates and Google metadata without changing stop identity",async()=>{
  const {t,owner,placeId}=await setup();
  await owner.mutation(api.places.updatePlace,{placeId,name:"Restaurant",address:"Nouvelle adresse",tags:["savory"]});
  const place=await t.run(ctx=>ctx.db.get(placeId));
  expect(place).toMatchObject({_id:placeId,address:"Nouvelle adresse",tags:["savory"]});
  expect(place?.coordinates).toBeUndefined();
  expect(place?.googlePlaceId).toBeUndefined();
  expect(place?.weeklyOpeningHours).toBeUndefined();
  expect(place?.openingHours).toBeUndefined();
});
test("duplicate and import keep both tags and weekly opening schedules", async()=>{
  const {t,owner,tourId}=await setup();
  await owner.mutation(api.tours.toggleTourPublic,{tourId,isPublic:true});
  for (const id of [await owner.mutation(api.tours.duplicateTour,{tourId}),await owner.mutation(api.tours.importPublicTour,{tourId})]) {
    const places=await t.query(api.places.getPlacesByTour,{tourId:id});
    expect(places[0]).toMatchObject({tags:["sweet","savory"],weeklyOpeningHours:week});
  }
});
