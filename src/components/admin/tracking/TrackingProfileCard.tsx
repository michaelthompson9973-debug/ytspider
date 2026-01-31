import { TrackingProfile } from '@/hooks/useTrackingProfiles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, TestTube, Check, X } from 'lucide-react';

interface TrackingProfileCardProps {
  profile: TrackingProfile;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  isDeleting?: boolean;
  isTesting?: boolean;
}

export function TrackingProfileCard({
  profile,
  onEdit,
  onDelete,
  onTest,
  isDeleting,
  isTesting,
}: TrackingProfileCardProps) {
  const hasFacebook = !!profile.facebook_pixel_id;
  const hasTikTok = !!profile.tiktok_pixel_id;
  const hasGoogle = !!profile.google_gtm_id || !!profile.google_ga4_id;

  return (
    <Card className="relative">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{profile.name}</h3>
            {profile.description && (
              <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>
            )}
          </div>
          <Badge variant={profile.is_active ? 'default' : 'secondary'}>
            {profile.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Platform Status */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            {hasFacebook ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={hasFacebook ? 'text-foreground' : 'text-muted-foreground'}>
              Facebook
            </span>
            {hasFacebook && profile.facebook_test_event_code && (
              <Badge variant="outline" className="text-xs">Test Mode</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasTikTok ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={hasTikTok ? 'text-foreground' : 'text-muted-foreground'}>
              TikTok
            </span>
            {hasTikTok && profile.tiktok_test_event_code && (
              <Badge variant="outline" className="text-xs">Test Mode</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasGoogle ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={hasGoogle ? 'text-foreground' : 'text-muted-foreground'}>
              Google
            </span>
            {profile.google_gtm_id && (
              <Badge variant="outline" className="text-xs">GTM</Badge>
            )}
            {profile.google_ga4_id && (
              <Badge variant="outline" className="text-xs">GA4</Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onTest}
            disabled={isTesting || (!hasFacebook && !hasTikTok)}
          >
            <TestTube className="h-4 w-4 mr-1" />
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
