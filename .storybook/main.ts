import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "node:url";
import type { PluginOption } from "vite";

function removeAppOnlyPlugins(plugins: PluginOption[] | undefined): PluginOption[] {
  return (plugins ?? []).flatMap((plugin) => {
    if (Array.isArray(plugin)) {
      return removeAppOnlyPlugins(plugin);
    }

    if (!plugin || typeof plugin !== "object" || !("name" in plugin)) {
      return [plugin];
    }

    const name = String(plugin.name);

    if (name.includes("tanstack") || name.includes("cloudflare")) {
      return [];
    }

    return [plugin];
  });
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: (config) => ({
    ...config,
    plugins: removeAppOnlyPlugins(config.plugins),
    resolve: {
      ...config.resolve,
      alias: {
        ...(!Array.isArray(config.resolve?.alias) ? config.resolve?.alias : {}),
        "@tanstack/react-start/server-only": fileURLToPath(
          new URL("./mocks/react-start-server-only.ts", import.meta.url),
        ),
        "@tanstack/react-start/server": fileURLToPath(
          new URL("./mocks/react-start-server.ts", import.meta.url),
        ),
        "@tanstack/react-start": fileURLToPath(new URL("./mocks/react-start.ts", import.meta.url)),
        "#/server/api/championship-functions": fileURLToPath(
          new URL("./mocks/championship-functions.ts", import.meta.url),
        ),
        "#/server/api/championship-draft-functions": fileURLToPath(
          new URL("./mocks/championship-draft-functions.ts", import.meta.url),
        ),
        "#/server/api/championship-format-functions": fileURLToPath(
          new URL("./mocks/championship-format-functions.ts", import.meta.url),
        ),
        "#/server/api/championship-match-functions": fileURLToPath(
          new URL("./mocks/championship-match-functions.ts", import.meta.url),
        ),
      },
    },
  }),
};

export default config;
