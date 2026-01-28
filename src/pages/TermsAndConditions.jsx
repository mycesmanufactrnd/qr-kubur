import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { translate } from '@/utils/translations';

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-screen flex flex-col pb-2">
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-8 w-8"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">
          {translate('Terms & Conditions')}
        </h1>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-md overflow-y-auto p-6">
        <div className="text-gray-700 space-y-4 leading-relaxed">

          <p>Last updated: January 22, 2026</p>
          <p>Please read these terms and conditions carefully before using Our Service.</p>

          <p><strong>1.0 Interpretation and Definitions</strong></p>

          <p><strong>1.1 Interpretation</strong></p>
          <p>
            The words whose initial letters are capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
          </p>

          <p><strong>1.2 Definitions</strong></p>
          <p>For the purposes of these Terms and Conditions:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Affiliate</strong> means an entity that controls, is controlled by, or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities 
            entitled to vote for election of directors or other managing authority.</li>
            <li><strong>Country</strong> refers to: Malaysia</li>
            <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in these Terms and Conditions) refers to MyCES Manufacturing Sdn. Bhd.</li>
            <li><strong>Device</strong> means any device that can access the Service such as a computer, a cell phone or a digital tablet.</li>
            <li><strong>Service</strong> refers to the Website.</li>
            <li><strong>Terms and Conditions</strong> (also referred to as "Terms") means these Terms and Conditions, including any documents expressly incorporated by reference, which govern Your access to and use of the Service 
            and form the entire agreement between You and the Company regarding the Service.</li>
            <li><strong>Third-Party Social Media Service</strong> means any services or content (including data, information, products or services) provided by a third party that is displayed, included, made available, or linked to through the Service.</li>
            <li><strong>Website</strong> QR Kubur, accessible from google.com</li>
            <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
          </ul>

          <p><strong>2.0 Acknowledgment</strong></p>
          <p>
            These are the Terms and Conditions governing the use of this Service and the agreement between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
          </p>
          <p>
            Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. 
            These Terms apply to all visitors, users and others who access or use the Service.
          </p>
          <p>
            By accessing or using the Service You agree to be bound by these Terms. 
            If You disagree with any part of these Terms then You may not access the Service.
          </p>
          <p>
            You represent that you are over the age of 18. The Company does not permit those under 18 to use the Service.
          </p>
          <p>
            Your access to and use of the Service is also subject to Our Privacy Policy, which describes how We collect, use, and disclose personal information. 
          </p>
          <p>
            Please read Our Privacy Policy carefully before using Our Service.
          </p>

          <p><strong>3.0 User Accounts</strong></p>
          <p>
            Users may create accounts to access certain features of the Service. 
            You are responsible for maintaining the confidentiality of Your login credentials and for any activity under Your account.
          </p>
          <p>
            You agree to provide accurate, complete, and current information and to update such information as necessary.
          </p>

          <p><strong>4.0 User-Generated Content</strong></p>
          <p>
            Users may create, upload, submit, store, or share content through the Service. By uploading or submitting content, 
            You represent that You have the rights to use and share such content and grant the Company a non-exclusive, worldwide, royalty-free license to use, 
            modify, display, reproduce, and distribute the content for the purposes of operating and improving the Service.
          </p>
          <p>
            The Company reserves the right to remove or restrict any content that violates these Terms, applicable laws, or community guidelines.
          </p>

          <p><strong>5.0 Intellectual Property Rights</strong></p>
          <p>
            All content provided by the Company, including logos, visual designs, graphics, text, trademarks, service marks, and other materials (collectively, “Company Content”), is the exclusive property of the Company or its licensors.
          </p>
          <p>
            You may not use, reproduce, distribute, or create derivative works of any Company Content without the Company’s prior written consent.
          </p>

          <p><strong>6.0 Feedback and Suggestions</strong></p>
          <p>
            Any feedback, suggestions, ideas, or recommendations you provide to the Company regarding the Service (“Feedback”) may be used by the Company without any obligation to compensate You.
          </p>
          <p>
            By submitting Feedback, You grant the Company a worldwide, perpetual, irrevocable, royalty-free license to use, copy, modify, distribute, and implement the Feedback in any way it deems appropriate.
          </p>

          <p><strong>7.0 Purchases and Payments</strong></p>
          <p>
            The Service may allow users to purchase goods, items, or services offered by the Company. All purchases are one-time payments unless specified otherwise.
          </p>

          <p><strong>8.0 Subscription Plans</strong></p>
          <p>
            We may offer subscription-based services that provide access to additional features or benefits. 
            Subscription terms, including billing cycles, pricing, and cancellation policies, will be provided at the time of subscription.
          </p>

          <p><strong>9.0 Links to Other Websites</strong></p>
          <p>
            Our Service may contain links to third-party websites or services that are not owned or controlled by the Company.
          </p>
          <p>
            The Company has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You further acknowledge and agree that the Company shall not 
            be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods or services available 
            on or through any such websites or services.
          </p>
         
          <p>
            We strongly advise You to read the terms and conditions and privacy policies of any third-party websites or services that You visit.
          </p>

          <p><strong>10.0 Promotions, Contests and Sweepstakes</strong></p>
          <p>
            From time to time, the Company may offer promotions, contests, or sweepstakes. Participation in such events is subject to additional terms and conditions provided by the Company. 
            The Company reserves the right to modify, suspend, or terminate any promotion, contest, or sweepstake at any time without prior notice.
          </p>

          <p><strong>11.0 Links from a Third-Party Social Media Service</strong></p>
          <p>
            The Service may display, include, make available, or link to content or services provided by a Third-Party Social Media Service. 
            A Third-Party Social Media Service is not owned or controlled by the Company, and the Company does not endorse or assume responsibility for any Third-Party Social Media Service.
          </p>
          <p>
            You acknowledge and agree that the Company shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with Your access 
            to or use of any Third-Party Social Media Service, including any content, goods, or services made available through them. Your use of any Third-Party Social Media Service is governed by that 
            Third-Party Social Media Service's terms and privacy policies.
          </p>

          <p><strong>12.0 Termination</strong></p>
          <p>
            We may terminate or suspend Your access immediately, without prior notice or liability, for any reason, including if You breach these Terms.
          </p>
          <p>
            Upon termination, Your right to use the Service will cease immediately.
          </p>

          <p><strong>13.0 Limitation of Liability</strong></p>
          <p>
            Notwithstanding any damages that You might incur, the entire liability of the Company and any of its suppliers under any provision of these Terms and Your exclusive remedy for all of the 
            foregoing shall be limited to the amount actually paid by You through the Service.
          </p>
          <p>
            To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever 
            (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way 
            related to the use of or inability to use the Service, third-party software and/or third-party hardware used with the Service, or otherwise in connection with any provision of these Terms), 
            even if the Company or any supplier has been advised of the possibility of such damages and even if the remedy fails of its essential purpose.
          </p>
          <p>
            Some states do not allow the exclusion of implied warranties or limitation of liability for incidental or consequential damages, which means that some of the above limitations may not apply. 
            In these states, each party's liability will be limited to the greatest extent permitted by law.
          </p>

          <p><strong>14.0 "AS IS" and "AS AVAILABLE" Disclaimer</strong></p>
          <p>
            The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, the Company, 
            on its own behalf and on behalf of its Affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or 
            otherwise, with respect to the Service, including all implied warranties of merchantability, fitness for a particular purpose, title and non-infringement, and warranties that may arise 
            out of course of dealing, course of performance, usage or trade practice. Without limitation to the foregoing, the Company provides no warranty or undertaking, and makes no representation 
            of any kind that the Service will meet Your requirements, achieve any intended results, be compatible or work with any other software, applications, systems or services, operate without 
            interruption, meet any performance or reliability standards or be error free or that any errors or defects can or will be corrected.
          </p>
          <p>
            Without limiting the foregoing, neither the Company nor any of the company's provider makes any representation or warranty of any kind, express or implied: (i) as to the operation or 
            availability of the Service, or the information, content, and materials or products included thereon; (ii) that the Service will be uninterrupted or error-free; (iii) as to the accuracy, 
            reliability, or currency of any information or content provided through the Service; or (iv) that the Service, its servers, the content, or e-mails sent from or on behalf of the Company 
            are free of viruses, scripts, trojan horses, worms, malware, timebombs or other harmful components.
          </p>
          <p>
            Some jurisdictions do not allow the exclusion of certain types of warranties or limitations on applicable statutory rights of a consumer, so some or all of the above exclusions and 
            limitations may not apply to You. But in such a case the exclusions and limitations set forth in this section shall be applied to the greatest extent enforceable under applicable law.
          </p>
          
          <p><strong>15.0 Governing Law</strong></p>
          <p>
            The laws of the Country, excluding its conflicts of law rules, shall govern these Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws.
          </p>

          <p><strong>16.0 Disputes Resolution</strong></p>
          <p>
            If You have any concern or dispute about the Service, You agree to first try to resolve the dispute informally by contacting the Company.
          </p>

          <p><strong>17.0 Severability and Waiver</strong></p>
          <p><strong>17.1 Severability</strong></p>
          <p>
            If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable 
            law and the remaining provisions will continue in full force and effect.
          </p>
          <p><strong>17.2 Waiver</strong></p>
          <p>
            Except as provided herein, the failure to exercise a right or to require performance of an obligation under these Terms shall not affect a party's ability to exercise such right or require such performance at any time 
            thereafter nor shall the waiver of a breach constitute a waiver of any subsequent breach.
          </p>

          <p><strong>18.0 Translation Interpretation</strong></p>
          <p>
            These Terms and Conditions may have been translated if We have made them available to You on our Service. You agree that the original English text shall prevail in the case of a dispute.
          </p>

          <p><strong>19.0 Changes to These Terms and Conditions</strong></p>
          <p>
            We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. 
            What constitutes a material change will be determined at Our sole discretion.
          </p>
          <p>
            By continuing to access or use Our Service after those revisions become effective, You agree to be bound by the revised terms. If You do not agree to the new terms, in whole or in part, please stop using the Service.
          </p>

          <p><strong>20.0 Contact Us</strong></p>
          <p>If you have any questions about these Terms and Conditions, You can contact us:</p>
          <ul className="list-disc pl-6">
            <li>By email: admin@mycesgroup.com</li>
          </ul>

        </div>
      </div>
    </div>
  );
}