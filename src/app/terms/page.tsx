import { Article } from "@/components/layout/Article";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <Article title="Terms">
      <p>
        FreeConverter is provided as-is for converting files you have the right to convert. You are responsible for font,
        media, and document licenses.
      </p>
      <p>We do not guarantee uninterrupted service. Video jobs may be queued or refused when the worker is at capacity.</p>
      <p>Do not upload malware or content you are not allowed to process.</p>
    </Article>
  );
}
