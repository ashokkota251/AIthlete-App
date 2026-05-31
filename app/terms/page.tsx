import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, type LegalSection } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service · AIthlete",
  description: "The terms that govern your use of AIthlete.",
};

const SECTIONS: LegalSection[] = [
  {
    title: "What AIthlete is",
    body: (
      <p>
        AIthlete is a personal training-intelligence companion for athletes who
        record their workouts on Strava. We read your activities through
        Strava&apos;s official OAuth API, compute training metrics on the fly,
        and use an AI model to translate those numbers into human-readable
        debriefs, weekly analysis, and coaching suggestions. AIthlete does not
        replace a coach, a doctor, or your own judgement — it is informational
        software designed to help you read your own training more clearly.
      </p>
    ),
  },
  {
    title: "Our mission",
    body: (
      <>
        <p>
          AIthlete exists to help athletes train smarter, avoid the injuries
          that come from over-reaching, and stay on track with the goals they
          set for themselves — whether that is a first 5K, a sub-3 marathon, a
          century ride, or simply a healthier next twelve months.
        </p>
        <p className="mt-3">
          The product reads the training load you are already accumulating in
          Strava and flags the patterns coaches look for: spike weeks,
          aerobic deficit, missed recovery, tempo traps, decoupling under
          fatigue. The goal is not to push you harder. The goal is to push
          you <em className="not-italic font-semibold text-ink-900">at the right time</em>{" "}
          and back off at the right time, so your fitness compounds instead of
          breaking down.
        </p>
      </>
    ),
  },
  {
    title: "Pricing — it is free",
    body: (
      <>
        <p>
          <strong className="font-semibold text-ink-900">
            AIthlete is free.
          </strong>{" "}
          No price, no trial that turns into a charge, no &ldquo;Pro&rdquo;
          tier hidden behind the best features, no surprise paywall on the
          weekly analysis. The full app — dashboard, debriefs, weekly
          analysis, coach chat, recovery suggestions — is available to every
          athlete who signs in with Strava.
        </p>
        <p className="mt-3">
          We do not run advertising, we do not sell your data, and we will not
          quietly &ldquo;monetise&rdquo; the product later by changing this
          promise. If we ever need to introduce paid features in the future to
          cover infrastructure costs, the existing functionality you sign in
          with today will remain free. We will give you clear advance notice
          on this page if anything changes.
        </p>
      </>
    ),
  },
  {
    title: "Your Strava data",
    body: (
      <p>
        When you sign in with Strava, we receive an access token scoped to
        read-only profile and activity data. We use that token only while you
        are actively using the app. We do not write to your Strava account, do
        not post on your behalf, and do not modify any of your activities. You
        can revoke our access at any time from{" "}
        <a
          href="https://www.strava.com/settings/apps"
          target="_blank"
          rel="noreferrer noopener"
          className="text-coral underline decoration-dotted underline-offset-2"
        >
          strava.com/settings/apps
        </a>
        .
      </p>
    ),
  },
  {
    title: "AI-generated content",
    body: (
      <>
        <p>
          The narrative parts of the app — debriefs, weekly analysis, and the
          coach chat — are produced by an AI model (Anthropic Claude). AI output
          is generated from deterministic metrics we compute from your Strava
          activities; the AI does not invent numbers. Even so, AI-generated text
          can be wrong, incomplete, or out-of-date.
        </p>
        <p className="mt-3">
          Nothing in AIthlete constitutes medical advice, coaching advice, or a
          training prescription. If a workout feels harmful or you suspect
          injury, stop and consult a qualified professional.
        </p>
      </>
    ),
  },
  {
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul className="mt-3 space-y-2 list-none pl-0">
          <li className="flex gap-3">
            <span className="text-coral select-none">·</span>
            <span>Use the app to harass, harm, or impersonate other athletes.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral select-none">·</span>
            <span>
              Attempt to bypass authentication, scrape data belonging to other
              athletes, or reverse-engineer our prompts or pipelines.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral select-none">·</span>
            <span>
              Use AIthlete in a way that violates Strava&apos;s{" "}
              <a
                href="https://www.strava.com/legal/api"
                target="_blank"
                rel="noreferrer noopener"
                className="text-coral underline decoration-dotted underline-offset-2"
              >
                API agreement
              </a>{" "}
              or Anthropic&apos;s usage policies.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Service availability",
    body: (
      <p>
        AIthlete is provided on an &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; basis. We may take the service offline for maintenance,
        rate-limit usage, or change features at any time. Free-tier limits on
        Strava&apos;s API may temporarily prevent the app from loading your
        latest activities; this is outside our control.
      </p>
    ),
  },
  {
    title: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, AIthlete and its operators are
        not liable for any indirect, incidental, or consequential damages
        arising from your use of the service, including but not limited to
        injury, lost training time, or misinterpretation of AI-generated
        guidance. Your training decisions remain your own.
      </p>
    ),
  },
  {
    title: "Ending your use",
    body: (
      <p>
        You can stop using AIthlete at any time by signing out and revoking
        Strava access. Because we keep no server-side database of your data,
        revoking access effectively ends our ability to read anything about
        you. We reserve the right to suspend accounts that violate these terms
        or place undue load on our infrastructure.
      </p>
    ),
  },
  {
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms when the product changes. If we make a
        material change, we will surface the updated effective date at the top
        of this page. Continued use of the app after that date means you accept
        the revised terms.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <p>
        Questions about these terms? Drop a line via the{" "}
        <Link
          href="/contact"
          className="text-coral underline decoration-dotted underline-offset-2"
        >
          contact page
        </Link>{" "}
        or email{" "}
        <a
          href="mailto:ashok.kota251@gmail.com"
          className="text-coral underline decoration-dotted underline-offset-2"
        >
          ashok.kota251@gmail.com
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="The fineprint"
      title="Terms"
      effectiveDate="May 31, 2026"
      lede="The rules of the road for using AIthlete. Short, specific, and written in plain English."
      sections={SECTIONS}
      footer={
        <p>
          AIthlete is independent software that uses the Strava API. Strava and
          the Strava logo are trademarks of Strava, Inc. By using AIthlete you
          also agree to{" "}
          <a
            href="https://www.strava.com/legal/terms"
            target="_blank"
            rel="noreferrer noopener"
            className="text-coral underline decoration-dotted underline-offset-2"
          >
            Strava&apos;s Terms of Service
          </a>
          . See our{" "}
          <Link
            href="/privacy"
            className="text-coral underline decoration-dotted underline-offset-2"
          >
            Privacy Policy
          </Link>{" "}
          for how your data is handled.
        </p>
      }
    />
  );
}
