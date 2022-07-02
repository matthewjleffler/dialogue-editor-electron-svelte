import type { TreeNodeItem } from "$modules/tree";
import type { TranslationData, Entry } from "$modules/translationData";
import { writable } from "svelte/store";

export const treeData = writable<TranslationData>(null);
export const treeHighlightNode = writable<TreeNodeItem>(null);
export const treeActiveEntry = writable<Entry>(null);
export const treeContextNode = writable<TreeNodeItem>(null);
export const regionList = writable<string[]>(null);
export const activeRegion = writable<string>(null);
export const filterId = writable<string>('');
export const filterText = writable<string>('');
export const projectTitle = writable<string>('');
export const unsavedProject = writable<boolean>(false);
export const unsavedExport = writable<boolean>(false);

export function setUndoPoint() {
  // TODO undo/redo

  setUnsaved();
}

export function setUnsaved() {

  unsavedExport.set(true);
  unsavedProject.set(true);
}
