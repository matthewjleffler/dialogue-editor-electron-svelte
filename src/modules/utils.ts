import { rootContentId } from "./constants";
import type { TreeData, TreeEntry, TreeGroup, TreeRegion } from "./treeData";

export function getArrayProperty<T>(property: T | T[]): T[] {
  if (property === undefined) {
    return null;
  }
  if (Array.isArray(property)) {
    return property;
  }
  return [property];
}

export function arrayRemove<T>(array: T[], value: T) {
  if (!array || array.length < 1) {
    return;
  }
  let index: number;
  while ((index = array.indexOf(value)) > -1) {
    array.splice(index, 1);
  }
}

export function getRegionFromEntry(entry: TreeEntry, regionId: string): TreeRegion {
  if (!entry) {
    return null;
  }
  const regionList = entry.region;
  if (!regionList) {
    return null;
  }
  const len = regionList.length;
  for (let i = 0; i < len; i++) {
    const region = regionList[i];
    if (region.id === regionId) {
      return region;
    }
  }
  return null;
}

export function getItemPath(entry: TreeData | TreeGroup | TreeEntry): string {
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
