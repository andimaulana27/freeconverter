import { Article } from "@/components/layout/Article";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy",
  description: `Learn how ${SITE_NAME} processes files and protects your privacy.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Article title="Privacy">
      <p>
        Browser tools (images, ICO, SVG, PDF, fonts) run on your device. Files are not uploaded to {SITE_NAME} servers
        for those conversions.
      </p>
      <p>
        Video and audio conversion is skipped until a dedicated worker exists. Those files would be stored briefly, then
        deleted. We do not sell file contents.
      </p>
      <p>
        If you add a Supabase account later, only account data (email, quotas) is stored. Converted files are not kept as
        a library.
      </p>
    </Article>
  );
}
