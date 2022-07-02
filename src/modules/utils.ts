import { rootContentId } from "./constants";
import type { TranslationData, Entry, Group, Region } from "./translationData";

export function arrayRemove<T>(array: T[], value: T) {
  if (!array || array.length < 1) {
    return;
  }
  let index: number;
  while ((index = array.indexOf(value)) > -1) {
    array.splice(index, 1);
  }
}

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

export function getItemPath(entry: TranslationData | Group | Entry): string {
  if (entry.parent === undefined || entry.id === rootContentId) {
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
