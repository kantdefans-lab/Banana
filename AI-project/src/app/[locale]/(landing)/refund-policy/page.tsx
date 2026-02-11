export const dynamic = 'force-dynamic';
import { setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return {
    title: 'Refund Policy | AI Generator',
    description: 'Refund policy for virtual products and subscriptions.',
  };
}

export default async function RefundPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-12 md:py-16">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>

          <section className="mb-8">
            <p className="mb-4">Thank you for choosing our short drama platform. Please read our refund policy carefully before making any purchases. By purchasing our virtual products, you agree to the terms outlined below.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. General Policy</h2>
            <p>All virtual products, including but not limited to coins, subscriptions, and memberships, are non-refundable once the purchase is completed. Due to the digital nature of these products, we do not offer refunds or exchanges unless explicitly stated otherwise in this policy.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Eligible for Refund</h2>
            <p className="mb-2">Refunds may be issued under the following circumstances:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Failure to Deliver:</strong> If you purchase coins or a subscription, and the coins or membership status are not delivered to your account within a reasonable time frame (e.g. 24 hours), you may request a refund. Please contact our customer support team with proof of purchase (e.g., transaction ID) to resolve the issue.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Non-Refundable Situations</h2>
            <p className="mb-2">Refunds will not be granted in the following cases:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Subscription Renewal:</strong> If you have agreed to a subscription service and forgot to cancel it before the renewal date, resulting in an automatic charge, no refund will be provided. It is your responsibility to manage your subscription settings and cancel before the renewal date if you no longer wish to continue the service.</li>
              <li><strong>Change of Mind:</strong> We do not offer refunds for change of mind, accidental purchases, or dissatisfaction with the content or service.</li>
              <li><strong>Usage of Coins or Membership:</strong> Once coins or membership benefits have been used or partially used, no refund will be issued.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. How to Request a Refund</h2>
            <p>If you believe you are eligible for a refund under the conditions outlined above, please contact our customer support team at <strong>tony@pregorange.com</strong> within 7 days of the purchase date. Provide your transaction details, account information, and a clear explanation of the issue. We will review your request and respond within 5 business days.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Discretionary Refunds</h2>
            <p>In exceptional cases, we may issue a refund at our sole discretion. This is not guaranteed and will be evaluated on a case-by-case basis.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Changes to This Policy</h2>
            <p className="mb-4">We reserve the right to modify this refund policy at any time. Any changes will be effective immediately upon posting on our website. It is your responsibility to review this policy periodically to stay informed of updates.</p>
            <p>By purchasing our virtual products, you acknowledge that you have read, understood, and agreed to this refund policy. If you have any questions, please contact us before making a purchase.</p>
            <p className="mt-4 font-semibold">Thank you for your understanding and support!</p>
          </section>
        </article>
      </main>
    </div>
  );
}