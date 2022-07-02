import type { Entry, Group, Region, TranslationData } from "./translationData";

export function dataToExportXml(data: TranslationData): string {
  let result = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n\n';

  const allEntries: Entry[] = [];
  getAllEntries(allEntries, data.group[0]);

  result += `<data>\n`;
  for (const region of data.info.regions) {
    result += `  <region id="${region}">\n`;

    for (const entry of allEntries) {
      const entryRegion = getEntryRegion(region, entry);
      if (entryRegion === null) {
        continue;
      }
      result += `    <line id="${getEntryPath(entry)}"><![CDATA[${getRegionPages(entryRegion)}]]></line>\n`;
    }
    result += `  </region>\n`;
  }
  result += `</data>\n`;

  return result;
}

export function dataToProjectXml(data: TranslationData): string {
  let result = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n\n';

  result += '<data>\n';
  result += '  <info>\n';
  result += `    <version>${data.info.version}</version>\n`;
  result += `      <activeregion>${data.info.activeregion}</activeregion>\n`;
  result += `    <regions>\n`;
  for (const region of data.info.regions) {
    result += `      <region>${region}</region>\n`;
  }
  result += `    </regions>\n`;
  result += `    <name>${data.info.name}</name>\n`;
  result += '  </info>\n';

  for (const group of data.group) {
    result += groupToXmlRecursive(1, group);
  }

  result += '</data>\n';
  return result;
}

function getAllEntries(result: Entry[], group: Group) {
  for (const entry of group.entry) {
    entry.parent = group;
    result.push(entry);
  }
  for (const child of group.group) {
    child.parent = group;
    getAllEntries(result, child);
  }
}

function getEntryRegion(regionId: string, entry: Entry): Region {
  for (const region of entry.region) {
    if (region.id === regionId) {
      return region;
    }
  }
  return null;
}

function getEntryPath(entry: Entry | Group): string {
  if (!entry.parent || entry.id === 'Content') {
    return '';
  }
  const parentPath = getEntryPath(entry.parent);
  if (parentPath !== '') {
    return parentPath + '.' + entry.id;
  }
  return entry.id;
}

function getRegionPages(region: Region): string {
  let result = '';
  for (let i = 0; i < region.page.length; i++) {
    const text = region.page[i].text;
    if (!text || text.length < 1) {
      continue;
    }
    if (i > 0) {
      result += '%r'; // Page split
    }
    result += cleanText(text);
  }
  return result;
}

function cleanText(text: string): string {
  text = text.trimStart();
  text = text.trimEnd();
  text = text.replace('\r', '');
  return text;
}

function groupToXmlRecursive(indent: number, group: Group): string {
  let result = `${getIndent(indent)}<group id="${group.id}">\n`;
  for (const child of group.group) {
    result += groupToXmlRecursive(indent + 1, child);
  }
  for (const entry of group.entry) {
    result += `${getIndent(indent + 1)}<entry id="${entry.id}">\n`;
    for (const region of entry.region) {
      result += `${getIndent(indent + 2)}<region id="${region.id}">\n`;
      for (let p = 0; p < region.page.length; p++) {
        const page = region.page[p];
        result += `${getIndent(indent + 3)}<page index="${p}"><![CDATA[${page.text}]]></page>\n`;
      }
      result += `${getIndent(indent + 2)}</region>\n`;
    }
    result += `${getIndent(indent + 1)}</entry>\n`;
  }
  result += `${getIndent(indent)}</group>\n`;
  return result;
}

function getIndent(indent: number): string {
  let result = '';
  for (let i = 0; i < indent; i++) {
    result += '  ';
  }
  return result;
}
