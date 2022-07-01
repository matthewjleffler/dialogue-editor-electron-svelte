import type { TreeNodeItem } from "$modules/tree";
import type { TreeEntry, TreeData } from "$modules/treeData";
import { writable } from "svelte/store";

export const treeData = writable<TreeData>({
  info: {
    version: "1.0",
    activeregion: "en",
    regions: ["en"],
    name: "translation",
  },
  group: [{
    id: "Content",
    mod: "f",
    group: [],
    entry: [],
    parent: null,
    path: null,
  }],
});

export const treeActiveNode = writable<TreeNodeItem>(null);
export const treeActiveEntry = writable<TreeEntry>(null);
export const treeContextNode = writable<TreeNodeItem>(null);
export const regionList = writable<string[]>(null);
export const activeRegion = writable<string>(null);
export const filterId = writable<string>('');
export const filterText = writable<string>('');
