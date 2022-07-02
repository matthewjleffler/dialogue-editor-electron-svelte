import type { TreeNodeItem } from "$modules/tree";
import { TranslationData, type Entry } from "$modules/translationData";
import { writable } from "svelte/store";

export const treeData = writable<TranslationData>(TranslationData.emptyTreeData());
export const treeHighlightNode = writable<TreeNodeItem>(null);
export const treeActiveEntry = writable<Entry>(null);
export const treeContextNode = writable<TreeNodeItem>(null);
export const regionList = writable<string[]>(null);
export const activeRegion = writable<string>(null);
export const filterId = writable<string>('');
export const filterText = writable<string>('');
