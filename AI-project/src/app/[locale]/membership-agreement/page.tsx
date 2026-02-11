export const dynamic = 'force-dynamic';
import { setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return {
    title: 'Membership Service Agreement | AI Generator',
    description: 'Terms and conditions for AI Generator Membership Services.',
  };
}

export default async function MembershipAgreementPage({
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
          <h1 className="text-3xl font-bold mb-8">Membership Service Agreement</h1>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Important Notice</h2>
            <p className="mb-2">1.1 Welcome to the AI Generator Membership Service (hereinafter referred to as the "Service"). This Agreement is entered into between you (hereinafter referred to as the "Member") and Genea China Holdings Limited and/or its affiliates (hereinafter referred to as "we," "us," or "AI Generator") and is legally binding on both parties.</p>
            <p className="mb-2">1.2 Please read and fully understand the entire content of this Agreement carefully before purchasing or using the Service, paying particular attention to terms highlighted in bold or underlined, including but not limited to service term, refund policy, fee adjustments, limitation of liability, and other important provisions.</p>
            <p className="mb-2">1.3 Your act of clicking "Agree," initiating the purchase process, or using the Membership Service indicates that you have read, understood, and agreed to be bound by all terms of this Agreement. This Agreement is a supplement to the <em>AI Generator User Agreement</em> and the <em>AI Generator Privacy Policy</em>, forming an integral whole with them.</p>
            <p>1.4 If you are under the age of 18, please read this Agreement under the guidance of your legal guardian and use the Service only after obtaining their consent.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Membership Service Content</h2>
            <p className="mb-2">2.1 <strong>Service Overview:</strong> The Service is a paid value-added subscription. Upon becoming a member, you may enjoy specific membership benefits during the validity period. The specific benefits are subject to the details displayed on the Membership Benefits Page at the time of purchase.</p>
            <p className="mb-2">2.2 <strong>Examples of Core Benefits (Subject to Change):</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>AI Video Generation: Image-to-video, story video generation, etc.</li>
              <li>AI Music Generation: Custom song creation, inspiration composition, etc.</li>
              <li>AI Talking Head Video Generation.</li>
              <li><strong>U Coin Grants & Usage:</strong> Some membership plans periodically grant virtual currency "U Coins," which can be used to redeem specific AI generation functions at a discounted rate. Please pay special attention: Granted U Coins are only valid during the membership period. Unused U Coins will expire at the end of the period. The grant amount, consumption rules, and validity period of U Coins are subject to the real-time announcements on the benefits page.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Account and Usage Rules</h2>
            <p className="mb-2">3.1 <strong>Account Requirement:</strong> You must have a genuine and valid AI Generator user account to purchase a membership. The account is for your personal use only. Gifting, lending, leasing, transferring, selling, or permitting any third party to use your membership benefits in any form is prohibited.</p>
            <p className="mb-2">3.2 <strong>Legitimate Acquisition:</strong> Please purchase memberships through official AI Generator channels. Any membership obtained through unauthorized third-party channels (including those obtained via illegal cracking or exploiting system vulnerabilities) is invalid. We reserve the right to cancel such memberships without notice and assume no liability.</p>
            <p>3.3 <strong>Your Responsibility:</strong> You are responsible for safeguarding your account and password and for all activities under your account. Losses resulting from your failure to keep them secure shall be borne by you.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Service Term, Fees, and Adjustments</h2>
            <p className="mb-2">4.1 <strong>Service Term:</strong> Calculated from the date your payment is successful and your membership is activated. The specific term is based on the plan you selected at the time of purchase.</p>
            <p className="mb-2">4.2 <strong>Service Adjustments:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Benefit Adjustments:</strong> We reserve the right to adjust membership benefits, U Coin rules, etc., based on business development and changes in laws and regulations. If a significant adjustment likely to adversely affect you is made during your membership period, we will notify you through prominent means such as in-app announcements or site messages.</li>
              <li><strong>Price Adjustments:</strong> We reserve the right to adjust prices for new membership plans in the future, but such adjustments will not affect the fee for the current plan you have already purchased during its term.</li>
            </ul>
            <p className="mb-2">4.3 <strong>Fees and Payment:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>The Membership Service is a prepaid subscription service. Once payment is made, refunds are generally not supported unless otherwise required by law. Please choose your service term carefully.</li>
              <li>You understand and agree that the payment process is handled by third-party payment service providers. Related payment risks are borne by you and the payment service provider.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Intellectual Property and Usage Restrictions</h2>
            <p className="mb-2">5.1 <strong>Intellectual Property:</strong> The intellectual property rights of the AI Generator Service itself and the technology and content it provides (unless otherwise stated) belong to us. The membership grants you only a personal, non-commercial, non-transferable right to use.</p>
            <p>5.2 <strong>Usage Restrictions:</strong> You shall not use the Membership Service for any commercial or profit-making purposes (e.g., resale, commercial batch content generation, etc.), nor shall you engage in any activity that compromises service security, technical measures, or infringes upon our intellectual property rights.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Suspension, Termination, and Refunds</h2>
            <p className="mb-2">6.1 <strong>Our Right to Terminate:</strong> If you materially breach this Agreement (e.g., engaging in illegal activities, service abuse, unauthorized account transfer, etc.), we have the right to terminate your membership immediately without notice, and no refund will be issued for any fees paid.</p>
            <p className="mb-2">6.2 <strong>Force Majeure:</strong> If the Service cannot continue due to force majeure (e.g., natural disasters, government actions, major technical failures), we may terminate the Service and refund the corresponding portion of the fee based on the remaining service period.</p>
            <p>6.3 <strong>Your Rights:</strong> You may stop auto-renewal or apply to delete your account at any time in the app settings. Account deletion procedures are outlined in the <em>User Agreement</em>. Voluntarily deleting your account does not constitute grounds for a refund.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Disclaimer and Limitation of Liability</h2>
            <p className="mb-2">7.1 <strong>Service "As Is":</strong> We strive to ensure service continuity and stability but do not warrant that the Service will be uninterrupted, absolutely secure, or error-free. We are not liable for service interruptions caused by networks, devices, third parties, or routine maintenance.</p>
            <p>7.2 <strong>Liability Cap:</strong> In no event shall our aggregate liability to you under this Agreement exceed the total amount of fees you have directly paid to us for the Membership Service giving rise to the claim.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Personal Information Protection</h2>
            <p>We highly value the protection of your personal information. The privacy practices involved in the Membership Service are governed by the <em>AI Generator Privacy Policy</em>. We may send you service-related notices and promotional information in accordance with that policy.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Miscellaneous</h2>
            <p className="mb-2">9.1 <strong>Agreement Modification:</strong> We reserve the right to modify this Agreement. The modified content will be published by posting a notice on the service page or sending a notification to you. If you disagree with the modifications, you have the right to stop using the Service before the effective date and apply for a refund (calculated based on the remaining period). Your continued use constitutes acceptance of the modifications.</p>
            <p className="mb-2">9.2 <strong>Governing Law and Dispute Resolution:</strong> This Agreement is governed by the laws of HongKong SAR, China for litigation. Any dispute arising from this Agreement shall be resolved through friendly negotiation. If negotiation fails, either party may submit the dispute to the competent people's court in the place of signing of this Agreement—HongKong SAR, China for litigation.</p>
            <p>9.3 <strong>Contact and Feedback:</strong> If you have any questions or complaints, please contact us via the in-app online customer service or by email at tony@pregorange.com.</p>
          </section>
        </article>
      </main>
    </div>
  );
}