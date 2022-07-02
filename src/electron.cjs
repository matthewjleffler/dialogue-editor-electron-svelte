const windowStateManager = require('electron-window-state');
const contextMenu = require('electron-context-menu');
const { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog, shell } = require('electron');
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
const EVENT_UNDO = 'event-undo';
const EVENT_REDO = 'event-redo';

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
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
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
      spellcheck: false,
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
ipcMain.on(EVENT_RECEIVE_PROJECT_EXPORT, (event, arg) => finishSaveProject(arg));
ipcMain.on(EVENT_RELOAD_LAST_PROJECT, () => readProjectPath());

function dispatchToApp(event, ...val) {
  mainWindow.webContents.send(event, ...val);
}

function log(message, ...args) {
  dispatchToApp(EVENT_ELECTRON_LOG, message, ...args);
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
  // TODO undo/redo my own changes
  mainWindow.webContents.undo();
  dispatchToApp(EVENT_UNDO);
}

function redo() {
  // TODO undo/redo my own changes
  mainWindow.webContents.redo();
  dispatchToApp(EVENT_REDO);
}

function getIndent(indent) {
  let result = '';
  for (let i = 0; i < indent; i++) {
    result += '  ';
  }
  return result;
}

function groupToXmlRecursive(indent, group) {
  let result = `${getIndent(indent)}<group id="${group._id}">\n`;
  for (const child of group.group) {
    result += groupToXmlRecursive(indent + 1, child);
  }
  for (const entry of group.entry) {
    result += `${getIndent(indent + 1)}<entry id="${entry._id}">\n`;
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

function dataToXml(data) {
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

function getAllEntries(result, group) {
  for (const entry of group.entry) {
    entry.parent = group;
    result.push(entry);
  }
  for (const child of group.group) {
    child.parent = group;
    getAllEntries(result, child);
  }
}

function getEntryRegion(regionId, entry) {
  for (const region of entry.region) {
    if (region.id === regionId) {
      return region;
    }
  }
  return null;
}

function getEntryPath(entry) {
  if (!entry.parent || entry.id === 'Content') {
    return '';
  }
  const parentPath = getEntryPath(entry.parent);
  if (parentPath !== '') {
    return parentPath + '.' + entry._id;
  }
  return entry._id;
}

function cleanText(text) {
  text = text.trimLeft();
  text = text.trimRight();
  text = text.replace('\r', '');
  return text;
}

function getRegionPages(region) {
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

function dataToExportXml(data) {
  let result = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n\n';

  const allEntries = [];
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

async function finishSaveProject(args) {
  const { request, data } = args;
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
    const exportXml = dataToExportXml(data);
    const exportPath = `${app.getPath('desktop')}/translation.xml`;
    try {
      await fs.writeFile(exportPath, exportXml)
      log(`Exported to: ${exportPath}`);
    } catch (err) {
      log(err)
    }
    return;
  }

  // Normal save
  const dataXml = dataToXml(data);
  try {
    await fs.writeFile(currentProjectPath, dataXml);
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
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};
