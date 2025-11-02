module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          alias: {
            "@app": "./src/app",
            "@components": "./src/components",
            "@state": "./src/state",
            "@lib": "./src/lib",
            "@theme": "./src/theme",
            "@data": "./src/data"
          }
        }
      ]
    ]
  };
};
