export interface TreeXmlRoot {
  data: TreeXmlData,
}

export interface TreeXmlData {
  info: TreeXmlInfo,
  group: TreeXmlGroup,
}

export interface TreeXmlInfo {
  activeregion: TreeXmlText,
  name: TreeXmlText,
  regions: TreeXmlInfoRegions,
  version: TreeXmlText,
}

export interface TreeXmlInfoRegions {
  region: TreeXmlText[] | TreeXmlText,
}

export interface TreeXmlGroup {
  _attributes: {
    id: string
  },
  group?: TreeXmlGroup[] | TreeXmlGroup,
  entry?: TreeXmlEntry[] | TreeXmlEntry,
}

export interface TreeXmlEntry {
  _attributes: {
    id: string,
  },
  region: TreeXmlRegion,
}

export interface TreeXmlRegion {
  _attributes: {
    id: string,
  },
  page: TreeXmlPage[] | TreeXmlPage,
}

export interface TreeXmlPage {
  _attributes: {
    index: string,
  },
  _cdata: string,
}

export interface TreeXmlText {
  _text: string,
}
