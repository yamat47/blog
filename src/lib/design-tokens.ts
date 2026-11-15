/**
 * The value a design token has in the stylesheet `css`, for what is drawn outside a page and
 * cannot read a CSS variable.
 *
 * A token that is not there is an error: a card drawn with a color made up here would stop
 * following the stylesheet without anyone noticing.
 */
export function tokenValue(css: string, name: string): string {
  const declaration = new RegExp(`(?<![\\w-])${name}:\\s*([^;]+);`).exec(css);
  const value = declaration?.[1]?.trim();
  if (value === undefined) {
    throw new Error(`the design tokens have no ${name}`);
  }
  return value;
}
