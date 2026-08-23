import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, LegalPage, Section } from "@/components/marketing/LegalPage";
import { legalEntity, product } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `Privacy Policy — ${product.name}`,
  description: `How ${legalEntity.name} collects, uses and protects personal information in ${product.name}.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what ${legalEntity.name} collects when you use ${product.name}, why we collect it, and the choices you have. It covers both the ${product.name} web dashboard and the companion mobile app.`}
    >
      <Section heading="Who we are">
        <p>
          {product.name} is operated by <strong>{legalEntity.name}</strong>, {legalEntity.address}.
          For anything in this policy, contact us at{" "}
          <a href={`mailto:${legalEntity.privacyEmail}`}>{legalEntity.privacyEmail}</a>.
        </p>
        <p>
          There are two kinds of people in this product, and we handle their data differently:{" "}
          <strong>business users</strong>, who sign in to run a prize wheel, and{" "}
          <strong>participants</strong>, who enter a wheel run by one of those businesses. Where a
          business runs a wheel, that business is the data controller for its participants and we
          act as a processor on its behalf.
        </p>
      </Section>

      <Section heading="What we collect from participants">
        <p>Only what the business running the wheel asks for on its entry form:</p>
        <Bullets
          items={[
            <>
              <strong>Name</strong> — if the business has enabled the name field.
            </>,
            <>
              <strong>Phone number</strong> — if enabled. It is also used to make sure one person
              gets one spin per wheel.
            </>,
            <>
              <strong>Custom fields</strong> — any extra questions the business has added, such as
              an email address or a city.
            </>,
            <>
              <strong>Spin result</strong> — which prize was drawn and when.
            </>,
          ]}
        />
        <p>
          We do <strong>not</strong> ask participants for payment details, government identifiers,
          precise location, contacts, photos, or any other data from their device.
        </p>
      </Section>

      <Section heading="What we collect from business users">
        <Bullets
          items={[
            <>
              <strong>Account details</strong> — your company name, the slug used in your wheel&apos;s
              public address, and a password, which is stored only as a salted hash and never in a
              form we can read.
            </>,
            <>
              <strong>Content you upload</strong> — wheel, background, pointer and prize images.
            </>,
            <>
              <strong>Configuration</strong> — prizes, odds, form fields and any webhook endpoints
              you set up.
            </>,
          ]}
        />
      </Section>

      <Section heading="How we use it">
        <Bullets
          items={[
            "Running the wheel: showing the right prizes, drawing a result, and enforcing one spin per person.",
            "Letting the business see and export its own registrations.",
            "Sending events to webhook endpoints that a business has configured, so its own systems can act on a registration or a win.",
            "Keeping the service secure and diagnosing faults.",
          ]}
        />
        <p>
          We do not sell personal information, and we do not use participant data to advertise to
          anyone or to build profiles across businesses.
        </p>
      </Section>

      <Section heading="Who we share it with">
        <p>
          Participant data is visible to the business whose wheel was entered, and to no other
          business on the platform. Beyond that, information is shared only with:
        </p>
        <Bullets
          items={[
            "Our hosting and database providers, who store the data on our behalf under contract.",
            <>
              Any endpoint a business configures under <strong>Webhooks</strong>. Once an event is
              delivered to a business&apos;s own systems, that business&apos;s privacy policy governs
              what happens to it.
            </>,
            "Authorities, where we are legally required to disclose.",
          ]}
        />
      </Section>

      <Section heading="How long we keep it">
        <p>
          Registrations are kept for as long as the business keeps its wheel active, so it can honour
          prizes and avoid duplicate entries. When a business closes its account, or when a deletion
          request is made, the associated data is removed as described below.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export or delete
          the personal information we hold about you, and to object to or restrict how it is used.
        </p>
        <p>
          To exercise any of these, see <Link href="/delete-account">Delete your data</Link> or write
          to <a href={`mailto:${legalEntity.privacyEmail}`}>{legalEntity.privacyEmail}</a>. If you
          entered a wheel run by a business, we may need to pass your request to that business, since
          the data is theirs.
        </p>
      </Section>

      <Section heading="Security">
        <p>
          Traffic is encrypted in transit. Passwords are stored as scrypt hashes with a per-account
          salt. Webhook deliveries are signed with a per-endpoint secret so a receiver can verify
          that a request genuinely came from us. Participant records are never readable by the
          browser directly — every read and write goes through an authenticated server route.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          {product.name} is not directed at children, and we do not knowingly collect information
          from anyone under 13. If you believe a child has entered a wheel, contact us and we will
          remove the record.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          If we change this policy we will update the date at the top of this page. Significant
          changes will be communicated to business users through the dashboard.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          {legalEntity.name}
          <br />
          {legalEntity.address}
          <br />
          <a href={`mailto:${legalEntity.privacyEmail}`}>{legalEntity.privacyEmail}</a>
          <br />
          <a href={`tel:${legalEntity.phone}`}>{legalEntity.phoneDisplay}</a>
        </p>
      </Section>
    </LegalPage>
  );
}
