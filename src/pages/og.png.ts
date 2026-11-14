import type { APIRoute } from "astro";
import { ogCardResponse } from "../lib/og";
import { SITE } from "../site";

// The card a shared link to a page that is not a post shows: the site's name over its description.
export const GET: APIRoute = () => ogCardResponse(SITE.title, SITE.description);
