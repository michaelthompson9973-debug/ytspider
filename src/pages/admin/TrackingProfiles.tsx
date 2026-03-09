import { useState, useMemo } from 'react';
import { DynamicLayout } from '@/components/DynamicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useTrackingProfiles, TrackingProfile, TrackingProfileFormData } from '@/hooks/useTrackingProfiles';
import { TrackingProfileCard, TrackingProfileDialog } from '@/components/admin/tracking';
import { DeleteConfirmDialog } from '@/components/admin/landing-page-editor/DeleteConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TrackingProfiles() {
  const {
    profiles,
    isLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTrackingProfiles();

  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<TrackingProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [testingProfileId, setTestingProfileId] = useState<string | null>(null);

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    if (!search.trim()) return profiles;
    const searchLower = search.toLowerCase();
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
    );
  }, [profiles, search]);

  const handleCreate = () => {
    setEditingProfile(null);
    setDialogOpen(true);
  };

  const handleEdit = (profile: TrackingProfile) => {
    setEditingProfile(profile);
    setDialogOpen(true);
  };

  const handleSave = async (formData: TrackingProfileFormData) => {
    if (editingProfile) {
      await updateProfile({ id: editingProfile.id, formData });
    } else {
      await createProfile(formData);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingProfileId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingProfileId) {
      await deleteProfile(deletingProfileId);
      setDeleteDialogOpen(false);
      setDeletingProfileId(null);
    }
  };

  const handleTest = async (profile: TrackingProfile) => {
    setTestingProfileId(profile.id);
    try {
      const { data, error } = await supabase.functions.invoke('track-event', {
        body: {
          profileId: profile.id,
          eventName: 'TestEvent',
          eventData: {
            value: 100,
            currency: 'BDT',
            contentIds: ['test-product-123'],
            contentType: 'product',
          },
          userData: {
            phone: '+8801712345678',
            email: 'test@example.com',
            city: 'Dhaka',
            country: 'BD',
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Test event sent!',
          description: `Facebook: ${data.results?.facebook?.success ? '✓' : '✗'}, TikTok: ${data.results?.tiktok?.success ? '✓' : '✗'}`,
        });
      } else {
        toast({
          title: 'Test failed',
          description: data?.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Test failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setTestingProfileId(null);
    }
  };

  return (
    <DynamicicLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tracking Profiles</h1>
            <p className="text-muted-foreground">
              Manage Facebook, TikTok, and Google tracking configurations
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Profile
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Profiles Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search ? 'No profiles match your search' : 'No tracking profiles yet. Create one to get started.'}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => (
              <TrackingProfileCard
                key={profile.id}
                profile={profile}
                onEdit={() => handleEdit(profile)}
                onDelete={() => handleDelete(profile.id)}
                onTest={() => handleTest(profile)}
                isDeleting={isDeleting && deletingProfileId === profile.id}
                isTesting={testingProfileId === profile.id}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <TrackingProfileDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          profile={editingProfile}
          onSave={handleSave}
          isSaving={isCreating || isUpdating}
        />

        {/* Delete Confirmation */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Delete Tracking Profile"
          description="Are you sure you want to delete this tracking profile? Landing pages using this profile will no longer have tracking configured."
        />
      </div>
    DynamicinLayout>
  );
}
