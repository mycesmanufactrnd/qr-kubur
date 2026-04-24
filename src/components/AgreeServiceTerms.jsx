import { translate } from "@/utils/translations";

export default function AgreeServiceTerms() {
  return (
    <div className="space-y-3 text-sm text-slate-700">
      <p>
        {translate(
          "This Service Agreement outlines the terms for offering services through the platform. By accepting, you agree to the conditions below.",
        )}
      </p>
      <p>
        {translate(
          "Service Payout: For each successful service payment, 95% of the net amount is allocated to your organisation and 5% is retained by the platform as a service fee. Net amount excludes refunds, chargebacks, and payment processor fees when applicable.",
        )}
      </p>
      <p>
        {translate(
          "Service Delivery: You will provide the listed services to end users as described, maintain accurate pricing and service information, and handle requests promptly and professionally.",
        )}
      </p>
      <p>
        {translate(
          "Payout Schedule: Payouts are processed according to the selected payment platform’s schedule and may be delayed due to verification, compliance checks, or dispute resolution.",
        )}
      </p>
      <p>
        {translate(
          "Compliance: You are responsible for all applicable taxes, statutory obligations, and regulatory compliance for the services provided and payments received.",
        )}
      </p>
      <p>
        {translate(
          "Disputes & Enforcement: The platform may investigate disputes and may suspend, modify, or remove services that violate policies or result in repeated complaints.",
        )}
      </p>
      <p>
        {translate(
          "Updates: The platform may update these terms with reasonable notice. Continued use of the service constitutes acceptance of updated terms.",
        )}
      </p>
    </div>
  );
}
