import type { TreeNodeItem } from "$modules/tree";
import { TreeData, type Entry } from "$modules/treeData";
import { writable } from "svelte/store";

export const treeData = writable<TreeData>(TreeData.emptyTreeData());
export const treeActiveNode = writable<TreeNodeItem>(null);
export const treeActiveEntry = writable<Entry>(null);
export const treeContextNode = writable<TreeNodeItem>(null);
export const regionList = writable<string[]>(null);
export const activeRegion = writable<string>(null);
export const filterId = writable<string>('');
export const filterText = writable<string>('');
