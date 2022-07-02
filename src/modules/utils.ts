import { rootContentId } from "./constants";
import type { Entry, Group, Region } from "./translationData";

export function getRegionFromEntry(entry: Entry, regionId: string): Region {
  if (!entry) {
    return null;
  }
  const regionList = entry.region;
  if (!regionList) {
    return null;
  }
  for (const region of regionList) {
    if (region.id === regionId) {
      return region;
    }
  }
  return null;
}

export function getItemPath(entry: Group | Entry): string {
  if (!entry.parent || entry.id === rootContentId) {
    return '';
  }
  const parentPath = getItemPath(entry.parent);
  if (parentPath !== '') {
    return parentPath + '.' + entry.id;
  }
  return entry.id;
}

export function replaceAll(original: string, search: string, replace: string): string {
  return original.split(search).join(replace);
}

const matchEndingNumerals = /\d+$/;

export function splitTrailingNumerals(original: string): [string, number] {
  const match = original.match(matchEndingNumerals);
  if (match) {
    const numerals = match[0];
    const trimmed = original.substring(0, original.length - numerals.length);
    const value = parseInt(numerals);
    return [trimmed, value];
  } else {
    return [original, 0];
  }
}
