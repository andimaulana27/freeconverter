import { Article } from "@/components/layout/Article";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <Article title="Privacy">
      <p>
        Browser tools (images, PDF, fonts) run on your device. Files are not uploaded to FreeConverter servers for those
        conversions.
      </p>
      <p>
        Video and audio conversion will use a private worker later. Those files will be stored briefly, then deleted. We
        do not sell file contents.
      </p>
      <p>
        If you add a Supabase account later, only account data (email, quotas) is stored. Converted files are not kept as
        a library.
      </p>
    </Article>
  );
}
