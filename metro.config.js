const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude Amplify CDK build artifacts from Metro's file watcher.
// These temp directories are created/deleted during `npx ampx sandbox`
// and cause ENOENT crashes when Metro tries to watch them.
config.watcher = {
    ...config.watcher,
    additionalExclusions: [
        /\.amplify\//,
    ],
};

module.exports = config;
