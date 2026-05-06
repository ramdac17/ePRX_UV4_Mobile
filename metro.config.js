const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;

config.resolver.blockList = [
  // Ignore the System Volume Information and other root-level Windows folders
  /.*\\System Volume Information.*/,
  /.*\.git.*/,
];

config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [
    require.resolve(path.join(__dirname, "globals.js")),
  ],
};

// Ensure Metro only watches your specific project folder
config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];

module.exports = config;
