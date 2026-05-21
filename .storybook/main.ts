import type { StorybookConfig } from "@storybook/react-vite";
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
  }),
};

export default config;
