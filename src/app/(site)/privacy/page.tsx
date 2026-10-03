import { Article, ArticleSection, ArticleSummary } from "@/components/layout/Article";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy",
  description: `Learn how ${SITE_NAME} processes files and protects your privacy.`,
  alternates: { canonical: "/privacy" },
};

const PRIVACY_SECTIONS = [
  { id: "scope", label: "Scope" },
  { id: "file-processing", label: "File processing" },
  { id: "information", label: "Information we may process" },
  { id: "cookies", label: "Cookies and advertising" },
  { id: "uses", label: "How information is used" },
  { id: "providers", label: "Providers and disclosure" },
  { id: "retention", label: "Retention and transfers" },
  { id: "rights", label: "Your privacy rights" },
  { id: "security", label: "Security and changes" },
] as const;

export default function PrivacyPage() {
  return (
    <Article
      title="Privacy Policy"
      description={`How ${SITE_NAME} handles files, technical data, advertising, and donations.`}
      updated="October 3, 2026"
      sections={PRIVACY_SECTIONS}
      documents={[
        { href: "/privacy", label: "Privacy", active: true },
        { href: "/terms", label: "Terms" },
      ]}
    >
      <ArticleSummary
        eyebrow="Privacy at a glance"
        title="Your files stay where the work happens."
        signals={["On-device files", "No file library", "Clear providers"]}
      >
        <p>
          Available conversion tools process files on your device. We do not receive, store, or build a library of those
          files. Limited technical data may still be handled by our hosting, security, advertising, and donation providers.
        </p>
      </ArticleSummary>

      <ArticleSection id="scope" index="01" title="Scope">
        <p>
          This Privacy Policy explains how {SITE_NAME} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) handles
          information when you visit allyouconvert.com, use its conversion tools, read its content, or follow its donation
          links (collectively, the &quot;Service&quot;).
        </p>
      </ArticleSection>

      <ArticleSection id="file-processing" index="02" title="File processing">
        <p>
          Conversion tools marked as browser or on-device tools process your files locally through your web browser. The
          file contents are not uploaded to {SITE_NAME} servers. Your browser may temporarily hold file data in memory while
          a conversion is running; closing or refreshing the page normally clears that working data.
        </p>
        <p>
          Tools that require a dedicated server worker, including currently listed video and audio workflows, are not yet
          available and do not accept files for server processing. If server-side file processing is introduced, this
          policy will be updated before that feature is made available.
        </p>
        <p>We do not sell file contents, use them to train artificial intelligence models, or retain converted files as a library.</p>
      </ArticleSection>

      <ArticleSection id="information" index="03" title="Information we may process">
        <ul className="list-disc space-y-2 pl-5 marker:text-ink">
          <li>
            <strong className="text-ink">Technical and usage data:</strong> IP address, browser and device type, requested
            pages, timestamps, referring pages, and diagnostic or security events may appear in standard hosting and
            content-delivery logs.
          </li>
          <li>
            <strong className="text-ink">Administrative account data:</strong> authorized administrators may use an email
            address, authentication cookies, and multi-factor authentication data to secure the publishing system. Public
            conversion tools do not require an account.
          </li>
          <li>
            <strong className="text-ink">Donation data:</strong> donations are processed by PayPal. We may receive the
            transaction details PayPal makes available to recipients, such as the donor name, email address, amount,
            currency, date, and transaction reference. We do not receive full payment-card or bank-account credentials.
          </li>
        </ul>
      </ArticleSection>

      <ArticleSection id="cookies" index="04" title="Cookies, storage, and advertising">
        <p>
          Essential cookies may be used to protect restricted administrative areas and maintain authenticated sessions.
          Public file conversion does not require an account cookie.
        </p>
        <p>
          Where advertising is enabled, Google AdSense and its partners may use cookies, web beacons, device identifiers,
          and similar technologies to deliver, measure, and limit ads. Depending on your location, consent may be requested
          before non-essential advertising technologies are used. Learn more in Google&apos;s{" "}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink underline decoration-[#c9c1bc] underline-offset-4 hover:decoration-ink"
          >
            partner-site policy
          </a>
          .
        </p>
      </ArticleSection>

      <ArticleSection id="uses" index="05" title="How and why information is used">
        <p>We process limited information only as reasonably necessary to:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-ink">
          <li>operate, secure, troubleshoot, and improve the Service;</li>
          <li>prevent fraud, abuse, malware, and unauthorized access;</li>
          <li>measure content and advertising performance where permitted;</li>
          <li>administer donations and meet accounting, tax, or legal obligations; and</li>
          <li>comply with applicable law and enforce our Terms of Use.</li>
        </ul>
        <p>
          Where applicable law requires a legal basis, we rely on legitimate interests, performance of a contract, legal
          obligations, or consent. You may withdraw consent at any time without affecting earlier processing.
        </p>
      </ArticleSection>

      <ArticleSection id="providers" index="06" title="Service providers and disclosure">
        <p>
          Information may be handled by providers that support hosting, content delivery, database and authentication,
          security, advertising, and payments. These providers process data under their own terms or on our instructions,
          depending on the service. PayPal processes donations under the{" "}
          <a
            href="https://www.paypal.com/webapps/mpp/ua/privacy-full"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink underline decoration-[#c9c1bc] underline-offset-4 hover:decoration-ink"
          >
            PayPal Privacy Statement
          </a>
          .
        </p>
        <p>
          We may also disclose information when reasonably necessary to comply with law, protect users or the Service, or
          complete a reorganization, merger, sale, or transfer of the Service. We do not sell personal information for money.
        </p>
      </ArticleSection>

      <ArticleSection id="retention" index="07" title="Retention and international transfers">
        <p>
          On-device files are not retained by us. Technical logs are kept only as long as reasonably necessary for security,
          diagnostics, and provider operations. Donation and financial records may be retained for the period required by
          accounting, tax, fraud-prevention, and legal obligations.
        </p>
        <p>
          Providers may process information in countries other than your own. Where required, appropriate contractual or
          legal safeguards are used for international transfers.
        </p>
      </ArticleSection>

      <ArticleSection id="rights" index="08" title="Your privacy rights">
        <p>
          Depending on where you live, you may have rights to access, correct, delete, restrict, or object to processing of
          personal information, request portability, withdraw consent, or complain to a data-protection authority. These
          rights may be subject to legal exceptions and identity verification.
        </p>
        <p>
          To make a privacy request, use an official contact method published by {SITE_NAME}. Please do not send sensitive
          files with your request. You can also manage advertising choices through your browser and Google&apos;s ad settings.
        </p>
      </ArticleSection>

      <ArticleSection id="security" index="09" title="Security, children, and policy changes">
        <p>
          We use reasonable technical and organizational safeguards, but no internet service can guarantee absolute security.
          The Service is not directed to children under 13, and we do not knowingly collect personal information from them.
        </p>
        <p>
          We may update this policy as the Service, providers, or law changes. The effective date above identifies the latest
          revision. Material changes will be presented through an appropriate notice on the Service.
        </p>
      </ArticleSection>
    </Article>
  );
}
