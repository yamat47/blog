import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";

// The plugin type is taken from the processor's options because satteri, which declares it, is
// not a direct dependency. An entry of the option can also be a function that makes a plugin, and
// a function has a name too, so those are taken out again.
type MdastPluginEntry = NonNullable<SatteriProcessorOptions["mdastPlugins"]>[number];

/** A plugin for the Markdown tree of the processor Astro renders posts with. */
export type MdastPlugin = Exclude<
  Extract<MdastPluginEntry, { name: string }>,
  (...args: never[]) => unknown
>;
