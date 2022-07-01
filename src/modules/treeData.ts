export interface TreeData {
  info: TreeInfo,
  group: TreeGroup[],
  parent?: TreeGroup | TreeData,
  id?: string,
}

export interface TreeInfo {
  version: string,
  activeregion: string,
  regions: string[],
  name: string,
}

export interface TreeGroup {
  id: string,
  mod: string,
  group: TreeGroup[],
  entry: TreeEntry[],
  parent: TreeGroup | TreeData,
  path: string,
  meetsFilter?: boolean,
  deleted?: boolean,
}

export interface TreeEntry {
  id: string,
  mod: string,
  region: TreeRegion[],
  parent: TreeGroup,
  path: string,
  meetsFilter?: boolean,
  deleted?: boolean,
}

export interface TreeRegion {
  id: string,
  page: TreePage[],
}

export interface TreePage {
  text: string,
}
