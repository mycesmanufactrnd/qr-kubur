// @ts-nocheck
import { useIsNarrow } from "@/hooks/useIsNarrow";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import MobileManageActivityPosts from "@/pages/Mobile/ManageActivityPosts";
import { translate } from "@/utils/translations";
import { MapPin, Plus, Edit, Trash2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/forms/SearchBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Breadcrumb from "@/components/Breadcrumb";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import { showSuccess, showError } from "@/components/ToastrNotification";
import { useCrudPermissions } from "@/components/PermissionsContext";
import PageLoadingComponent from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { useAdminAccess } from "@/utils/auth";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import NoDataTableComponent from "@/components/NoDataTableComponent";
import {
  useGetActivityPostsPaginated,
  useActivityPostMutations,
} from "@/mutations/useActivityPostMutations";
import { useGetMosquesByOrganisationId } from "@/mutations/useMosqueMutations";
import { defaultActivityPost } from "@/utils/defaultformfields";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import SelectForm from "@/components/forms/SelectForm";
import CheckboxForm from "@/components/forms/CheckboxForm";
import FileUploadForm from "@/components/forms/FileUploadForm";
import RichTextEditorForm from "@/components/forms/RichTextEditorForm";
import { appendCurrentUserToFormData, resolveFileUrl } from "@/utils";


export default function ManageActivityPosts() {
  const isNarrow = useIsNarrow();
  if (isNarrow) return <MobileManageActivityPosts />;
  return <ManageActivityPostsDesktop />;
}

function ManageActivityPostsDesktop() {
  const {
    currentUser,
    loadingUser,
    hasAdminAccess,
    isTahfizAdmin,
    isOrganisationAdmin,
  } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlTitle = searchParams.get("title") || "";
  const urlMosqueId = searchParams.get("mosqueId")
    ? parseInt(searchParams.get("mosqueId"))
    : null;
  const urlIsPublished =
    searchParams.get("isPublished") === "true"
      ? true
      : searchParams.get("isPublished") === "false"
        ? false
        : null;

  const [tempTitle, setTempTitle] = useState(urlTitle);
  const [tempMosqueId, setTempMosqueId] = useState(urlMosqueId);
  const [tempIsPublished, setTempIsPublished] = useState(urlIsPublished);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState({ id: null });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState({ id: null, title: "" });
  const [uploading, setUploading] = useState(false);

  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("posts");

  const { activityPostsList, totalPages, isLoading } =
    useGetActivityPostsPaginated({
      page: urlPage,
      pageSize: itemsPerPage,
      filterTitle: urlTitle,
      filterMosqueId: urlMosqueId,
      filterIsPublished: urlIsPublished,
    });

  const { data: organisationMosques = [], isLoading: isMosquesLoading } =
    useGetMosquesByOrganisationId(
      isOrganisationAdmin ? (currentUser?.organisation?.id ?? null) : null,
    );

  const { createPost, updatePost, deletePost } = useActivityPostMutations();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultActivityPost,
  });

  useEffect(() => {
    setTempTitle(urlTitle);
    setTempMosqueId(urlMosqueId);
    setTempIsPublished(urlIsPublished);
  }, [urlTitle, urlMosqueId, urlIsPublished]);

  const handleSearch = () => {
    const params = { page: "1" };
    if (tempTitle) params.title = tempTitle;
    if (tempMosqueId) params.mosqueId = tempMosqueId.toString();
    if (tempIsPublished !== null) params.isPublished = String(tempIsPublished);
    setSearchParams(params);
  };

  const handleReset = () => {
    setTempTitle("");
    setTempMosqueId(null);
    setTempIsPublished(null);
    setSearchParams({});
  };

  const openAddDialog = () => {
    setEditingPost({ id: null });
    reset(defaultActivityPost);
    setIsDialogOpen(true);
  };

  const openEditDialog = (activityPost) => {
    setEditingPost({ id: activityPost.id ?? null });
    reset({
      ...activityPost,
      tahfiz: activityPost?.tahfiz?.id ?? null,
      mosque: activityPost?.mosque?.id ?? null,
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      appendCurrentUserToFormData(formDataUpload);

      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || "Failed to upload photo");
        return null;
      }

      const data = await res.json();
      showSuccess("Photo uploaded");

      return data.file_url;
    } catch (err) {
      console.error(err);
      showError("Failed to upload photo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (formData) => {
    let tahfizCenterId = null;
    let mosqueId = null;

    if (isTahfizAdmin && currentUser?.tahfizcenter) {
      tahfizCenterId = currentUser.tahfizcenter.id;
    }

    if (isOrganisationAdmin) {
      mosqueId = formData?.mosque ? Number(formData.mosque) : null;
    } else if (formData?.mosque) {
      mosqueId =
        typeof formData.mosque === "object"
          ? Number(formData.mosque.id)
          : Number(formData.mosque);
    }

    const submitData = {
      ...formData,
      tahfiz: tahfizCenterId ? { id: Number(tahfizCenterId) } : null,
      mosque: mosqueId ? { id: mosqueId } : null,
    };

    try {
      if (editingPost && editingPost.id) {
        await updatePost.mutateAsync({
          id: Number(editingPost.id),
          data: submitData,
        });
      } else {
        await createPost.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (!postToDelete?.id) return;

    try {
      await deletePost.mutateAsync(Number(postToDelete.id));
      setDeleteDialogOpen(false);
      setPostToDelete({ id: null, title: "" });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const getPublisher = (post) => {
    if (!post) return "";

    const { mosque, tahfiz } = post;

    if (mosque?.name) return mosque.name;

    if (tahfiz?.name) return tahfiz.name;

    return "";
  };

  if (loadingUser || permissionsLoading) {
    return <PageLoadingComponent />;
  }

  if (!hasAdminAccess) {
    return <AccessDeniedComponent />;
  }

  const dashboardLabel = isTahfizAdmin
    ? translate("Tahfiz Dashboard")
    : translate("Admin Dashboard");
  const dashboardPage = isTahfizAdmin ? "TahfizDashboard" : "AdminDashboard";

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: dashboardLabel, page: dashboardPage },
            {
              label: translate("Manage Activity Posts"),
              page: "ManageActivityPosts",
            },
          ]}
        />
        <AccessDeniedComponent />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: dashboardLabel, page: dashboardPage },
          {
            label: translate("Manage Activity Posts"),
            page: "ManageActivityPosts",
          },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate("Manage Activity Posts")}
        </h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button
              onClick={openAddDialog}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {translate("Add Activity Posts")}
            </Button>
          )}
        </div>
      </div>

      <SearchBar
        onSearch={handleSearch}
        onReset={handleReset}
        filters={[
          {
            type: "text",
            key: "title",
            value: tempTitle,
            onChange: setTempTitle,
            label: translate("Title"),
          },
          {
            type: "select2",
            key: "mosque",
            value: tempMosqueId != null ? String(tempMosqueId) : "",
            onChange: (v) => setTempMosqueId(v ? Number(v) : null),
            label: translate("Mosque"),
            searchPlaceholder: translate("Search mosque..."),
            emptyMessage: translate("No mosque found."),
            options: organisationMosques.map((m) => ({
              value: String(m.id),
              label: m.name,
            })),
            show: isOrganisationAdmin,
          },
          {
            type: "select",
            key: "isPublished",
            value: String(tempIsPublished),
            onChange: (v) => setTempIsPublished(v === "true"),
            label: translate("Status"),
            options: [
              { value: "true", label: translate("Published") },
              { value: "false", label: translate("Draft") },
            ],
          },
        ]}
      />

      <Card className="border-0 shadow-md dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translate("Title")}</TableHead>
                <TableHead className="text-center">
                  {translate("Publisher")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Published")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Image")}
                </TableHead>
                <TableHead className="text-center">
                  {translate("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={5} />
              ) : activityPostsList.items.length === 0 ? (
                <NoDataTableComponent colSpan={5} />
              ) : (
                activityPostsList.items.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell className="text-center">
                      {getPublisher(post)}
                    </TableCell>
                    <TableCell className="text-center">
                      {post.ispublished ? translate("Yes") : translate("No")}
                    </TableCell>
                    <TableCell>
                      {post.photourl ? (
                        <img
                          src={resolveFileUrl(post.photourl, "bucket-activity-storage")}
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.style.opacity = "0.3"; }}
                          alt="photo"
                          className="w-12 h-10 object-cover rounded mx-auto"
                        />
                      ) : (
                        <div className="w-12 h-10 rounded mx-auto bg-slate-100 dark:bg-slate-700" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(post)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPostToDelete({
                                id:
                                  post && post.id != null
                                    ? Number(post.id)
                                    : null,
                                title: post?.title ?? "",
                              });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {totalPages > 0 && (
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={(p) =>
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: p.toString(),
              })
            }
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({
                ...Object.fromEntries(searchParams),
                page: "1",
              });
            }}
            totalItems={activityPostsList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editingPost
                ? translate("Edit Activity Post")
                : translate("Add Activity Post")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isOrganisationAdmin && (
              <>
                <SelectForm
                  name="mosque"
                  control={control}
                  label={translate("Mosque")}
                  placeholder={
                    isMosquesLoading
                      ? translate("Loading...")
                      : organisationMosques.length === 0
                        ? translate("No mosque registered")
                        : translate("Select Mosque")
                  }
                  options={organisationMosques.map((mosque) => ({
                    value: mosque.id,
                    label: mosque.name,
                  }))}
                  required={organisationMosques.length > 0}
                  errors={errors}
                  disabled={isMosquesLoading || organisationMosques.length === 0}
                />
                {!isMosquesLoading && organisationMosques.length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
                    {translate("No mosque is registered under your organisation. You can still publish this post without one.")}
                  </p>
                )}
              </>
            )}
            <TextInputForm
              name="title"
              control={control}
              label={translate("Title")}
              required
              errors={errors}
            />
            <RichTextEditorForm
              name="content"
              control={control}
              label={translate("Content")}
              required
              errors={errors}
              translate={translate}
            />
            <CheckboxForm
              name="ispublished"
              control={control}
              label={translate("Published")}
            />
            <FileUploadForm
              name="photourl"
              control={control}
              label={translate("Photo")}
              bucketName="bucket-activity-storage"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              translate={translate}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {translate("Close")}
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || createPost.isPending || updatePost.isPending
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {translate("Save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate("Delete Activity Post")}
        description={`${translate("Delete")} "${postToDelete?.title}"?`}
        onConfirm={confirmDelete}
        confirmText={translate("Delete")}
        variant="destructive"
      />
    </div>
  );
}
