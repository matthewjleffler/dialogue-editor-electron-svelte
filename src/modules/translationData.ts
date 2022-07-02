import { regionList } from "$stores";
import { get } from "svelte/store";
import { rootContentId } from "./constants";
import { getItemPath } from "./utils";

export class TranslationData {
  info: Info;
  group: Group[];
  parent: Group | TranslationData;
  id: string;

  static emptyTreeData(): TranslationData {
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
  group: Group[] = [];
  entry: Entry[] = [];
  parent: Group | TranslationData;
  meetsFilter: boolean = true;
  deleted: boolean = false;

  constructor(id: string, parent: Group | TranslationData) {
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

  constructor(id: string, parent: Group) {
    this.parent = parent;
    parent.entry.push(this);
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

  constructor(id: string) {
    this.id = id;
    this.page = [];
  }
}

export class Page {
  text: string;

  constructor(text: string) {
    this.text = text;
  }
}
