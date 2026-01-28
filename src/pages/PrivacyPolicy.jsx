import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 h-screen flex flex-col pb-4">
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Dasar Privasi</h1>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-md overflow-auto p-6 space-y-6">
        <p>Last updated: 22 January 2026</p>

        <p className="mb-4">
          This Privacy Policy explains how QR Kubur collects, uses, discloses, and protects your personal information when you access or use our system. By using our service, you agree to the terms of this Privacy Policy.
        </p>

        <h2 className="text-xl font-semibold mt-4">1. Information We Collect</h2>

        <h3 className="text-lg font-semibold mt-4">1.1 Personal Information You Provide</h3>
        <p className="mb-4">
          When you register, use our services, make payments, or contact us, we may collect your first and last name, email address, phone number, address, payment-related information such as transaction reference numbers and payment status, and any other information you voluntarily provide. Sensitive payment details, such as full credit or debit card numbers, are processed securely by third-party payment service providers and are not stored by us.
        </p>

        <h3 className="text-lg font-semibold mt-4">1.2 Social Login Information</h3>
        <p className="mb-4">
          If you choose to sign in using Google or Facebook, we may collect information associated with your account, such as your name, email address, and profile picture. We only access information that you allow through the respective platform’s permission settings. This information is used solely for account management and to provide service functionality, and is not used for marketing purposes.
        </p>

        <h3 className="text-lg font-semibold mt-4">1.3 Automatically Collected and Tracking Information</h3>
        <p className="mb-4">
          We may automatically collect technical and usage information, including IP address, device type, browser, operating system, and usage data such as pages visited, time spent, and interactions within the system. We may also use tracking and analytics tools to improve system performance and user experience.
        </p>

        <h3 className="text-lg font-semibold mt-4">1.4 Location Information</h3>
        <p className="mb-4">
          We may collect and process approximate location information to provide location-based features, such as displaying locations through Google Maps. Location data is used solely for service functionality and is not used for continuous or precise real-time tracking unless explicitly permitted by the user.
        </p>

        <h2 className="text-xl font-semibold mt-6">2. How We Use Your Information</h2>
        <p className="mb-4">
          We use your personal information to create and manage user accounts, provide and improve our services, process payments, transactions, and service requests, communicate with you regarding account activity and service updates, enhance system security and prevent fraud, and comply with applicable legal and regulatory requirements.
        </p>

        <h2 className="text-xl font-semibold mt-6">3. Email Communications</h2>
        <p className="mb-4">
          We may send emails to users for account-related purposes, such as password resets, account verification, and service notifications. We may also send emails regarding payments, including confirmations, failed or pending transactions, and refunds. All email communications are essential for providing our services and are not marketing or promotional in nature.
        </p>
        <p className="mb-4">
          Users are responsible for ensuring that their email address is accurate and up to date. We are not responsible for any issues arising from emails not received due to incorrect contact information or email service provider restrictions.
        </p>

        <h2 className="text-xl font-semibold mt-6">4. Advertising</h2>
        <p className="mb-4">
          We do not display third-party advertisements within the system. We do not use your personal information for advertising or marketing by external advertisers.
        </p>

        <h2 className="text-xl font-semibold mt-6">5. Payments and Transactions</h2>
        <p className="mb-4">
          Users may pay for certain services offered through the system. When a payment is made, we collect information necessary to process the transaction, such as payment method details, transaction reference numbers, and payment status. All payments are processed securely through third-party payment service providers. We do not store sensitive payment information, such as full credit or debit card numbers, on our servers. Payment information is used solely for processing transactions, managing refunds, and resolving payment-related issues.
        </p>

        <h2 className="text-xl font-semibold mt-6">6. Compliance with Malaysian Law</h2>
        <p className="mb-4">
          We are committed to protecting personal data in accordance with the Personal Data Protection Act 2010 (PDPA) of Malaysia. All personal information collected, used, and processed through the system is handled in compliance with the principles set out under the PDPA, including General, Notice and Choice, Disclosure, Security, Retention, Data Integrity, and Access principles.
        </p>
        <p className="mb-4">
          Personal data is collected for lawful purposes directly related to the operation of the system and is not further processed in a manner inconsistent with those purposes. Reasonable steps are taken to ensure that personal data is accurate, complete, and protected against unauthorized access, misuse, loss, or disclosure.
        </p>
        <p className="mb-4">
          Users have the right to access and correct their personal data held by us, subject to applicable legal limitations under Malaysian law. Requests relating to personal data may be made by contacting us using the contact details provided in this Privacy Policy.
        </p>

        <h2 className="text-xl font-semibold mt-6">7. Sharing and Disclosure of Information</h2>
        <p className="mb-4">
          We do not sell, rent, or trade users’ personal information. Personal information may be shared only with trusted third-party service providers who assist in operating the system, such as payment processors, authentication providers, hosting services, and analytics providers, and only to the extent necessary for them to perform their services.
        </p>
        <p className="mb-4">
          We may also disclose personal information where required to do so by law, regulation, legal process, or governmental request, or where such disclosure is necessary to protect the rights, safety, or security of the system, our users, or the public.
        </p>

        <h2 className="text-xl font-semibold mt-6">8. Data Security</h2>
        <p className="mb-4">
          We implement reasonable technical and organizational measures to protect personal information against unauthorized access, alteration, disclosure, or destruction. These measures include secure servers, access controls, and encryption where appropriate. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="text-xl font-semibold mt-6">9. Data Retention</h2>
        <p className="mb-4">
          We retain personal information only for as long as necessary to fulfill the purposes for which it was collected, including the provision of services, compliance with legal obligations, resolution of disputes, and enforcement of our agreements. When personal information is no longer required, it will be securely deleted or anonymized in accordance with applicable laws and regulations.
        </p>

        <h2 className="text-xl font-semibold mt-6">10. User Rights and Choices</h2>
        <p className="mb-4">
          Users have the right to access, correct, update, or request deletion of their personal information, subject to applicable legal requirements. Users may also withdraw consent for certain data processing activities, where applicable. Requests relating to personal data may be submitted using the contact details provided in this Privacy Policy, and we will respond in accordance with applicable laws.
        </p>

        <h2 className="text-xl font-semibold mt-6">11. Changes to This Privacy Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time to reflect changes in legal, regulatory, or operational requirements. Any updates will be posted within the system, and the revised policy will take effect upon publication. Continued use of the system after any changes indicates acceptance of the updated Privacy Policy.
        </p>

        <h2 className="text-xl font-semibold mt-6">12. Contact Information</h2>
        <p className="mb-2">If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your personal data, please contact us at:</p>
        <p className="mb-2">Email: admin@mycesgroup.com</p>
        <p className="mb-2">Organization Name: My Ces Manufacturing Sdn Bhd</p>
        <p className="mb-2">Address: Jalan Damai Mewah 1, Taman Damai Mewah, 43000 Kajang, Selangor</p>
      </div>
    </div>
  );
}
