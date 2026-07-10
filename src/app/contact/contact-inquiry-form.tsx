import { getApprovedContactInbox } from "./contact-inquiry-config";

type ContactInquiryFormProps = {
  readonly configured: boolean;
};

export function ContactInquiryForm({ configured }: ContactInquiryFormProps) {
  const inbox = configured ? getApprovedContactInbox() : null;

  if (!inbox) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <a
        className="inline-flex border border-po-brand bg-po-brand px-4 py-3 text-sm font-semibold text-po-ink hover:bg-po-brand-hover"
        href={`mailto:${encodeURIComponent(inbox)}`}
        id="presidential-contact-mailto"
        rel="nofollow"
      >
        Email Presidential
      </a>
    </div>
  );
}
