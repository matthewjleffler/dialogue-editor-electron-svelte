import { browser } from "$app/env";
import type { TreeData } from "./treeData";

type Listener = (...values: unknown[]) => void;

export interface SaveRequest {
  msg: {
    doSaveAs: boolean,
    doExport: boolean,
  },
};

export interface SaveMessage {
  request: SaveRequest,
  data: TreeData,
}

export enum ElectronEvent {
  ElectronLog = 'electron-log',
  OpenContextRightClick = 'open-context-right-click',
  ReceiveProjectExport = 'receive-project-export',
  ReloadLastProject = 'reload-last-project',
  ContextTreeNewGroup = 'context-tree-new-group',
  ContextTreeNewEntry = 'context-tree-new-entry',
  ContextTreeDuplicateId = 'context-tree-duplicate-id',
  ContextTreeRename = 'context-tree-rename',
  ContextTreeCopy = 'context-tree-copy',
  ContextTreeCut = 'context-tree-cut',
  ContextTreePaste = 'context-tree-paste',
  ContextTreeDelete = 'context-tree-delete',
  TreeChange = 'tree-change',
  GetProjectExport = 'get-project-export',
}

export const electronDispatch = function (event: ElectronEvent, ...values: unknown[]) {
  if (!browser || !window.electron) {
    return;
  }
  window.electron.send(event, ...values);
}

export const electronListen = function (event: ElectronEvent, listener: Listener) {
  if (!browser || !window.electron) {
    return;
  }
  window.electron.receive(event, listener);
}
