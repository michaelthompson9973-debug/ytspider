import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useShop } from '@/contexts/ShopContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Loader2, 
  MoreVertical,
  Trash2,
  Shield,
  Crown,
  Edit,
  Eye,
  Briefcase,
  Headphones,
  Clock,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useShopInvitations, ShopInvitation } from '@/hooks/useShopInvitations';
import { useShopPermissions, ExtendedShopRole, roleLabels, roleDescriptions } from '@/hooks/useShopPermissions';
import { useActivityLog } from '@/hooks/useActivityLog';
import { formatDistanceToNow } from 'date-fns';

interface ShopMember {
  id: string;
  shop_id: string;
  user_id: string;
  role: ExtendedShopRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

const roleIcons: Record<ExtendedShopRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  manager: <Briefcase className="h-4 w-4" />,
  editor: <Edit className="h-4 w-4" />,
  support: <Headphones className="h-4 w-4" />,
  viewer: <Eye className="h-4 w-4" />,
};

const roleBadgeVariants: Record<ExtendedShopRole, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  manager: 'secondary',
  editor: 'outline',
  support: 'outline',
  viewer: 'outline',
};

const assignableRoles: ExtendedShopRole[] = ['admin', 'manager', 'editor', 'support', 'viewer'];

export default function TeamMembers() {
  const { currentShop } = useShop();
  const { hasPermission } = useShopPermissions();
  const { logActivity } = useActivityLog();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ExtendedShopRole>('editor');

  const canManageTeam = hasPermission('team.manage');

  const { 
    invitations, 
    isLoading: invitationsLoading, 
    createInvitation, 
    isCreating,
    cancelInvitation,
    resendInvitation,
  } = useShopInvitations();

  // Fetch team members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['shop-members', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      
      const { data: membersData, error: membersError } = await supabase
        .from('shop_members')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('role');

      if (membersError) throw membersError;
      
      // Fetch profiles for all members
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);

      // Map profiles to members
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      return membersData.map(member => ({
        ...member,
        profile: profilesMap.get(member.user_id) || null,
      })) as (ShopMember & { 
        profile: { id: string; email: string; full_name: string | null; avatar_url: string | null } | null 
      })[];
    },
    enabled: !!currentShop,
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const member = members.find(m => m.id === memberId);
      const { error } = await supabase
        .from('shop_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      return member;
    },
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: ['shop-members', currentShop?.id] });
      toast.success('মেম্বার রিমুভ করা হয়েছে');
      if (member) {
        logActivity({
          action: 'delete',
          entityType: 'team_member',
          entityId: member.id,
          oldData: { user_id: member.user_id, role: member.role },
        });
      }
    },
    onError: () => {
      toast.error('মেম্বার রিমুভ করতে সমস্যা হয়েছে');
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: ExtendedShopRole }) => {
      const member = members.find(m => m.id === memberId);
      const oldRole = member?.role;
      
      const { error } = await supabase
        .from('shop_members')
        .update({ role: newRole })
        .eq('id', memberId);
      
      if (error) throw error;
      return { member, oldRole, newRole };
    },
    onSuccess: ({ member, oldRole, newRole }) => {
      queryClient.invalidateQueries({ queryKey: ['shop-members', currentShop?.id] });
      toast.success('রোল আপডেট করা হয়েছে');
      if (member) {
        logActivity({
          action: 'role_change',
          entityType: 'team_member',
          entityId: member.id,
          oldData: { role: oldRole },
          newData: { role: newRole },
        });
      }
    },
    onError: () => {
      toast.error('রোল আপডেট করতে সমস্যা হয়েছে');
    },
  });

  const buildInviteUrl = (token: string) => {
    const origin = window.location.origin.replace(/\/$/, '');
    return `${origin}/accept-invite?token=${token}`;
  };

  const copyInviteLink = async (token: string) => {
    const url = buildInviteUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('ইনভাইট লিংক কপি হয়েছে');
    } catch {
      toast('ইনভাইট লিংক', { description: url });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createInvitation({ email: inviteEmail, role: inviteRole });

      if (result.emailSent) {
        toast.success('ইনভাইট পাঠানো হয়েছে');
      } else {
        toast('ইমেইল পাঠানো যায়নি', {
          description: 'ইনভাইট লিংক কপি করে ম্যানুয়ালি পাঠাতে পারেন',
          action: {
            label: 'কপি লিংক',
            onClick: () => void copyInviteLink(result.invitation.token),
          },
        });
      }

      logActivity({
        action: 'invite',
        entityType: 'invitation',
        newData: { email: inviteEmail, role: inviteRole },
      });

      setInviteDialogOpen(false);
      setInviteEmail('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ইনভাইট পাঠাতে সমস্যা হয়েছে');
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      await cancelInvitation(id);
      toast.success('ইনভাইট বাতিল হয়েছে');
    } catch {
      toast.error('ইনভাইট বাতিল করতে সমস্যা হয়েছে');
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      const result = await resendInvitation(id);

      if (result.emailSent) {
        toast.success('ইনভাইট আবার পাঠানো হয়েছে');
      } else {
        toast('ইমেইল পাঠানো যায়নি', {
          description: 'ইনভাইট লিংক কপি করে ম্যানুয়ালি পাঠাতে পারেন',
          action: {
            label: 'কপি লিংক',
            onClick: () => void copyInviteLink(result.token),
          },
        });
      }
    } catch {
      toast.error('ইনভাইট পাঠাতে সমস্যা হয়েছে');
    }
  };


  if (!currentShop) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground">কোনো শপ সিলেক্ট করা হয়নি</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6" />
              টিম মেম্বার
            </h1>
            <p className="text-muted-foreground text-sm">
              {currentShop.name} এর টিম মেম্বার ম্যানেজ করুন
            </p>
          </div>

          {canManageTeam && (
            <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              মেম্বার যোগ করুন
            </Button>
          )}
        </div>

        {/* Role Legend */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {(['owner', 'admin', 'manager', 'editor', 'support', 'viewer'] as ExtendedShopRole[]).map((role) => (
            <Card key={role} className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {roleIcons[role]}
                  <span className="font-medium text-sm">{roleLabels[role]}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{roleDescriptions[role]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Invitations */}
        {canManageTeam && invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                পেন্ডিং ইনভাইট
              </CardTitle>
              <CardDescription>
                {invitations.length} টি ইনভাইট গ্রহণের অপেক্ষায়
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {roleLabels[invite.role]} • মেয়াদ: {formatDistanceToNow(new Date(invite.expires_at))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResendInvite(invite.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>মেম্বার তালিকা</CardTitle>
            <CardDescription>
              {members.length} জন মেম্বার এই শপে এক্সেস আছে
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                কোনো মেম্বার নেই
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>মেম্বার</TableHead>
                    <TableHead>রোল</TableHead>
                    <TableHead>যোগ হয়েছে</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {member.profile?.full_name 
                                ? member.profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                : member.profile?.email?.substring(0, 2).toUpperCase() 
                                || member.user_id.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {member.profile?.full_name || member.profile?.email || `User ${member.user_id.substring(0, 8)}...`}
                            </p>
                            {member.profile?.email && member.profile?.full_name && (
                              <p className="text-xs text-muted-foreground">{member.profile.email}</p>
                            )}
                            {!member.accepted_at && (
                              <p className="text-xs text-muted-foreground">পেন্ডিং ইনভাইট</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariants[member.role]} className="gap-1">
                          {roleIcons[member.role]}
                          {roleLabels[member.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(member.invited_at).toLocaleDateString('bn-BD')}
                      </TableCell>
                      <TableCell>
                        {canManageTeam && member.role !== 'owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {assignableRoles.map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => updateRoleMutation.mutate({ 
                                    memberId: member.id, 
                                    newRole: role 
                                  })}
                                  disabled={member.role === role}
                                >
                                  {roleIcons[role]}
                                  <span className="ml-2">{roleLabels[role]}</span>
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => removeMemberMutation.mutate(member.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                রিমুভ করুন
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <form onSubmit={handleInvite}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                মেম্বার ইনভাইট করুন
              </DialogTitle>
              <DialogDescription>
                নতুন টিম মেম্বারকে ইনভাইট লিংক তৈরি করুন (৭ দিনের মেয়াদ)
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">রোল</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as ExtendedShopRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          {roleIcons[role]}
                          <span>{roleLabels[role]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {roleDescriptions[inviteRole]}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Mail className="h-4 w-4 mr-2" />
                ইনভাইট তৈরি করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
