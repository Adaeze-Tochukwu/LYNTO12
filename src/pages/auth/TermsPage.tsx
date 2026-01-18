import { Link } from 'react-router-dom'
import { MobileLayout } from '@/components/layout'
import { Card } from '@/components/ui'
import { ArrowLeft, Heart } from 'lucide-react'

export function TermsPage() {
  return (
    <MobileLayout className="py-6">
      <div className="animate-fade-in">
        {/* Back link */}
        <Link
          to="/register"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to registration</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Terms and Conditions
            </h1>
            <p className="text-sm text-slate-500">Last updated: January 2026</p>
          </div>
        </div>

        <Card padding="lg" className="prose prose-slate prose-sm max-w-none">
          <p className="text-slate-600 mb-6">
            Please read these Terms and Conditions carefully before using Lynto.
          </p>

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using Lynto ("the Service"), you acknowledge that
              you have read, understood, and agree to be bound by these Terms
              and Conditions. If you do not agree to these terms, you must not
              access or use the Service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Lynto is a healthcare observation and alert management platform
              designed to assist care agencies in monitoring client wellbeing.
              The Service enables:
            </p>
            <ul>
              <li>
                Carers to record visit observations including symptoms, vital
                signs, and notes
              </li>
              <li>
                Managers to review health-related alerts and coordinate care
                responses
              </li>
              <li>
                Agencies to maintain records of client visits and health status
                changes
              </li>
            </ul>
          </Section>

          <Section title="3. Eligibility">
            <p>
              The Service is intended for use by registered care agencies and
              their authorised personnel. By using the Service, you represent
              that:
            </p>
            <ul>
              <li>You are at least 18 years of age</li>
              <li>
                You are authorised to act on behalf of the registered agency
              </li>
              <li>
                You have the necessary qualifications and permissions to provide
                care services
              </li>
              <li>
                You will comply with all applicable healthcare regulations in
                your jurisdiction
              </li>
            </ul>
          </Section>

          <Section title="4. User Accounts">
            <h4 className="font-semibold text-slate-700 mt-4 mb-2">
              4.1 Registration
            </h4>
            <ul>
              <li>
                Agencies must register using a valid company email address
              </li>
              <li>
                You must provide accurate, current, and complete registration
                information
              </li>
              <li>
                You are responsible for maintaining the confidentiality of your
                account credentials
              </li>
              <li>
                You must notify us immediately of any unauthorised access to
                your account
              </li>
            </ul>

            <h4 className="font-semibold text-slate-700 mt-4 mb-2">
              4.2 Account Security
            </h4>
            <ul>
              <li>
                You are responsible for all activities that occur under your
                account
              </li>
              <li>
                You must not share account credentials with unauthorised
                individuals
              </li>
              <li>
                You must use the Service only on secure, authorised devices
              </li>
              <li>
                You must log out of your account when using shared devices
              </li>
            </ul>
          </Section>

          <Section title="5. Important Medical Disclaimer">
            <div className="bg-risk-red-light border border-risk-red/20 rounded-xl p-4 my-4">
              <p className="font-semibold text-risk-red mb-2">
                LYNTO DOES NOT PROVIDE MEDICAL ADVICE OF ANY KIND.
              </p>
              <p className="text-slate-700 text-sm">
                The Service is a documentation and alerting tool only. It does
                NOT diagnose medical conditions, recommend treatments, replace
                professional medical judgment, or substitute for emergency
                medical services.
              </p>
            </div>

            <h4 className="font-semibold text-slate-700 mt-4 mb-2">
              5.1 Risk Assessment Limitations
            </h4>
            <p>
              The symptom scoring and risk classification features (green,
              amber, red) are decision-support tools designed to flag potential
              concerns. They:
            </p>
            <ul>
              <li>Are NOT validated diagnostic instruments</li>
              <li>
                Should NOT be relied upon as the sole basis for clinical
                decisions
              </li>
              <li>
                Are indicators only and must be validated by qualified
                healthcare professionals
              </li>
              <li>May not detect all health concerns or emergencies</li>
            </ul>

            <h4 className="font-semibold text-slate-700 mt-4 mb-2">
              5.2 Regulatory Position
            </h4>
            <p>
              The Service is not classified as a medical device under current UK
              medical device regulations. It is intended solely as a
              decision-support and documentation tool for care professionals.
              Users remain fully responsible for clinical judgment, escalation
              decisions, and compliance with applicable healthcare regulations
              and professional standards.
            </p>

            <h4 className="font-semibold text-slate-700 mt-4 mb-2">
              5.3 Medical Emergencies
            </h4>
            <div className="bg-slate-100 rounded-xl p-4 my-4">
              <p className="font-semibold text-slate-800">
                IN CASE OF A MEDICAL EMERGENCY, CONTACT EMERGENCY SERVICES
                IMMEDIATELY (999, 112, 911, OR YOUR LOCAL EMERGENCY NUMBER).
              </p>
              <p className="text-slate-600 text-sm mt-2">
                Do not rely on the Service for emergency situations.
              </p>
            </div>
          </Section>

          <Section title="6. User Responsibilities">
            <h4 className="font-semibold text-slate-700 mt-4 mb-2">
              6.1 Proper Use
            </h4>
            <p>Users agree to:</p>
            <ul>
              <li>
                Use the Service only for its intended purpose of healthcare
                observation recording
              </li>
              <li>
                Provide accurate and truthful information in all visit entries
              </li>
              <li>Record observations promptly and completely</li>
              <li>
                Follow their agency's policies and procedures for care
                documentation
              </li>
            </ul>

            <h4 className="font-semibold text-slate-700 mt-4 mb-2">
              6.2 Prohibited Conduct
            </h4>
            <p>Users must NOT:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Provide false, misleading, or inaccurate information</li>
              <li>Access records of clients they are not authorised to view</li>
              <li>Share client information with unauthorised parties</li>
              <li>Attempt to circumvent security measures</li>
              <li>Reverse engineer, decompile, or modify the Service</li>
            </ul>
          </Section>

          <Section title="7. Data Protection and Privacy">
            <p>
              All personal and health data is processed in accordance with
              applicable data protection legislation including UK GDPR and the
              Data Protection Act 2018.
            </p>
            <p className="mt-3">
              The registered agency acts as the Data Controller for client
              information entered into the Service. Agencies are responsible for
              ensuring lawful basis for processing, providing appropriate
              privacy notices, and responding to data subject requests.
            </p>
          </Section>

          <Section title="8. Confidentiality">
            <p>
              Users acknowledge that information accessed through the Service
              includes sensitive personal and health information. Users agree to
              maintain strict confidentiality and comply with professional codes
              of conduct.
            </p>
          </Section>

          <Section title="9. Intellectual Property">
            <p>
              All content, features, functionality, software, text, graphics,
              logos, and trademarks of Lynto are the exclusive property of the
              Service owner and are protected by intellectual property laws.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p className="uppercase text-xs tracking-wide text-slate-500 mb-2">
              Disclaimer
            </p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED ON
              AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT WARRANTIES OF ANY
              KIND. THE SERVICE OWNER SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES,
              INCLUDING BUT NOT LIMITED TO LOSS OF DATA, CLINICAL OUTCOMES, OR
              HEALTHCARE DECISIONS MADE USING THE SERVICE. NOTHING IN THESE
              TERMS LIMITS LIABILITY FOR DEATH OR PERSONAL INJURY CAUSED BY
              NEGLIGENCE, FRAUD, OR ANY OTHER LIABILITY WHICH CANNOT BE EXCLUDED
              UNDER APPLICABLE LAW.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              We may suspend or terminate your access for violation of these
              Terms, misuse of the Service, or at the request of your employing
              agency. Upon termination, you must cease all use of the Service.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms and Conditions shall be governed by and construed in
              accordance with the laws of England and Wales. Nothing in this
              clause limits the ability of users or agencies located in Scotland
              or Northern Ireland to rely on any mandatory rights or protections
              available to them under the laws applicable in their jurisdiction.
              Any disputes arising out of or in connection with these Terms
              shall be subject to the exclusive jurisdiction of the courts of
              England and Wales.
              
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              For questions about these Terms and Conditions, please contact
              your agency administrator or reach out to our support team.
            </p>
          </Section>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-center text-slate-600 font-medium">
              By using Lynto, you acknowledge that you have read, understood,
              and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="text-slate-600 space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-slate-600">
        {children}
      </div>
    </div>
  )
}
