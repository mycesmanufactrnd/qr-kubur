import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { translate } from '@/utils/translations';
import { MapPin, Plus, Edit, Trash2, Search, X, Save, UserPlus, Diamond, DiamondPlus, CreditCard } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { useCrudPermissions } from '@/components/PermissionsContext';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { 
  useGetDeathCharityMemberPaginated, 
  useDeathCharityMemberMutations, 
} from '@/hooks/useDeathCharityMemberMutations';
import { defaultDeathCharityMemberField } from '@/utils/defaultformfields';
import { validateFields } from '@/utils/validations';
import TextInputForm from '@/components/forms/TextInputForm';
import SelectForm from '@/components/forms/SelectForm';
import { Switch } from '@/components/ui/switch';
import { ClaimStatus } from '@/utils/enums';
import { createPageUrl } from '@/utils';
import { useGetDeathCharityByOrganisation } from '@/hooks/useDeathCharityMutations';
import { useDeathCharityClaimMutations } from '@/hooks/useDeathCharityClaimMutations';

export default function ManageDeathCharityMember() {
  const navigate = useNavigate();

  const { loadingUser, currentUser, hasAdminAccess } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlFullName = searchParams.get('fullname') || '';

  const [tempFullName, setTempFullName] = useState(urlFullName);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeathCharityMember, setEditingDeathCharityMember] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deathCharityMemberToDelete, setDeathCharityMemberToDelete] = useState(null);

  const [coverageDialogOpen, setCoverageDialogOpen] = useState(false);
  const [coverageMember, setCoverageMember] = useState(null);

  const [spouses, setSpouses] = useState([]);
  const [children, setChildren] = useState([]);

  const [spouseForm, setSpouseForm] = useState({ fullname: '', icnumber: '' });
  const [childForm, setChildForm] = useState({ fullname: '', icnumber: '' });

  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimable, setClaimable] = useState([]);
  const [selectedClaims, setSelectedClaims] = useState([]);
  const [memberId, setMemberId] = useState(null);
  const [deathCharityId, setDeathCharityId] = useState(null);
  const [isCoverSpouse, setIsCoverSpouse] = useState(false);
  const [isCoverChildren, setIsCoverChildren] = useState(false);
  const [deathBenefitAmount, setDeathBenefitAmount] = useState(0);

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('death_charity');

  const { deathCharityMemberList, totalPages, isLoading } = useGetDeathCharityMemberPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterFullName: urlFullName, 
  });

  const { data: deathCharityList = [] } = useGetDeathCharityByOrganisation();
  
  const { 
    createDeathCharityMember, 
    updateDeathCharityMember, 
    deleteDeathCharityMember,
    upsertDeathCharityDependents,
  } = useDeathCharityMemberMutations();

  const { createDeathCharityBulkClaims } = useDeathCharityClaimMutations();

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultDeathCharityMemberField,
  });

  const isactive = watch("isactive");

  useEffect(() => {
    setTempFullName(urlFullName);
  }, [urlFullName]);

  const handleSearch = () => {
    const params = { page: '1', fullname: '' };
    if (tempFullName) params.fullname = tempFullName;
    setSearchParams(params);
  };

  const handleReset = () => setSearchParams({});

  const openAddDialog = () => {
    setEditingDeathCharityMember(null);
    reset(defaultDeathCharityMemberField);
    setIsDialogOpen(true);
  };

  const openEditDialog = (deathCharityMember) => {
    setEditingDeathCharityMember({ ...deathCharityMember });
    reset({
        ...deathCharityMember,
        deathcharity: deathCharityMember.deathcharity?.id?.toString() ?? '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (formData) => {
    const submitData = { 
        ...formData,
        deathcharity: formData.deathcharity ? { id: Number(formData.deathcharity) } : null,
    };

    try {
      if (editingDeathCharityMember) {
        await updateDeathCharityMember.mutateAsync({ id: editingDeathCharityMember.id, data: submitData });
      } else {
        await createDeathCharityMember.mutateAsync(submitData);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (!deathCharityMemberToDelete) return;

    try {
      await deleteDeathCharityMember.mutateAsync(deathCharityMemberToDelete.id);
      setDeleteDialogOpen(false);
      setDeathCharityMemberToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const openCoverageDialog = (member) => {
    if (member.deathcharity) {
      const { coversspouse, coverschildren } = member.deathcharity;

      setIsCoverSpouse(coversspouse)
      setIsCoverChildren(coverschildren)
    }

    setSpouseForm({ fullname: '', icnumber: '' });
    setChildForm({ fullname: '', icnumber: '' });

    if (member.dependents && member.dependents.length > 0) {
      const spouseList = member.dependents.filter(d => d.relationship === "spouse");
      const childrenList = member.dependents.filter(d => d.relationship === "child");

      setSpouses(spouseList);
      setChildren(childrenList);
    } else {
      setSpouses([]);
      setChildren([]);
    }

    setCoverageMember(member);
    setCoverageDialogOpen(true);
  };

  const addSpouse = () => {
    if (!spouseForm.fullname || !spouseForm.icnumber) return;
    if (spouses.length >= 4) return;

    setSpouses([
      ...spouses,
      { ...spouseForm, relationship: 'spouse' },
    ]);

    setSpouseForm({ fullname: '', icnumber: '' });
  };

  const addChild = () => {
    if (!childForm.fullname || !childForm.icnumber) return;

    setChildren([
      ...children,
      { ...childForm, relationship: 'child' },
    ]);

    setChildForm({ fullname: '', icnumber: '' });
  };

  const removeSpouse = (index) =>
    setSpouses(spouses.filter((_, i) => i !== index));

  const removeChild = (index) =>
    setChildren(children.filter((_, i) => i !== index));

  const handleSaveCoverage = async () => {
    if (!coverageMember) return;

    const dependents = [...spouses, ...children].map(d => ({
      id: d.id,
      fullname: d.fullname,
      icnumber: d.icnumber,
      relationship: d.relationship,
    }));

    try {
      await upsertDeathCharityDependents.mutateAsync({
        member: coverageMember.id ? { id: Number(coverageMember.id) } : null,
        dependents,
      })
      .then((res) => {
        console.info('Success Upsert', res);
      })
      .catch((err) => {
        console.error('Error Upsert', err);
      })
      .finally(() => setCoverageDialogOpen(false));
      
    } catch (error) {
      console.error('Failed to save coverage:', error);
    }
  };

  const openClaimDialog = (member) => {
    const { id: memberId, fullname, claims = [], dependents = [], deathcharity } = member;

    setDeathBenefitAmount(
      (deathcharity && deathcharity.deathbenefitamount) 
        ? Number(deathcharity.deathbenefitamount) 
        : 0
    );
    
    setMemberId(member.id);
    setDeathCharityId(member?.deathcharity?.id ?? null);

    const memberClaimedAmount = claims.reduce(
      (sum, c) => sum + (Number(c.payoutamount) || 0),
      0
    );
    const memberClaimsCount = claims.length;

    const memberClaimList = claims.map(
      (c, idx) => `- ${c.deceasedname}: RM ${Number(c.payoutamount) || 0}`
    ).join('\n');

    const claimable = [
      {
        deceasedname: fullname,
        relationship: "member",
        totalAmount: memberClaimedAmount,
        numberOfClaims: memberClaimsCount,
        claims: claims.map(c => ({ deceasedname: c.deceasedname, payoutamount: Number(c.payoutamount) || 0 }))
      },
      ...dependents.map(({ id: dependentId, fullname, relationship, claims = [] }) => {
        const dependentClaimedAmount = claims.reduce(
          (sum, c) => sum + (Number(c.payoutamount) || 0),
          0
        );
        const dependentClaimsCount = claims.length;
        const dependentClaimedTotal = `RM ${dependentClaimedAmount} (${dependentClaimsCount})`;

        return {
          dependentId,
          deceasedname: fullname,
          relationship,
          claimedamount: dependentClaimedTotal
        };
      })
    ];

    setClaimable(claimable);
    setClaimDialogOpen(true);
  };

  const handleSelectClaim = (item) => {
    const exists = selectedClaims.find(
      (c) => c.deceasedname === item.deceasedname
    );

    if (exists) {
      setSelectedClaims(
        selectedClaims.filter(
          (c) => c.deceasedname !== item.deceasedname
        )
      );
    } else {
      setSelectedClaims([
        ...selectedClaims,
        { ...item, payoutamount: deathBenefitAmount }
      ]);
    }
  };

  const handleSaveClaim = async () => {
    if (selectedClaims.length === 0) return;

    try {
      const payloadClaims = selectedClaims.map(c => ({
        deceasedname: c.deceasedname,
        relationship: c.relationship,
        member: memberId ? { id: Number(memberId) } : null,
        dependent: c.dependentId ? { id: Number(c.dependentId) } : null,
        deathcharity: deathCharityId ? { id: Number(deathCharityId) } : null,
        payoutamount: Number(c.payoutamount) ?? 0,
        status: ClaimStatus.PENDING,
      }));

      await createDeathCharityBulkClaims.mutateAsync({
        claims: payloadClaims
      });

      setClaimDialogOpen(false);
      setSelectedClaims([]);
    } catch (error) {
      console.error("Failed to save claim:", error);
    }
  };

  const openPaymentLedger = (member) => {
    navigate(createPageUrl('ManageDeathCharityLedger') + `?deathcharity=${member.deathcharity.id}&member=${member.id}`);
  }

  if (loadingUser || permissionsLoading) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!hasAdminAccess) {
    return (
      <AccessDeniedComponent/>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
          { label: translate('Manage Death Charity Member'), page: 'ManageDeathCharityMember' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Admin Dashboard'), page: 'AdminDashboard' },
        { label: translate('Manage Death Charity Member'), page: 'ManageDeathCharityMember' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate('Manage Death Charity Member')}
        </h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              {translate('Add Death Charity Member')}
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={tempFullName}
                onChange={(e) => setTempFullName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700 px-6">
              {translate('Search')}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="w-4 h-4 mr-2" /> {translate('Reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate('Full Name')}</TableHead>
                <TableHead className="text-center">{translate('IC No')}</TableHead>
                <TableHead className="text-center">{translate('Phone No.')}</TableHead>
                <TableHead className="text-center">{translate('Active')}</TableHead>
                <TableHead className="text-center">{translate('Death Charity')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={6} />
              ) : deathCharityMemberList.items.length === 0 ? (
                <NoDataTableComponent colSpan={6} />
              ) : (
                deathCharityMemberList.items.map(member => {
                  
                  const hasCoverage =
                    !!member.deathcharity &&
                    (member.deathcharity.coverschildren || member.deathcharity.coversspouse);

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.fullname}</TableCell>
                      <TableCell className="text-center">{member.icnumber}</TableCell>
                      <TableCell className="text-center">{member.phone}</TableCell>
                      <TableCell className="text-center">{member.isactive ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-center">
                        {member.deathcharity?.name ?? ''}
                      </TableCell>

                      <TableCell className="text-center">
                        {(canEdit || canDelete) && (
                           <div className="flex flex-wrap justify-center gap-1">
                            {canEdit && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                { hasCoverage && (
                                  <Button variant="ghost" size="sm"
                                    onClick={() => openCoverageDialog(member)}
                                  >
                                    <UserPlus className="w-4 h-4 text-green-500" />
                                  </Button>
                                ) }
                                <Button variant="ghost" size="sm" 
                                  onClick={() => openClaimDialog(member)}
                                >
                                  <DiamondPlus className="w-4 h-4 text-amber-500" />
                                </Button>
                                <Button variant="ghost" size="sm" 
                                  onClick={() => openPaymentLedger(member)}
                                >
                                  <CreditCard className="w-4 h-4 text-blue-500" />
                                </Button>
                              </>
                            )}

                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeathCharityMemberToDelete(member);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {totalPages > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({ ...Object.fromEntries(searchParams), page: '1' });
            }}
            totalItems={deathCharityMemberList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>
                      {editingDeathCharityMember ? translate('Edit Death Charity Member') : translate('Add Death Charity Member')}
                  </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                  Death Charity Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                  <SelectForm
                      name="deathcharity"
                      control={control}
                      label={translate("Death Charity")}
                      placeholder={translate("All Managing Death Charity")}
                      options={deathCharityList.map(deathCharity => ({
                      value: deathCharity.id,
                      label: deathCharity.name,
                    }))}
                  />
                  </div>
              </div>
                  <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                          Member Information
                      </h3>
                      <TextInputForm
                          name="fullname"
                          control={control}
                          label={translate("Full Name")}
                          required
                          errors={errors}
                      />
                      <div className="grid grid-cols-3 gap-4">
                          <TextInputForm
                              name="icnumber"
                              control={control}
                              label={translate("IC No.")}
                              required
                              errors={errors}
                          />
                          <TextInputForm
                              name="phone"
                              control={control}
                              label={translate("Phone")}
                              required
                              errors={errors}
                          />
                          <TextInputForm
                              name="email"
                              control={control}
                              label={translate("Email")}
                              isEmail
                              errors={errors}
                          />
                      </div>
                      <TextInputForm
                          name="address"
                          control={control}
                          label={translate("Address")}
                          isTextArea
                      />
                  </div>
                  <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                          Status
                      </h3>
                      <div className="flex items-center gap-2">
                      <Switch
                          checked={isactive}
                          onCheckedChange={(v) => setValue('isactive', v)}
                      />
                      <Label>Active</Label>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          {translate('Cancel')}
                      </Button>
                      <Button type="submit" disabled={createDeathCharityMember.isPending || updateDeathCharityMember.isPending}>
                          <Save className="w-4 h-4 mr-2" />
                          {translate('Save')}
                      </Button>
                  </DialogFooter>
                  </form>
          </DialogContent>
      </Dialog>

      <Dialog open={coverageDialogOpen} onOpenChange={setCoverageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {translate('Manage Coverage')} – {coverageMember?.fullname}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            { isCoverSpouse && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium border-b pb-2">
                  {translate('Spouse')} ({spouses.length}/4)
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder={translate('Full Name')}
                    value={spouseForm.fullname}
                    onChange={(e) =>
                      setSpouseForm({ ...spouseForm, fullname: e.target.value })
                    }
                  />
                  <Input
                    placeholder={translate('IC No')}
                    value={spouseForm.icnumber}
                    onChange={(e) =>
                      setSpouseForm({ ...spouseForm, icnumber: e.target.value })
                    }
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSpouse}
                  disabled={spouses.length >= 4}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {translate('Add Spouse')}
                </Button>

                {spouses.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{translate('Full Name')}</TableHead>
                        <TableHead>{translate('IC No')}</TableHead>
                        <TableHead className="text-center">{translate('Action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spouses.map((s, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={s.fullname}
                              onChange={(e) => {
                                const newSpouses = [...spouses];
                                newSpouses[index].fullname = e.target.value;
                                setSpouses(newSpouses);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={s.icnumber}
                              onChange={(e) => {
                                const newSpouses = [...spouses];
                                newSpouses[index].icnumber = e.target.value;
                                setSpouses(newSpouses);
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => removeSpouse(index)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                  </Table>
                )}
              </div>
            ) }

            { isCoverChildren && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium border-b pb-2">
                  {translate('Children')} ({children.length})
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder={translate('Full Name')}
                    value={childForm.fullname}
                    onChange={(e) =>
                      setChildForm({ ...childForm, fullname: e.target.value })
                    }
                  />
                  <Input
                    placeholder={translate('IC No')}
                    value={childForm.icnumber}
                    onChange={(e) =>
                      setChildForm({ ...childForm, icnumber: e.target.value })
                    }
                  />
                </div>

                <Button variant="outline" size="sm" onClick={addChild}>
                  <Plus className="w-4 h-4 mr-2" />
                  {translate('Add Child')}
                </Button>

                {children.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{translate('Full Name')}</TableHead>
                        <TableHead>{translate('IC No')}</TableHead>
                        <TableHead className="text-center">{translate('Action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {children.map((c, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={c.fullname}
                              onChange={(e) => {
                                const newChildren = [...children];
                                newChildren[index].fullname = e.target.value;
                                setChildren(newChildren);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={c.icnumber}
                              onChange={(e) => {
                                const newChildren = [...children];
                                newChildren[index].icnumber = e.target.value;
                                setChildren(newChildren);
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => removeChild(index)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                  </Table>
                )}
              </div>
            ) }
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCoverageDialogOpen(false)}>
              {translate('Close')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSaveCoverage}
            >
              <Save className="w-4 h-4 mr-2" />
              {translate('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {translate("Claim List")}
            </DialogTitle>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Deceased Name")}</TableHead>
                <TableHead className="text-center">{translate("Relationship")}</TableHead>
                <TableHead className="text-center">{translate("Claims")}</TableHead>
                <TableHead className="text-center">
                  {translate("Action")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claimable
                .filter(
                  (item) =>
                    !selectedClaims.find(
                      (c) => c.deceasedname === item.deceasedname
                    )
                )
                .length === 0 ? (
                  <NoDataTableComponent colSpan={3} />
                ) : (
                  claimable
                    .filter(
                      (item) =>
                        !selectedClaims.find(
                          (c) => c.deceasedname === item.deceasedname
                        )
                    )
                    .map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.deceasedname}</TableCell>
                        <TableCell className="text-center capitalize">{item.relationship}</TableCell>
                        { item.dependentId ? (
                          <TableCell className="text-center">{item.claimedamount}</TableCell>
                        ) : (
                          <TableCell className="text-center">
                            Total: RM {item.totalAmount} ({item.numberOfClaims})
                            <ul>
                              {item.claims.map((c, i) => (
                                <li key={i}>
                                  {c.deceasedname}: RM {c.payoutamount}
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectClaim(item)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
            </TableBody>
          </Table>
          <div className="mt-6 space-y-4 border-t pt-4">
            <h3 className="font-semibold">
              {translate("Selected Claims")}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("Deceased Name")}</TableHead>
                  <TableHead className="text-center">
                    {translate("Relationship")}
                  </TableHead>
                  <TableHead className="text-center">
                    {translate("Payout Amount")}
                  </TableHead>
                  <TableHead className="text-center">
                    {translate("Action")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                { selectedClaims.length === 0 ? (
                  <NoDataTableComponent colSpan={4} />
                ) : (
                  selectedClaims.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.deceasedname}</TableCell>
                      <TableCell className="text-center capitalize">
                        {item.relationship}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          value={item.payoutamount}
                          onChange={(e) => {
                            const updated = [...selectedClaims];
                            updated[index].payoutamount = e.target.value;
                            setSelectedClaims(updated);
                          }}
                          className="text-center"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSelectClaim(item)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setClaimDialogOpen(false);
                setSelectedClaims([]);
              }}
            >
              {translate("Cancel")}
            </Button>

            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={selectedClaims.length === 0}
              onClick={handleSaveClaim}
            >
              <Save className="w-4 h-4 mr-2" />
              {translate("Save Claim")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate('Delete Death Charity Member')}
        description={`${translate('Delete')} "${deathCharityMemberToDelete?.name}"?`}
        onConfirm={confirmDelete}
        confirmText={translate('Delete')}
        variant="destructive"
      />
    </div>
  );
}
