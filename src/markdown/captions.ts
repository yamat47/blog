import type { MdastPlugin } from "./mdast-plugin.ts";

/**
 * Shows an image's title as a caption under it: an image alone in its paragraph that has a title
 * (`![alt](./photo.jpg "caption")`) becomes a figure holding the image and the caption.
 *
 * The title is taken off the image, where a browser would show it again as a tooltip. An image
 * without a title, or one inside a sentence, is left as it is.
 */
export function captions(): MdastPlugin {
  return {
    name: "captions",
    paragraph(node, ctx) {
      const [image, ...rest] = node.children;
      if (image?.type !== "image" || rest.length > 0) {
        return;
      }
      const caption = image.title;
      if (caption === null || caption === undefined || caption === "") {
        return;
      }
      ctx.replaceNode(node, {
        type: "figure",
        data: { hName: "figure" },
        children: [
          { ...image, title: null },
          {
            type: "figcaption",
            data: { hName: "figcaption" },
            children: [{ type: "text", value: caption }],
          },
        ],
      });
    },
  };
}
