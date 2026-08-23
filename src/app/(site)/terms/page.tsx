import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, LegalPage, Section } from "@/components/marketing/LegalPage";
import { legalEntity, product } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `Terms of Service — ${product.name}`,
  description: `The terms that govern use of ${product.name}.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These terms govern your use of ${product.name}, operated by ${legalEntity.name}. By creating a wheel, signing in, or entering a wheel, you agree to them.`}
    >
      <Section heading="Using the service">
        <p>
          {product.name} lets a business run prize-wheel promotions and collect entries. You are
          responsible for the content you upload, the prizes you offer, and for actually honouring
          the prizes participants win.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          Keep your password confidential — anyone holding it can see and change your wheel and your
          registrations. Tell us promptly if you believe it has been compromised. You are responsible
          for activity under your account.
        </p>
      </Section>

      <Section heading="Running a lawful promotion">
        <p>
          Prize promotions are regulated differently in different places. You are responsible for
          making sure yours is legal where you run it, including any registration, disclosure, odds
          or record-keeping requirements. You must not:
        </p>
        <Bullets
          items={[
            "Advertise a prize you do not intend to award.",
            "Misrepresent the odds of winning. The weights you set determine the draw, and you should describe them honestly.",
            "Collect personal information you have no lawful basis to collect, or use it for purposes you have not disclosed to participants.",
            "Use the service to send unsolicited messages in breach of applicable marketing law.",
            "Attempt to access another business's data, or interfere with the service.",
          ]}
        />
      </Section>

      <Section heading="Data you collect">
        <p>
          Entries you collect through {product.name} are yours, and you are the controller of that
          personal information. You must give participants a privacy notice that reflects what you
          actually do with it, and honour their rights over it. Our handling is described in the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Section>

      <Section heading="Availability">
        <p>
          We work to keep the service running but do not guarantee uninterrupted availability. We may
          change, suspend or discontinue features, and will give reasonable notice of material
          changes where we can.
        </p>
      </Section>

      <Section heading="Suspension">
        <p>
          We may suspend or terminate an account that breaches these terms, is used unlawfully, or
          puts the service or other users at risk.
        </p>
      </Section>

      <Section heading="Liability">
        <p>
          The service is provided &ldquo;as is&rdquo;. To the extent permitted by law,{" "}
          {legalEntity.name} is not liable for indirect or consequential loss, lost profits, or lost
          data arising from your use of the service. Nothing here limits liability that cannot be
          limited by law.
        </p>
      </Section>

      <Section heading="Governing law">
        <p>These terms are governed by the laws of {legalEntity.jurisdiction}.</p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about these terms:{" "}
          <a href={`mailto:${legalEntity.supportEmail}`}>{legalEntity.supportEmail}</a>
        </p>
      </Section>
    </LegalPage>
  );
}
