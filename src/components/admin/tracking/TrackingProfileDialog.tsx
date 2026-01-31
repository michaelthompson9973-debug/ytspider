import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlatformSection } from './PlatformSection';
import { TrackingProfile, TrackingProfileFormData } from '@/hooks/useTrackingProfiles';

// Platform icons as simple colored circles
const FacebookIcon = () => (
  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
    <span className="text-white text-xs font-bold">f</span>
  </div>
);

const TikTokIcon = () => (
  <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
    <span className="text-white text-xs font-bold">T</span>
  </div>
);

const GoogleIcon = () => (
  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 flex items-center justify-center">
    <span className="text-white text-xs font-bold">G</span>
  </div>
);

interface TrackingProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: TrackingProfile | null;
  onSave: (formData: TrackingProfileFormData) => Promise<void>;
  isSaving: boolean;
}

const defaultFormData: TrackingProfileFormData = {
  name: '',
  description: '',
  facebook_pixel_id: '',
  facebook_access_token: '',
  facebook_test_event_code: '',
  tiktok_pixel_id: '',
  tiktok_access_token: '',
  tiktok_test_event_code: '',
  google_gtm_id: '',
  google_ga4_id: '',
  google_ga4_secret: '',
  is_active: true,
};

export function TrackingProfileDialog({
  open,
  onOpenChange,
  profile,
  onSave,
  isSaving,
}: TrackingProfileDialogProps) {
  const [formData, setFormData] = useState<TrackingProfileFormData>(defaultFormData);
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [tiktokEnabled, setTiktokEnabled] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        description: profile.description || '',
        facebook_pixel_id: profile.facebook_pixel_id || '',
        facebook_access_token: profile.facebook_access_token || '',
        facebook_test_event_code: profile.facebook_test_event_code || '',
        tiktok_pixel_id: profile.tiktok_pixel_id || '',
        tiktok_access_token: profile.tiktok_access_token || '',
        tiktok_test_event_code: profile.tiktok_test_event_code || '',
        google_gtm_id: profile.google_gtm_id || '',
        google_ga4_id: profile.google_ga4_id || '',
        google_ga4_secret: profile.google_ga4_secret || '',
        is_active: profile.is_active,
      });
      setFacebookEnabled(!!profile.facebook_pixel_id);
      setTiktokEnabled(!!profile.tiktok_pixel_id);
      setGoogleEnabled(!!profile.google_gtm_id || !!profile.google_ga4_id);
    } else {
      setFormData(defaultFormData);
      setFacebookEnabled(false);
      setTiktokEnabled(false);
      setGoogleEnabled(false);
    }
  }, [profile, open]);

  const updateField = (key: keyof TrackingProfileFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    await onSave(formData);
    onOpenChange(false);
  };

  const facebookValues = {
    facebook_pixel_id: formData.facebook_pixel_id || '',
    facebook_access_token: formData.facebook_access_token || '',
    facebook_test_event_code: formData.facebook_test_event_code || '',
  };

  const tiktokValues = {
    tiktok_pixel_id: formData.tiktok_pixel_id || '',
    tiktok_access_token: formData.tiktok_access_token || '',
    tiktok_test_event_code: formData.tiktok_test_event_code || '',
  };

  const googleValues = {
    google_gtm_id: formData.google_gtm_id || '',
    google_ga4_id: formData.google_ga4_id || '',
    google_ga4_secret: formData.google_ga4_secret || '',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{profile ? 'Edit Tracking Profile' : 'Create Tracking Profile'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Profile Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Campaign"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this profile..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Platform Sections */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Tracking Platforms</h3>

            <PlatformSection
              title="Facebook Pixel"
              icon={<FacebookIcon />}
              enabled={facebookEnabled}
              onEnabledChange={setFacebookEnabled}
              defaultOpen={!!profile?.facebook_pixel_id}
              fields={[
                { key: 'facebook_pixel_id', label: 'Pixel ID', placeholder: '123456789012345' },
                { key: 'facebook_access_token', label: 'Access Token (CAPI)', placeholder: 'EAAxxxxxxxxx...', isSecret: true },
                { key: 'facebook_test_event_code', label: 'Test Event Code', placeholder: 'TEST12345', optional: true },
              ]}
              values={facebookValues}
              onValueChange={(key, value) => updateField(key as keyof TrackingProfileFormData, value)}
            />

            <PlatformSection
              title="TikTok Pixel"
              icon={<TikTokIcon />}
              enabled={tiktokEnabled}
              onEnabledChange={setTiktokEnabled}
              defaultOpen={!!profile?.tiktok_pixel_id}
              fields={[
                { key: 'tiktok_pixel_id', label: 'Pixel ID', placeholder: 'XXXXXXXXXXXXXXXX' },
                { key: 'tiktok_access_token', label: 'Access Token', placeholder: 'xxxxxxxxxxxxxxxx', isSecret: true },
                { key: 'tiktok_test_event_code', label: 'Test Event Code', placeholder: 'TEST12345', optional: true },
              ]}
              values={tiktokValues}
              onValueChange={(key, value) => updateField(key as keyof TrackingProfileFormData, value)}
            />

            <PlatformSection
              title="Google Analytics"
              icon={<GoogleIcon />}
              enabled={googleEnabled}
              onEnabledChange={setGoogleEnabled}
              defaultOpen={!!profile?.google_gtm_id || !!profile?.google_ga4_id}
              fields={[
                { key: 'google_gtm_id', label: 'GTM Container ID', placeholder: 'GTM-XXXXXXX', optional: true },
                { key: 'google_ga4_id', label: 'GA4 Measurement ID', placeholder: 'G-XXXXXXXXXX', optional: true },
                { key: 'google_ga4_secret', label: 'GA4 API Secret', placeholder: 'xxxxxxxxxxxxxxxx', isSecret: true, optional: true },
              ]}
              values={googleValues}
              onValueChange={(key, value) => updateField(key as keyof TrackingProfileFormData, value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !formData.name.trim()}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
