import { Article, ArticleSection, ArticleSummary } from "@/components/layout/Article";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "Terms of Use",
  description: `Read the terms for using ${SITE_NAME} file conversion tools.`,
  alternates: { canonical: "/terms" },
};

const TERMS_SECTIONS = [
  { id: "acceptance", label: "Acceptance" },
  { id: "service", label: "The Service" },
  { id: "files", label: "Your files" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "intellectual-property", label: "Intellectual property" },
  { id: "third-parties", label: "Third parties and donations" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "liability", label: "Limitation of liability" },
  { id: "indemnity", label: "Indemnity" },
  { id: "changes", label: "Changes and general terms" },
] as const;

export default function TermsPage() {
  return (
    <Article
      title="Terms of Use"
      description={`The rules that apply when you access or use ${SITE_NAME}.`}
      updated="October 3, 2026"
      sections={TERMS_SECTIONS}
      documents={[
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms", active: true },
      ]}
    >
      <ArticleSummary
        eyebrow="Plain-language summary"
        title="Use the tools responsibly. Verify what you create."
        signals={["Lawful files", "Check outputs", "Keep backups"]}
      >
        <p>
          Use the tools only for lawful files you are entitled to process, review every output before relying on it, and do
          not attempt to disrupt the Service. The detailed terms below control if this summary and the terms differ.
        </p>
      </ArticleSummary>

      <ArticleSection id="acceptance" index="01" title="Acceptance of these terms">
        <p>
          These Terms of Use (&quot;Terms&quot;) form an agreement between you and {SITE_NAME} (&quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) and govern your access to allyouconvert.com and its tools, content, and related
          services (collectively, the &quot;Service&quot;). By using the Service, you agree to these Terms and our Privacy
          Policy. If you do not agree, do not use the Service.
        </p>
        <p>
          You must be legally capable of entering this agreement. If you use the Service for an organization, you represent
          that you have authority to bind that organization.
        </p>
      </ArticleSection>

      <ArticleSection id="service" index="02" title="The Service">
        <p>
          {SITE_NAME} provides file-conversion, compression, organization, and related informational tools. Available tools
          generally process files in your browser. Pages marked as requiring a dedicated worker may be unavailable until
          that infrastructure is online.
        </p>
        <p>
          We may add, change, limit, suspend, or discontinue any part of the Service. We do not promise that every format,
          browser, file, feature, or output will be supported or that the Service will always be available.
        </p>
      </ArticleSection>

      <ArticleSection id="files" index="03" title="Your files and responsibilities">
        <p>
          You retain any rights you have in your files. You are solely responsible for your files, your instructions, and
          the outputs you create. You represent that you own the files or have all permissions needed to process them,
          including any copyright, privacy, confidentiality, trademark, font, media, and document rights.
        </p>
        <p>
          Conversions can alter formatting, metadata, color, quality, layout, formulas, links, signatures, accessibility
          information, or other file properties. You must inspect and validate each output before publishing, sharing,
          signing, printing, archiving, or relying on it. Keep independent backups of important originals.
        </p>
      </ArticleSection>

      <ArticleSection id="acceptable-use" index="04" title="Acceptable use">
        <p>You may not use, or help another person use, the Service to:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-ink">
          <li>violate law, regulation, court order, contract, or another person&apos;s rights;</li>
          <li>process unlawful, infringing, deceptive, abusive, exploitative, or privacy-invasive material;</li>
          <li>introduce malware, harmful code, corrupted payloads, or content intended to compromise systems or users;</li>
          <li>bypass security, access controls, rate limits, availability restrictions, or technical safeguards;</li>
          <li>probe, scan, overload, scrape at disruptive scale, reverse engineer, or interfere with the Service; or</li>
          <li>misrepresent an output as accurate, authentic, certified, or legally valid when it has not been verified.</li>
        </ul>
        <p>We may restrict access or take other reasonable action when we believe these rules have been violated.</p>
      </ArticleSection>

      <ArticleSection id="intellectual-property" index="05" title="Intellectual property">
        <p>
          The Service, including its design, software, branding, text, graphics, and original content, is owned by or
          licensed to {SITE_NAME} and is protected by applicable intellectual-property laws. Subject to these Terms, we
          grant you a limited, revocable, non-exclusive, non-transferable license to use the Service for its intended purpose.
        </p>
        <p>
          This license does not permit you to copy or resell the Service, remove proprietary notices, create a competing
          service from our protected materials, or use our names and marks without permission. Third-party formats, names,
          and marks remain the property of their respective owners.
        </p>
      </ArticleSection>

      <ArticleSection id="third-parties" index="06" title="Third-party services and donations">
        <p>
          The Service may contain links, advertisements, or integrations operated by third parties. Their products, content,
          availability, and data practices are governed by their own terms and policies. We are not responsible for
          third-party services merely because the Service links to them.
        </p>
        <p>
          Donations are voluntary and processed by PayPal under PayPal&apos;s terms. A donation does not purchase a product,
          create a subscription, guarantee continued operation or support, grant influence over the Service, or change your
          rights under these Terms. Any refund request is subject to applicable law and PayPal&apos;s processes.
        </p>
      </ArticleSection>

      <ArticleSection id="disclaimers" index="07" title="Disclaimers">
        <p>
          To the fullest extent permitted by law, the Service is provided &quot;as is&quot; and &quot;as available&quot;,
          without warranties of any kind, whether express, implied, or statutory. We disclaim warranties of merchantability,
          fitness for a particular purpose, title, non-infringement, accuracy, compatibility, security, and uninterrupted
          availability.
        </p>
        <p>
          The Service does not provide legal, compliance, archival, medical, financial, or other professional advice. No
          output should be treated as certified, lossless, complete, secure, or suitable for a regulated purpose unless you
          independently verify it.
        </p>
      </ArticleSection>

      <ArticleSection id="liability" index="08" title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, {SITE_NAME} and its operators, affiliates, and service providers will not
          be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of files,
          data, profits, revenue, business, goodwill, or opportunities arising from or related to the Service.
        </p>
        <p>
          Where liability cannot be excluded, our aggregate liability for claims relating to the Service will be limited to
          the greater of the amount you paid directly to us for the Service during the 12 months before the claim or USD
          10. Voluntary donations are not fees for the Service. Some jurisdictions do not allow certain exclusions or
          limits, so parts of this section may not apply to you.
        </p>
      </ArticleSection>

      <ArticleSection id="indemnity" index="09" title="Indemnity">
        <p>
          To the extent permitted by law, you agree to defend, indemnify, and hold harmless {SITE_NAME} and its operators
          from third-party claims, losses, liabilities, and reasonable costs arising from your files, your misuse of the
          Service, or your violation of these Terms or another person&apos;s rights.
        </p>
      </ArticleSection>

      <ArticleSection id="changes" index="10" title="Changes, termination, and general terms">
        <p>
          We may update these Terms to reflect changes to the Service, providers, risks, or law. The effective date above
          identifies the latest version. Continued use after revised Terms take effect constitutes acceptance where
          permitted by law. We may suspend or terminate access for misuse, risk, legal requirements, or operational reasons.
        </p>
        <p>
          If any provision is unenforceable, it will be limited to the minimum extent necessary and the remaining provisions
          will continue in effect. A failure to enforce a provision is not a waiver. You may not assign these Terms without
          our consent; we may assign them as part of a reorganization or transfer of the Service.
        </p>
        <p>
          Applicable law and courts with competent jurisdiction govern disputes, subject to any mandatory consumer rights
          that apply where you live. For questions about these Terms, use an official contact method published by {SITE_NAME}.
        </p>
      </ArticleSection>
    </Article>
  );
}
