import { type LinkItem, Page, SiteFooter, SiteHeader } from "@yamat47/pylon";
import type { ComponentProps, ReactNode } from "react";
import { formatDay } from "../lib/date.ts";
import { SITE } from "../site.ts";

const search: LinkItem = { label: "検索", href: SITE.searchPath };

// The footer's links: the site's pages, and where else its author is.
const footerGroups = [
  { label: "サイト", links: [search, { label: "プライバシーポリシー", href: SITE.privacyPath }] },
  {
    label: "リンク",
    links: [
      { label: "X", href: "https://x.com/yamat47" },
      { label: "GitHub", href: "https://github.com/yamat47" },
    ],
  },
];

// The copyright is stated for the year the site is built in, in its time zone.
const copyright = { year: Number(formatDay(new Date()).slice(0, 4)), holder: SITE.author };

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
          nav={[search]}
        />
      }
      footer={<SiteFooter name={SITE.title} href="/" groups={footerGroups} copyright={copyright} />}
    >
      {children}
    </Page>
  );
}
