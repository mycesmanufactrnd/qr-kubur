// @ts-nocheck
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import CheckboxForm from "@/components/forms/CheckboxForm";
import { translate } from "@/utils/translations";
import { STATES_MY } from "@/utils/enums";

function SectionHeader({ children }) {
  return (
    <h3 className="text-sm font-medium text-gray-700 border-b pb-2 dark:text-slate-200">
      {children}
    </h3>
  );
}

export function DeathCharityBasicContactFields({
  control,
  errors,
  isSuperAdmin,
  currentUserStates,
  required = true,
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionHeader>{translate("Basic Information")}</SectionHeader>
        <TextInputForm
          name="dcname"
          control={control}
          label={translate("Name")}
          required={required}
          errors={errors}
        />
        <SelectForm
          name="dcstate"
          control={control}
          label={translate("State")}
          placeholder={translate("Select states")}
          options={isSuperAdmin ? STATES_MY : currentUserStates || []}
          required={required}
          errors={errors}
        />
        <TextInputForm
          name="dcdescription"
          control={control}
          label={translate("Description")}
          isTextArea
        />
      </div>
      <div className="space-y-4">
        <SectionHeader>{translate("Contact Information")}</SectionHeader>
        <div className="grid grid-cols-2 gap-4">
          <TextInputForm
            name="dccontactperson"
            control={control}
            label={translate("Contact Person")}
            required={required}
            errors={errors}
          />
          <TextInputForm
            name="dccontactphone"
            control={control}
            label={translate("Contact Phone No.")}
            required={required}
            errors={errors}
          />
        </div>
      </div>
    </div>
  );
}

export function mapDeathCharityFormToPayload(formData, { mosqueId, organisation }) {
  return {
    name: formData.dcname,
    description: formData.dcdescription || null,
    state: formData.dcstate,
    contactperson: formData.dccontactperson,
    contactphone: formData.dccontactphone,
    registrationfee: Number(formData.dcregistrationfee) || 0,
    yearlyfee: Number(formData.dcyearlyfee) || 0,
    deathbenefitamount: Number(formData.dcdeathbenefitamount) || 0,
    coversspouse: !!formData.dccoversspouse,
    coverschildren: !!formData.dccoverschildren,
    maxdependents: Number(formData.dcmaxdependents) || 0,
    isselfregister: !!formData.dcisselfregister,
    isactive: !!formData.dcisactive,
    mosqueid: mosqueId ?? null,
    organisation: organisation ?? null,
  };
}

export function mapDeathCharityToFormFields(deathCharity) {
  if (!deathCharity) return {};
  return {
    dcname: deathCharity.name ?? "",
    dcstate: deathCharity.state ?? "",
    dcdescription: deathCharity.description ?? "",
    dccontactperson: deathCharity.contactperson ?? "",
    dccontactphone: deathCharity.contactphone ?? "",
    dcregistrationfee: Number(deathCharity.registrationfee) || 0,
    dcyearlyfee: Number(deathCharity.yearlyfee) || 0,
    dcdeathbenefitamount: Number(deathCharity.deathbenefitamount) || 0,
    dccoversspouse: deathCharity.coversspouse ?? true,
    dccoverschildren: deathCharity.coverschildren ?? true,
    dcmaxdependents: deathCharity.maxdependents ?? 0,
    dcisselfregister: deathCharity.isselfregister ?? true,
    dcisactive: deathCharity.isactive ?? true,
  };
}

export function DeathCharityFeeCoverageStatusFields({
  control,
  errors,
  required = true,
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionHeader>{translate("Fee Information")}</SectionHeader>
        <div className="grid grid-cols-2 gap-4">
          <TextInputForm
            name="dcregistrationfee"
            control={control}
            label={translate("Registration Fee")}
            isMoney
            required={required}
            errors={errors}
          />
          <TextInputForm
            name="dcyearlyfee"
            control={control}
            label={translate("Yearly Fee")}
            isMoney
            required={required}
            errors={errors}
          />
        </div>
        <TextInputForm
          name="dcdeathbenefitamount"
          control={control}
          label={translate("Death Benefit Amount")}
          isMoney
          required={required}
          errors={errors}
        />
      </div>
      <div className="space-y-4">
        <SectionHeader>{translate("Coverage Details")}</SectionHeader>
        <div className="grid grid-cols-2 gap-4">
          <CheckboxForm
            name="dccoversspouse"
            control={control}
            label={translate("Covers Spouse")}
          />
          <CheckboxForm
            name="dccoverschildren"
            control={control}
            label={translate("Covers Children")}
          />
        </div>
        <TextInputForm
          name="dcmaxdependents"
          control={control}
          label={translate("Max Dependents")}
          isNumber
          required={required}
          errors={errors}
        />
        <CheckboxForm
          name="dcisselfregister"
          control={control}
          label={translate("Allow Self Register")}
        />
      </div>
      <div className="space-y-4">
        <SectionHeader>{translate("Status")}</SectionHeader>
        <CheckboxForm
          name="dcisactive"
          control={control}
          label={translate("Active")}
        />
      </div>
    </div>
  );
}
