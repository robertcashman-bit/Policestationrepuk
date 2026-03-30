/**
 * policestationrepuk-seo-layer
 * Central SEO: metadata, JSON-LD schemas, config.
 */

export { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from './config';
export { buildMetadata } from './metadata';
export type { MetadataInput } from './metadata';
export {
  organizationSchema,
  webSiteSchema,
  platformLegalServiceSchema,
  legalServiceSchema,
  localBusinessSchema,
  breadcrumbSchema,
  placeSchema,
  personSchema,
  blogPostingSchema,
  faqPageSchema,
  directoryServiceLocalBusinessSchema,
  directoryItemListSchema,
} from './schemas';
