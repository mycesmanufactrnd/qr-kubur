import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { translate } from '@/utils/translations';
import { MapPin, Plus, Edit, Trash2, Search, X, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import { showSuccess, showError } from '@/components/ToastrNotification';
import { useCrudPermissions } from '@/components/PermissionsContext';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useAdminAccess } from '@/utils/auth';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataTableComponent from '@/components/NoDataTableComponent';
import { useGetActivityPostsPaginated, useActivityPostMutations } from '@/hooks/useActivityPostMutations';
import { defaultActivityPost } from '@/utils/defaultformfields';
import TextInputForm from '@/components/forms/TextInputForm';
import CheckboxForm from '@/components/forms/CheckboxForm';
import FileUploadForm from '@/components/forms/FileUploadForm';
import RichTextEditorForm from '@/components/forms/RichTextEditorForm';

export default function ManageActivityPosts() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin, isTahfizAdmin } = useAdminAccess();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlTitle = searchParams.get('title') || '';

  const [tempTitle, setTempTitle] = useState(urlTitle);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState({ id: null });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState({ id: null, title: '' });
  const [uploading, setUploading] = useState(false);

  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('posts');

  const { activityPostsList, totalPages, isLoading } = useGetActivityPostsPaginated({
    page: urlPage,
    pageSize: itemsPerPage,
    filterTitle: urlTitle, 
  });

  const { createPost, updatePost, deletePost } = useActivityPostMutations();

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultActivityPost,
  });

  useEffect(() => {
    setTempTitle(urlTitle);
  }, [urlTitle]);

  const dashboardLabel = isTahfizAdmin ? translate('Tahfiz Dashboard') : translate('Admin Dashboard');
  const dashboardPage = isTahfizAdmin ? 'TahfizDashboard' : 'AdminDashboard';

  const handleSearch = () => {
    const params = { page: '1', title: '' };
    if (tempTitle) params.title = tempTitle;
    setSearchParams(params);
  };

  const handleReset = () => {
    setTempTitle('');
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
    const submitData = {
      ...formData,
      tahfiz: formData?.tahfiz ? { id: Number(formData.tahfiz.id) } : null,
      mosque: formData?.mosque ? { id: Number(formData.mosque.id) } : null,
    };

    try {
      if (editingPost && editingPost.id) {
        await updatePost.mutateAsync({ id: Number(editingPost.id), data: submitData });
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
      setPostToDelete({ id: null, title: '' });
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getPublisher = (post) => {
    if (!post) return '';

    const { mosque, tahfiz } = post;

    if (mosque?.name) return mosque.name;

    if (tahfiz?.name) return tahfiz.name;

    return '';
  };

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
          { label: dashboardLabel, page: dashboardPage },
          { label: translate('Manage Activity Posts'), page: 'ManageActivityPosts' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: dashboardLabel, page: dashboardPage },
        { label: translate('Manage Activity Posts'), page: 'ManageActivityPosts' }
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-600" />
          {translate('Manage Activity Posts')}
        </h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              {translate('Add Activity Posts')}
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
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700 px-6">
              {translate('Search')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} size="sm">
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
                <TableHead>{translate('Title')}</TableHead>
                <TableHead className="text-center">{translate('Publisher')}</TableHead>
                <TableHead className="text-center">{translate('Published')}</TableHead>
                <TableHead className="text-center">{translate('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <InlineLoadingComponent isTable colSpan={4} />
              ) : activityPostsList.items.length === 0 ? (
                <NoDataTableComponent colSpan={4} />
              ) : (
                activityPostsList.items.map(post => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell className="text-center">
                      {getPublisher(post)}
                    </TableCell>
                    <TableCell className="text-center">{post.ispublished ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        {canEdit && 
                          <Button variant="ghost" size="sm" 
                            onClick={() => openEditDialog(post)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        }
                        {
                          canDelete && 
                          <Button variant="ghost" size="sm" 
                            onClick={() => { 
                              setPostToDelete({
                                id: post && post.id != null ? Number(post.id) : null,
                                title: post?.title ?? '',
                              });
                              setDeleteDialogOpen(true); 
                            }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        }
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
            onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setSearchParams({ ...Object.fromEntries(searchParams), page: '1' });
            }}
            totalItems={activityPostsList.total}
          />
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? translate('Edit Activity Post') : translate('Add Activity Post')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              bucketName="activity-post"
              uploading={uploading}
              handleFileUpload={handleFileUpload}
              translate={translate}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {translate('Cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || createPost.isPending || updatePost.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {translate('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={translate('Delete Activity Post')}
        description={`${translate('Delete')} "${postToDelete?.title}"?`}
        onConfirm={confirmDelete}
        confirmText={translate('Delete')}
        variant="destructive"
      />
    </div>
  );
}