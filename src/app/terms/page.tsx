import { Article } from "@/components/layout/Article";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "Terms of Use",
  description: `Read the terms for using ${SITE_NAME} file conversion tools.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <Article title="Terms">
      <p>
        {SITE_NAME} is provided as-is for converting files you have the right to convert. You are responsible for font,
        media, and document licenses.
      </p>
      <p>We do not guarantee uninterrupted service. Video jobs may be queued or refused when the worker is at capacity.</p>
      <p>Do not upload malware or content you are not allowed to process.</p>
    </Article>
  );
}
