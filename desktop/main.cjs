const { app, BrowserWindow, net, protocol, session } = require("electron");
const { stat } = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const APP_ID = "com.ddd.gamehub";
const APP_ORIGIN = "gamehub://app";
const DIST_DIRECTORY = app.isPackaged
  ? path.join(process.resourcesPath, "dist")
  : path.resolve(__dirname, "..", "dist");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "gamehub",
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      codeCache: true,
    },
  },
]);

app.enableSandbox();

async function serveAppAsset(request) {
  const requestUrl = new URL(request.url);
  if (requestUrl.host !== "app") {
    return new Response("Not found", { status: 404 });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    return new Response("Invalid path", { status: 400 });
  }

  const relativeAssetPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let assetPath = path.resolve(DIST_DIRECTORY, relativeAssetPath);
  const relativePath = path.relative(DIST_DIRECTORY, assetPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return new Response("Invalid path", { status: 400 });
  }

  try {
    const assetStats = await stat(assetPath);
    if (assetStats.isDirectory()) {
      assetPath = path.join(assetPath, "index.html");
    }

    return net.fetch(pathToFileURL(assetPath).toString());
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 420,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#001219",
    icon: path.join(DIST_DIRECTORY, "icons", "imposter", "custom.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    if (!navigationUrl.startsWith(`${APP_ORIGIN}/`)) {
      event.preventDefault();
    }
  });

  mainWindow.loadURL(`${APP_ORIGIN}/`);
}

app.whenReady().then(async () => {
  app.setAppUserModelId(APP_ID);
  await protocol.handle("gamehub", serveAppAsset);

  const allowedPermissions = new Set(["fullscreen"]);
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) =>
    allowedPermissions.has(permission),
  );
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(allowedPermissions.has(permission));
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
