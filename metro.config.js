const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [
    require.resolve(path.join(__dirname, "globals.js")),
  ],
};

module.exports = config;
