export const dynamic = 'force-dynamic';
import { setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return {
    title: 'Auto-Renewal Service Agreement | AI Generator',
    description: 'Rules for the auto-renewal function of AI Generator paid subscription services.',
  };
}

export default async function AutoRenewalPage({
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
          <h1 className="text-3xl font-bold mb-8">Auto-Renewal Service Agreement</h1>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Important Notice</h2>
            <p className="mb-2">1.1 This <em>Auto-Renewal Service Agreement</em> (hereinafter referred to as "this Agreement") explains the rules for the auto-renewal function of AI Generator's paid subscription services. Before enabling auto-renewal, please read and fully understand the entire content of this Agreement carefully, paying particular attention to the bolded terms regarding renewal charges, cancellation methods, and refund policies.</p>
            <p className="mb-2">1.2 By choosing to enable or use the auto-renewal function, you indicate that you have read, understood, and agreed to be bound by all terms of this Agreement, the <em>AI Generator User Agreement</em>, and the <em>AI Generator Membership Service Agreement</em>.</p>
            <p>1.3 If you are under the age of 18, please read this Agreement under the guidance of your legal guardian and use this function only after obtaining their consent.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Service Description</h2>
            <p className="mb-2">2.1 <strong>Purpose:</strong> The auto-renewal function is a convenient service designed to prevent interruption of your membership or other services due to forgetting to renew manually. Once enabled, the system will automatically initiate a charge for the next billing cycle at the original plan price before the end of your current subscription period.</p>
            <p className="mb-2">2.2 <strong>Authorization for Charges:</strong> You understand and agree that enabling this function authorizes us to charge your linked payment method (e.g., Apple App Store, Alipay, WeChat Pay) at the agreed-upon time.</p>
            <p className="mb-2">2.3 <strong>Charge Timing & Channel Differences:</strong> The specific charge time may vary slightly depending on the settlement rules of different payment channels, typically completed within 24 hours before the current subscription period ends. Please ensure your payment account is in good standing and has sufficient funds.</p>
            <p>2.4 <strong>Failed Charges:</strong> If a charge fails due to insufficient funds, an invalid payment method, or other reasons, your paid benefits may be interrupted after the current period ends. The system may retry the charge within a short period, subject to the rules of the payment channel. Please monitor your account status promptly.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How to Manage Auto-Renewal (Your Rights)</h2>
            <p className="mb-2">3.1 <strong>Turning Off Auto-Renewal:</strong> You have the right to turn off the auto-renewal function at any time. After turning it off, your current active subscription will continue until its natural expiration and will not auto-renew.</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>How to Turn Off (Example):</strong> 【Me】 -&gt; 【Settings/Account Management】 -&gt; 【Subscriptions/Auto-Renewal】 -&gt; 【Turn Off Auto-Renewal】.</li>
              <li><strong>Timing:</strong> To avoid unintended charges, it is recommended that you complete the turn-off operation at least 24 hours before your current subscription period ends.</li>
            </ul>
            <p>3.2 <strong>Price Changes:</strong> If subscription prices increase in the future, we will notify you via prominent means such as in-app messages or email before the renewal charge. You have the right to turn off auto-renewal before the price increase takes effect.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Service Suspension and Termination</h2>
            <p className="mb-2">4.1 <strong>Your Right to Terminate:</strong> You may turn off this function at any time by following the instructions in Section 3.1.</p>
            <p className="mb-2">4.2 <strong>Our Right to Suspend/Terminate:</strong> We reserve the right to suspend or terminate this function for you if you violate relevant agreements or laws, or if we reasonably determine a significant risk exists (e.g., fraud).</p>
            <p>4.3 <strong>Service Changes:</strong> We may suspend or modify this function due to business adjustments and will provide advance notice through official channels.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Refund Policy</h2>
            <p>Please note that fees successfully charged through auto-renewal are subject to the refund terms of the <em>AI Generator Membership Service Agreement</em>. In principle, fees for a successfully charged period are non-refundable. Therefore, it is essential to manage your auto-renewal settings promptly.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Disclaimer</h2>
            <p className="mb-2">6.1 We strive to ensure the accurate transmission of charge requests but are not liable for delays, failures, or errors in charges caused by payment channels, networks, banking systems, or issues with your device.</p>
            <p>6.2 You are responsible for any renewal charges and potential losses resulting from your failure to turn off auto-renewal in time or issues with your payment account.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Miscellaneous</h2>
            <p className="mb-2">7.1 <strong>Agreement Modifications:</strong> We may revise this Agreement and will announce changes via platform notices. If you disagree with the modifications, you have the right to turn off this function. Continued use constitutes acceptance.</p>
            <p className="mb-2">7.2 <strong>Governing Law and Dispute Resolution:</strong> This Agreement is governed by the laws of HongKong SAR, China. Disputes arising from this Agreement shall be resolved through friendly negotiation. If negotiation fails, either party may submit the dispute to the competent people's court in the place of signing of this Agreement—HongKong SAR, China for litigation.</p>
            <p>7.3 <strong>Contact Customer Service:</strong> For questions, please contact us via in-app online customer service or email at tony@pregorange.com.</p>
          </section>
        </article>
      </main>
    </div>
  );
}