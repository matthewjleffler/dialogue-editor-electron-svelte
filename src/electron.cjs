const windowStateManager = require('electron-window-state');
const contextMenu = require('electron-context-menu');
const { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog } = require('electron');
const serve = require('electron-serve');
const path = require('path');
const fs = require('fs/promises');
const convert = require('xml-js');

try {
  require('electron-reloader')(module);
} catch (e) {
  console.error(e);
}

// Event constants
const EVENT_ELECTRON_LOG = 'electron-log';
const EVENT_OPEN_CONTEXT_RIGHT_CLICK = 'open-context-right-click';
const EVENT_OPEN_PAGE_CONTEXT = 'open-page-context';
const EVENT_RECEIVE_PROJECT_EXPORT = 'receive-project-export';
const EVENT_RELOAD_LAST_PROJECT = 'reload-last-project';
const EVENT_CONTEXT_TREE_NEW_GROUP = 'context-tree-new-group';
const EVENT_CONTEXT_TREE_NEW_ENTRY = 'context-tree-new-entry';
const EVENT_CONTEXT_TREE_DUPLICATE_ID = 'context-tree-duplicate-id';
const EVENT_CONTEXT_TREE_RENAME = 'context-tree-rename';
const EVENT_CONTEXT_TREE_COPY = 'context-tree-copy';
const EVENT_CONTEXT_TREE_CUT = 'context-tree-cut';
const EVENT_CONTEXT_TREE_PASTE = 'context-tree-paste';
const EVENT_CONTEXT_TREE_DELETE = 'context-tree-delete';
const EVENT_TREE_CHANGE = 'tree-change';
const EVENT_GET_PROJECT_EXPORT = 'get-project-export';
const EVENT_NEW_PROJECT = 'event-new-project';
const EVENT_RENAME_PROJECT = 'event-rename-project';
const EVENT_UNDO = 'event-undo';
const EVENT_REDO = 'event-redo';
const EVENT_DEFAULT_UNDO = 'event-default-undo';
const EVENT_SET_TITLE = 'event-set-title';

const serveURL = serve({ directory: "." });
const port = process.env.PORT || 3000;
const dev = !app.isPackaged;
let mainWindow;

function createWindow() {
  let windowState = windowStateManager({
    defaultWidth: 1350,
    defaultHeight: 860,
  });

  const mainWindow = new BrowserWindow({
    backgroundColor: 'black',
    // titleBarStyle: 'hidden',
    autoHideMenuBar: false,
    trafficLightPosition: {
      x: 17,
    },
    width: 1350,
    height: 860,
    minHeight: 450,
    minWidth: 700,
    webPreferences: {
      enableRemoteModule: true,
      contextIsolation: true,
      nodeIntegration: true,
      spellcheck: true,
      devTools: dev,
      preload: path.join(__dirname, "preload.cjs")
    },
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
  });

  windowState.manage(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    generateMenu();
  });

  mainWindow.on('close', () => {
    windowState.saveState(mainWindow);
  });

  return mainWindow;
}

contextMenu({
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  showInspectElement: false,
});

function loadVite(port) {
  mainWindow.loadURL(`http://localhost:${port}`).catch((e) => {
    console.log('Error loading URL, retrying', e);
    setTimeout(() => {
      loadVite(port);
    }, 200);
  });
}

function createMainWindow() {
  mainWindow = createWindow();
  mainWindow.once('close', () => { mainWindow = null });

  if (dev) loadVite(port);
  else serveURL(mainWindow);
}

