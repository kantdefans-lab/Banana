export const dynamic = 'force-dynamic';
import { setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return {
    title: 'Privacy Policy | AI Generator',
    description: 'Privacy Policy for AI Generator services.',
  };
}

export default async function PrivacyPolicyPage({
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
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Introduction</h2>
            <p>
              Genea China Holdings Limited and/or its affiliates (hereinafter referred to as "we," "us," or "AI Generator") fully recognize the importance of your personal information and value your trust. We are committed to protecting your personal information and privacy in accordance with relevant laws and regulations, including the <em>Personal Information Protection Law of HongKong SAR, China</em>, the <em>Cybersecurity Law of the People's Republic of China</em>, the <em>Data Security Law of the People's Republic of China</em>, and industry best practices. This Privacy Policy (hereinafter referred to as "this Policy") aims to clearly and transparently explain how we collect, use, store, share, and protect your personal information, as well as the rights you are entitled to.
            </p>
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="font-bold">Special Notice:</p>
              <p>Please read and fully understand the entire content of this Policy carefully before using AI Generator and its related services (collectively, "the Services"), paying particular attention to terms highlighted in bold or underlined. If you are a child under the age of 14, please read this Policy under the guidance of your parent or other guardian (collectively, "Guardian") and use our Services only after obtaining the Guardian's consent. By starting to use or continuing to use our Services, you acknowledge that you have understood and agreed to our processing of your personal information in accordance with this Policy.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. How We Collect and Use Personal Information</h2>
            <p className="mb-4">We collect and use your personal information only for the purposes described below in this Policy. If we need to use your information for purposes beyond those described, we will inform you again and obtain your consent.</p>
            
            <h3 className="text-lg font-medium mb-2">1.1 Core Service Functions</h3>
            <p className="mb-2">To provide you with basic intelligent dialogue and services, we need to process the following information:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Registration and Login:</strong> When you register for a AI Generator account, we collect the identification information you provide via your Apple ID. To complete identity verification, you need to bind a mobile phone number. We use a unified account system. Your account information (such as nickname and avatar) can be synchronized across associated products for login and service interoperability.</li>
              <li><strong>Intelligent Dialogue:</strong>
                <ul className="list-circle pl-6 mt-2 space-y-2">
                  <li>To enable the input of text, voice (including real-time calls), images, files, and other content, we need you to authorize microphone, camera, and photo library (storage) permissions as prompted. Refusing authorization will only affect the corresponding function.</li>
                  <li>To respond to your queries about "nearby locations" or "route planning," we need to collect your precise geographical location information (GPS, etc.). This is sensitive personal information. We collect this only when you actively initiate such requests, and you have the right to turn off this authorization in your device or app settings at any time, which will not affect other functions.</li>
                  <li>When using the "AI Portrait" function, the facial image materials you upload will be used solely on the cloud to generate your digital likeness and will be deleted upon your request after the function is completed. They will not be used for other purposes such as identification or verification.</li>
                  <li>When using the "Homework Help" function to view answers, and in accordance with regulatory requirements, we require you to provide your real name and ID card number for real-name verification. This information will be provided to public security authorities for verification as required by law.</li>
                  <li><strong>Please Note:</strong> If the information you submit contains others' personal information (e.g., in a voice memo), please ensure you have obtained their explicit authorization.</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-medium mb-2">1.2 Additional Service Functions (You Can Choose to Enable or Disable)</h3>
            <p className="mb-2">To enhance your experience, we offer the following optional functions, which you can manage in the settings at any time:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Personalized Content Recommendations:</strong> When enabled, we will recommend more relevant prompts or chatbots based on your inputs, browsing behavior, etc. You can turn this on or off via 【Me】-【Settings】-【Account Settings】-【Personalized Content Recommendations】. After turning it off, you will see general content.</li>
              <li><strong>Long-term Memory:</strong> When enabled, AI Generator can provide more contextually relevant responses in subsequent conversations based on an analysis of your historical dialogue. You can manage this via 【Settings】-【Memory】.</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">1.3 Service Improvement and Security Assurance</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Model Training and Optimization:</strong> To continuously improve the performance of AI models and service quality, after de-identification processing (ensuring the data cannot be re-identified back to you), we may use your anonymized dialogue data for model training. You can turn off this authorization at any time via 【Me】-【Settings】-【Account Settings】-【Allow Data for Model Training】. After turning it off, your data will no longer be used for this purpose.</li>
              <li><strong>Operations and Security:</strong> To ensure the secure and stable operation of our services and to prevent and address fraud and illegal activities, we automatically collect necessary device information and log information (such as device model, operating system version, IP address, app crash logs).</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">1.4 Exceptions to Obtaining Authorization and Consent</h3>
            <p>In accordance with relevant laws and regulations, we may collect and use your personal information without your prior authorization and consent in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>To fulfill statutory duties or legal obligations;</li>
              <li>To respond to public health emergencies or, in emergency situations, to protect the life, health, and property safety of you or others;</li>
              <li>To carry out news reporting or public opinion supervision for the public interest, within a reasonable scope;</li>
              <li>Other circumstances stipulated by laws and regulations.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. How We Use Cookies and Similar Technologies</h2>
            <p className="mb-2">Cookies are small data files placed on your device. We use Cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Ensure service security and facilitate your convenient login.</li>
              <li>Record some of your preference settings to improve access efficiency.</li>
              <li>
                Measure and improve our website using analytics tools such as <strong>Google Analytics (GA4)</strong> and{' '}
                <strong>Microsoft Clarity</strong>.
              </li>
            </ul>
            <p className="mb-2">
              You can choose whether to allow analytics cookies via the <strong>Cookie settings</strong> link in the footer. You can also clear or block
              cookies through your browser settings. Please note that disabling cookies may affect the experience of some services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How We Share, Transfer, and Disclose Personal Information</h2>
            <h3 className="text-lg font-medium mb-2">3.1 Information Sharing</h3>
            <p className="mb-2">We are committed to maintaining strict confidentiality of your information and will not share your personal information with any company, organization, or individual, except in the following cases:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>To Implement Specific Functions:</strong> When third-party service providers (e.g., map service providers, payment institutions) are embedded within our services to provide specific functions, we will share the minimum necessary information within the scope of your authorization solely to achieve that function.</li>
              <li><strong>Based on Legal Requirements:</strong> We may disclose your information when required by laws and regulations, litigation, or mandatory requirements from judicial or administrative authorities.</li>
              <li><strong>In the Event of a Merger, Acquisition, etc.,</strong> if personal information transfer is involved, we will require the new entity holding your personal information to continue to be bound by this Policy.</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">3.2 Public Disclosure</h3>
            <p>We will not publicly disclose your personal information in principle, except:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>With your separate consent;</li>
              <li>Based on requirements of laws, regulations, legal procedures, or to safeguard public interests.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. How We Store and Protect Personal Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Storage Location:</strong> Personal information collected and generated during our operations within the territory of the People's Republic of China will be stored domestically.</li>
              <li><strong>Retention Period:</strong> We retain your personal information only for the period necessary to provide you with the Services. After this period, we will delete or anonymize the information, unless otherwise stipulated by laws and regulations.</li>
              <li><strong>Security Measures:</strong> We employ technical measures (such as encryption, anonymization) and administrative measures (such as access control, security audits) that comply with industry standards to protect your information. Please note, however, that no security measures are completely infallible.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Your Rights Regarding Personal Information</h2>
            <p className="mb-2">We respect and safeguard your right to exercise the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access, Correct, and Delete Personal Information:</strong> You can access and modify your profile within the app and manage your chat history (including bulk deletion).</li>
              <li><strong>Withdraw Authorization:</strong> You can withdraw previously granted authorizations at any time through device permission settings or privacy settings within the app (e.g., personalized recommendations, model training authorization). Withdrawal does not affect processing previously conducted based on your authorization.</li>
              <li><strong>Delete Account:</strong> You can apply to delete your account in 【Me】-【Settings】-【Account Settings】-【Delete Account】. After account deletion, we will delete or anonymize your personal information in accordance with the law, except where retention is required by laws and regulations.</li>
              <li><strong>Responding to Your Requests:</strong> To ensure security, we may need to verify your identity when you exercise these rights. We will respond to your legitimate requests within 15 working days.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. How We Handle Minors' Personal Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We attach great importance to the protection of minors' personal information. If you are a child under the age of 14, please use our Services with the consent and guidance of your Guardian.</li>
              <li>If we discover that we have collected a child's personal information without verifiable parental consent, we will take steps to delete such information as soon as possible.</li>
              <li>If you are a Guardian and have any questions regarding the child's information under your guardianship, please contact us using the method provided in Section 8.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. How This Policy is Updated</h2>
            <p>This Policy may be revised from time to time. After an update, we will publish the new version within the app, on our website, or through other appropriate means, indicating the effective date. If the changes materially affect your significant rights and interests (e.g., major changes in the purpose or method of collecting and using sensitive personal information), we will obtain your consent separately through prominent means (such as push notifications).</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. How to Contact Us</h2>
            <p className="mb-2">If you have any questions, comments, complaints, or need to exercise your rights regarding this Policy or the processing of your personal information, please contact us via:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Operating Entity:</strong> Genea China Holdings Limited</li>
              <li><strong>Contact Email:</strong> tony@pregorange.com</li>
            </ul>
            <p className="mt-2">We will respond within 15 working days after receiving and verifying your identity.</p>
          </section>
        </article>
      </main>
    </div>
  );
}
