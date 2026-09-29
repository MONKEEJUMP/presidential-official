import type { Organization, WithContext } from "schema-dts";
import {
  APPROVED_SAME_AS,
  ORGANIZATION_ID,
  PRESIDENTIAL_DESCRIPTION,
  PRESIDENTIAL_NAME,
  PRODUCTION_ORIGIN,
  SCHEMA_CONTEXT,
  canonicalUrl,
} from "./constants";

type OrganizationInput = {
  logoPath?: string;
};

export function buildOrganizationSchema({
  logoPath,
}: OrganizationInput = {}): WithContext<Organization> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: PRESIDENTIAL_NAME,
    url: PRODUCTION_ORIGIN,
    description: PRESIDENTIAL_DESCRIPTION,
    email: "sales@presidentialmoonrocks.com",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "sales@presidentialmoonrocks.com",
    },
    ...(logoPath ? { logo: canonicalUrl(logoPath) } : {}),
    ...(APPROVED_SAME_AS.length > 0 ? { sameAs: [...APPROVED_SAME_AS] } : {}),
  };
}