app.once('ready', createMainWindow);
app.on('activate', () => {
  if (!mainWindow) {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on(EVENT_OPEN_CONTEXT_RIGHT_CLICK, () => treeContextMenu());
ipcMain.on(EVENT_OPEN_PAGE_CONTEXT, () => pageContextMenu());
ipcMain.on(EVENT_RECEIVE_PROJECT_EXPORT, (event, arg) => finishSaveProject(arg));
ipcMain.on(EVENT_RELOAD_LAST_PROJECT, () => readProjectPath());
ipcMain.on(EVENT_DEFAULT_UNDO, (event, arg) => setDefaultUndo(arg));
ipcMain.on(EVENT_SET_TITLE, (event, arg) => setTitle(arg));

function dispatchToApp(event, ...val) {
  mainWindow.webContents.send(event, ...val);
}

function log(message, ...args) {
  dispatchToApp(EVENT_ELECTRON_LOG, message, ...args);
}

let defaultUndo = false;
function setDefaultUndo(allowed) {
  defaultUndo = allowed;
}

function setTitle(title) {
  mainWindow.setTitle(title);
}

function treeContextMenu() {
  const menu = new Menu();

  menu.append(new MenuItem({
    label: "New Group",
    click: () => dispatchToApp(EVENT_CONTEXT_TREE_NEW_GROUP)
  }));
  menu.append(new MenuItem({
    label: "New Entry",
    click: () => dispatchToApp(EVENT_CONTEXT_TREE_NEW_ENTRY)
  }));
  menu.append(new MenuItem({
    label: "Duplicate Id",
    click: () => dispatchToApp(EVENT_CONTEXT_TREE_DUPLICATE_ID)
  }));
  menu.append(new MenuItem({ type: "separator" }));
  menu.append(new MenuItem({
    label: "Rename",
    click: () => dispatchToApp(EVENT_CONTEXT_TREE_RENAME)
  }));
  menu.append(new MenuItem({ type: "separator" }));
  menu.append(new MenuItem({
    label: "Copy",
    click: () => dispatchToApp(EVENT_CONTEXT_TREE_COPY)
  }));
  menu.append(new MenuItem({
    label: "Cut",
    click: () => dispatchToApp(EVENT_CONTEXT_TREE_CUT)
  }));
  menu.append(new MenuItem({
    label: "Paste",
    click: () => dispatchToApp(EVENT_CONTEXT_TREE_PASTE)
  }));
  menu.append(new MenuItem({
    label: "Delete",
    click: () => dispatchToApp(EVENT_CONTEXT_TREE_DELETE)
  }));

  menu.popup({});
}

function pageContextMenu() {
  const menu = new Menu();

  menu.append(new MenuItem({ role: 'cut', accelerator: 'CmdOrCtrl+X' }));
  menu.append(new MenuItem({ role: 'copy', accelerator: 'CmdOrCtrl+C' }));
  menu.append(new MenuItem({ role: 'paste', accelerator: 'CmdOrCtrl+V' }));
  menu.append(new MenuItem({ role: 'selectAll', accelerator: 'CmdOrCtrl+A' }));

  menu.popup({});
}

async function writeProjectPath() {
  const exportPath = `${app.getPath('userData')}/userData.txt`;
  try {
    const success = await fs.writeFile(exportPath, currentProjectPath);
    log(`Saved Project Path: ${currentProjectPath}`);
  } catch (err) {
    log(err);
  }
}

async function readProjectPath() {
  const exportPath = `${app.getPath('userData')}/userData.txt`;
  try {
    const data = await fs.readFile(exportPath, 'utf-8');
    if (data) {
      currentProjectPath = data;
      finishOpenProject();
    }
  } catch (err) {
    log(err);
  }
}

async function finishOpenProject() {
  try {
    const data = await fs.readFile(currentProjectPath, 'utf-8');
    const result = convert.xml2js(data, { compact: true });
    dispatchToApp(EVENT_TREE_CHANGE, result);
  } catch (err) {
    log(`Error reading project file at ${currentProjectPath}`);
    currentProjectPath = '';
    writeProjectPath();
  }
}

async function openProject() {
  const result = await dialog.showOpenDialog({
    title: "Open Project",
    filters: [{ name: "Project", extensions: ['dpr'] }],
    properties: ["openFile"],
  });
  if (result === undefined || result.filePaths === undefined) {
    return;
  }
  currentProjectPath = result.filePaths[0];
  writeProjectPath();
  finishOpenProject();
}

function newProject() {
  dispatchToApp(EVENT_NEW_PROJECT);
}

function renameProject() {
  dispatchToApp(EVENT_RENAME_PROJECT);
}

function requestSave(doSaveAs, doExport) {
  dispatchToApp(EVENT_GET_PROJECT_EXPORT, { msg: { doSaveAs: doSaveAs, doExport: doExport } });
}

function saveProject() {
  requestSave(currentProjectPath === '', false);
}

function saveProjectAs() {
  requestSave(true, false);
}

function exportProject() {
  requestSave(false, true);
}

function undo() {
  if (defaultUndo) {
    mainWindow.webContents.undo();
    return;
  }
  dispatchToApp(EVENT_UNDO);
}

function redo() {
  if (defaultUndo) {
    mainWindow.webContents.redo();
    return;
  }
  dispatchToApp(EVENT_REDO);
}

async function finishSaveProject(args) {
  const { request, xml } = args;
  const { doExport, doSaveAs } = request.msg;

  // "Save as" if appropriate
  if (doSaveAs) {
    const paths = dialog.showSaveDialog({
      title: "Save Project As",
      filters: [{ name: "Project", extensions: ['dpr'] }],
      defaultPath: currentProjectPath,
    });
    if (paths === undefined) {
      // No path to save
      return;
    }
    currentProjectPath = paths.join('');
  }

  // Export
  if (doExport) {
    const exportPath = `${app.getPath('desktop')}/translation.xml`;
    try {
      await fs.writeFile(exportPath, xml)
      log(`Exported to: ${exportPath}`);
    } catch (err) {
      log(err)
    }
    return;
  }

  // Normal save
  try {
    await fs.writeFile(currentProjectPath, xml);
    log(`Saved Project to: ${currentProjectPath}`);
    writeProjectPath();
  } catch (err) {
    log(err);
  }
}

function generateMenu() {
  log('Generating menu');
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: "New Project",
          accelerator: "CmdOrCtrl+N",
          click: newProject,
        },
        {
          label: "Open Project",
          accelerator: "CmdOrCtrl+O",
          click: openProject,
        },
        {
          label: "Save Project",
          accelerator: "CmdOrCtrl+S",
          click: saveProject,
        },
        {
          label: "Save Project As",
          click: saveProjectAs,
        },
        {
          label: 'Rename Project',
          click: renameProject,
        },
        {
          type: 'separator',
        },
        // {
        //   label: 'Import XML',
        // },
        {
          label: 'Export XML',
          accelerator: 'CmdOrCtrl+E',
          click: exportProject,
        },
        { type: 'separator' },
        { role: 'about' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: undo },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', click: redo },
        { type: "separator" },
        { role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { role: 'paste', accelerator: 'CmdOrCtrl+V' },
        { role: 'selectAll', accelerator: 'CmdOrCtrl+A' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }],
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};
