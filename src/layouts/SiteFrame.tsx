import { Page, SiteFooter, SiteHeader } from "@yamat47/pylon";
import type { ComponentProps, ReactNode } from "react";
import { SITE } from "../site.ts";

/** How wide a page's content is: `wide` for the list of posts, `text` for a page to read. */
export type PageWidth = ComponentProps<typeof Page>["width"];

type SiteFrameProps = {
  width: PageWidth;
  /** Whether the site's name is the page's heading, which it is on the top page alone. */
  nameIsHeading: boolean;
  children?: ReactNode;
};

/**
 * What every page has around its content: the design system's page, with this site's header and
 * footer in it.
 *
 * It is a React component because the page takes its header and footer as props. A layout written
 * in Astro can only hand them over as named slots, which the typecheck does not count as the
 * props the page requires. It is rendered when the site is built and ships no script.
 */
export function SiteFrame({ width, nameIsHeading, children }: SiteFrameProps) {
  return (
    <Page
      width={width}
      header={
        <SiteHeader
          name={SITE.title}
          href="/"
          description={SITE.description}
          heading={nameIsHeading}
          nav={[{ label: "検索", href: SITE.searchPath }]}
        />
      }
      footer={<SiteFooter links={[{ label: "プライバシーポリシー", href: SITE.privacyPath }]} />}
    >
      {children}
    </Page>
  );
}
