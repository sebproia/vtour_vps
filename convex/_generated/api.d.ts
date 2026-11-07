/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as lib_personalStats from "../lib/personalStats.js";
import type * as lib_schedule from "../lib/schedule.js";
import type * as photos from "../photos.js";
import type * as places from "../places.js";
import type * as ratings from "../ratings.js";
import type * as savedRecaps from "../savedRecaps.js";
import type * as tours from "../tours.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "lib/personalStats": typeof lib_personalStats;
  "lib/schedule": typeof lib_schedule;
  photos: typeof photos;
  places: typeof places;
  ratings: typeof ratings;
  savedRecaps: typeof savedRecaps;
  tours: typeof tours;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
