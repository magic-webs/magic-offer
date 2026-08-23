import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, LegalPage, Section } from "@/components/marketing/LegalPage";
import { legalEntity, product } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `Delete your data — ${product.name}`,
  description: `Request deletion of your ${product.name} account or of a registration you submitted to a prize wheel.`,
};

const SUBJECT_PARTICIPANT = encodeURIComponent("Data deletion request — wheel participant");
const SUBJECT_BUSINESS = encodeURIComponent("Account deletion request — business account");

export default function DeleteAccountPage() {
  return (
    <LegalPage
      title="Delete your data"
      intro={`You can ask us to delete your ${product.name} data at any time, and you don't need an account to do it. Pick whichever of the two below describes you.`}
    >
      <Section heading="If you entered a prize wheel">
        <p>
          You gave your details to a business running a wheel — we store them on that
          business&apos;s behalf. To have them erased, email{" "}
          <a href={`mailto:${legalEntity.privacyEmail}?subject=${SUBJECT_PARTICIPANT}`}>
            {legalEntity.privacyEmail}
          </a>{" "}
          from any address and include:
        </p>
        <Bullets
          items={[
            "The phone number you entered — this is how your registration is identified.",
            "The business or wheel you entered, if you remember it.",
          ]}
        />
        <p>
          We verify the request before acting on it, so that nobody can erase someone else&apos;s
          entry by guessing a phone number. We may need to forward it to the business that collected
          your details.
        </p>
        <p>
          <strong>What gets deleted:</strong> your registration record in full — name, phone number,
          any answers to custom fields, and the prize result attached to it.
        </p>
      </Section>

      <Section heading="If you run a business account">
        <p>
          Email{" "}
          <a href={`mailto:${legalEntity.privacyEmail}?subject=${SUBJECT_BUSINESS}`}>
            {legalEntity.privacyEmail}
          </a>{" "}
          from the address associated with your account, and include your company slug.
        </p>
        <p>
          <strong>What gets deleted:</strong> your company record, its password, every prize and
          form field, all uploaded images, all webhook endpoints and their signing secrets, and every
          registration collected through your wheel. Your public wheel link stops working
          immediately.
        </p>
        <p>
          <strong>Export first if you need it.</strong> Deletion cannot be undone, so download your
          registrations from the dashboard before you ask.
        </p>
      </Section>

      <Section heading="How long it takes">
        <p>
          We acknowledge requests within two business days and complete verified deletions within 30
          days. Data may persist in encrypted backups for up to a further 30 days before those
          backups age out, during which time it is not used for anything.
        </p>
        <p>
          We may keep a minimal record that a deletion request was made and honoured, since we need
          it to demonstrate compliance. That record does not include the deleted personal
          information.
        </p>
      </Section>

      <Section heading="Related">
        <p>
          See the <Link href="/privacy">Privacy Policy</Link> for the full picture of what we hold
          and why, or <Link href="/support">Support</Link> for anything else.
        </p>
      </Section>
    </LegalPage>
  );
}
