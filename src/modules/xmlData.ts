import { Entry, Group, Info, Page, Region, TranslationData, } from "./translationData";

export interface XmlRoot {
  data: XmlData,
}

export interface XmlData {
  info: XmlInfo,
  group: XmlGroup,
}

export interface XmlInfo {
  activeregion: XmlText,
  name: XmlText,
  regions: XmlInfoRegions,
  version: XmlText,
}

export interface XmlInfoRegions {
  region: XmlText[] | XmlText,
}

export interface XmlGroup {
  _attributes: {
    id: string
  },
  group?: XmlGroup[] | XmlGroup,
  entry?: XmlEntry[] | XmlEntry,
}

export interface XmlEntry {
  _attributes: {
    id: string,
  },
  region: XmlRegion,
}

export interface XmlRegion {
  _attributes: {
    id: string,
  },
  page: XmlPage[] | XmlPage,
}

export interface XmlPage {
  _attributes: {
    index: string,
  },
  _cdata: string,
}

export interface XmlText {
  _text: string,
}

export function parseXmlRoot(root: XmlRoot): TranslationData {
  const data = root.data; // Unwrap top level
  const parsedRegions: string[] = [];
  const regions = getArrayProperty(data.info.regions.region);
  for (const parsedRegion of regions) {
    parsedRegions.push(parsedRegion._text);
  }
  const loadedInfo = new Info(
    data.info.version._text,
    data.info.activeregion._text,
    parsedRegions,
    data.info.name._text,
  );
  const loadedData = new TranslationData(loadedInfo);
  const groups = getArrayProperty(data.group);
  const newGroup = buildParsedGroupsRecursive(null, groups);
  loadedData.group.push(...newGroup);
  return loadedData;
}

function buildParsedGroupsRecursive(parent: Group, parsedGroup: XmlGroup[]): Group[] {
  if (parsedGroup === null) {
    // Nothing in the parent group
    return null;
  }
  const newGroups: Group[] = [];
  for (const group of parsedGroup) {
    const newGroup = new Group(group._attributes.id, parent);
    const entries = getArrayProperty(group.entry);
    buildParsedEntry(newGroup, entries);
    const groups = getArrayProperty(group.group);
    buildParsedGroupsRecursive(newGroup, groups);
    newGroups.push(newGroup);
  }
  return newGroups;
}

function buildParsedEntry(parent: Group, parsedEntry: XmlEntry[]) {
  if (parsedEntry === null) {
    // No entries in this group
    return;
  }
  for (const entry of parsedEntry) {
    const newEntry = new Entry(entry._attributes.id, parent);
    const regions = getArrayProperty(entry.region);
    buildParsedRegion(newEntry.region, regions);
  }
}

function buildParsedRegion(regionArray: Region[], parsedRegion: XmlRegion[]) {
  if (parsedRegion === null) {
    // No regions in this group
    return;
  }
  for (const region of parsedRegion) {
    const newRegion = new Region(region._attributes.id);
    regionArray.push(newRegion);
    const pages = getArrayProperty(region.page);
    buildParsedPage(newRegion.page, pages);
  }
}

function buildParsedPage(pageArray: Page[], parsedPage: XmlPage[]) {
  if (!parsedPage) {
    // No pages in this region
    const empty = new Page('');
    pageArray.push(empty);
    return;
  }
  for (const page of parsedPage) {
    const newPage = new Page(page._cdata);
    pageArray.push(newPage);
  }
}

function getArrayProperty<T>(property: T | T[]): T[] {
  if (property === undefined) {
    return null;
  }
  if (Array.isArray(property)) {
    return property;
  }
  return [property];
}
