import { regionList } from "$stores";
import { get } from "svelte/store";
import { rootContentId } from "./constants";
import { getItemPath } from "./utils";

export class TranslationData {
  info: Info;
  group: Group[];

  static emptyData(): TranslationData {
    const emptyInfo = Info.emptyInfo();
    const empty = new TranslationData(emptyInfo);
    const group = new Group(rootContentId, null);
    empty.group.push(group);
    return empty;
  }

  constructor(info: Info) {
    this.info = info;
    this.group = [];
  }
}

export class Info {
  version: string;
  activeregion: string;
  regions: string[];
  name: string;

  static emptyInfo(): Info {
    const empty = new Info('1.0', 'en', ['en'], 'translation');
    return empty;
  }

  constructor(version: string, activeregion: string, regions: string[], name: string) {
    this.version = version;
    this.activeregion = activeregion;
    this.regions = regions;
    this.name = name;
  }
}

export class Group {
  private _id: string;
  private _path: string;
  parent: Group;
  group: Group[] = [];
  entry: Entry[] = [];
  meetsFilter: boolean = true;
  deleted: boolean = false;

  static copyTo(original: Group, parent: Group): Group {
    const copy = new Group(original.id, parent);
    for (const originalGroup of original.group) {
      Group.copyTo(originalGroup, copy);
    }
    for (const originalEntry of original.entry) {
      Entry.copyTo(originalEntry, copy);
    }
    return copy;
  }

  constructor(id: string, parent: Group) {
    this.parent = parent;
    if (parent) {
      this.parent.group.push(this);
    }
    this.setId(id);
  }

  get id(): string {
    return this._id;
  }

  get path(): string {
    return this._path;
  }

  setId(value: string) {
    this._id = value;
    this._path = getItemPath(this);
  }

  count(): [number, number] {
    let groups = this.group.length;
    let entries = this.entry.length;
    for (const group of this.group) {
      const [gc, ec] = group.count();
      groups += gc;
      entries += ec;
    }
    return [groups, entries];
  }

  markDeleted() {
    this.deleted = true;
    for (const group of this.group) {
      group.markDeleted();
    }
    for (const entry of this.entry) {
      entry.deleted = true;
    }
  }

  removeGroup(group: Group) {
    const index = this.group.indexOf(group);
    if (index < 0) {
      return;
    }
    this.group.splice(index, 1);
  }

  removeEntry(entry: Entry) {
    const index = this.entry.indexOf(entry);
    if (index < 0) {
      return;
    }
    this.entry.splice(index, 1);
  }
}

export class Entry {
  private _id: string;
  private _path: string;
  region: Region[] = [];
  parent: Group;
  meetsFilter: boolean = true;
  deleted: boolean = false;

  static newEmptyEntry(id: string, parent: Group): Entry {
    const empty = new Entry(id, parent);
    const existingRegions = get(regionList);
    for (const existing of existingRegions) {
      const region = Region.newEmptyRegion(existing);
      empty.region.push(region);
    }
    return empty;
  }

  static copyTo(original: Entry, parent: Group): Entry {
    const newEntry = new Entry(original.id, parent);
    for (const originalRegion of original.region) {
      const region = Region.copy(originalRegion);
      newEntry.region.push(region);
    }
    return newEntry;
  }

  constructor(id: string, parent: Group) {
    this.parent = parent;
    if (parent) {
      this.parent.entry.push(this);
    }
    this.setId(id);
  }

  get id(): string {
    return this._id;
  }

  get path(): string {
    return this._path;
  }

  setId(value: string) {
    this._id = value;
    this._path = getItemPath(this);
  }
}

export class Region {
  id: string;
  page: Page[];

  static newEmptyRegion(id: string): Region {
    const region = new Region(id);
    const page = new Page('');
    region.page.push(page);
    return region;
  }

  static copy(original: Region): Region {
    const region = new Region(original.id);
    for (const originalPage of original.page) {
      const page = Page.copy(originalPage);
      region.page.push(page);
    }
    return region;
  }

  constructor(id: string) {
    this.id = id;
    this.page = [];
  }
}

export class Page {
  text: string;

  static copy(original: Page): Page {
    const page = new Page(original.text);
    return page;
  }

  constructor(text: string) {
    this.text = text;
  }
}
