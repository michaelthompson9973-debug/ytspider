import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useShop, ShopRole } from '@/contexts/ShopContext';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ShopMember {
  id: string;
  shop_id: string;
  user_id: string;
  role: ShopRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

const roleLabels: Record<ShopRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const roleDescriptions: Record<ShopRole, string> = {
  owner: 'সম্পূর্ণ নিয়ন্ত্রণ, শপ ডিলিট করতে পারবে',
  admin: 'টিম ম্যানেজ করতে পারবে, সেটিংস পরিবর্তন করতে পারবে',
  editor: 'কনটেন্ট এডিট করতে পারবে, অর্ডার ম্যানেজ করতে পারবে',
  viewer: 'শুধুমাত্র দেখতে পারবে',
};

const roleIcons: Record<ShopRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  editor: <Edit className="h-4 w-4" />,
  viewer: <Eye className="h-4 w-4" />,
};

const roleBadgeVariants: Record<ShopRole, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  editor: 'outline',
  viewer: 'outline',
};

export default function TeamMembers() {
  const { currentShop, userRole } = useShop();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ShopRole>('editor');

  const canManageTeam = userRole === 'owner' || userRole === 'admin';

  // Fetch team members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['shop-members', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      
      const { data, error } = await supabase
        .from('shop_members')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('role');

      if (error) throw error;
      return data as ShopMember[];
    },
    enabled: !!currentShop,
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('shop_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-members', currentShop?.id] });
      toast.success('মেম্বার রিমুভ করা হয়েছে');
    },
    onError: () => {
      toast.error('মেম্বার রিমুভ করতে সমস্যা হয়েছে');
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: ShopRole }) => {
      const { error } = await supabase
        .from('shop_members')
        .update({ role: newRole })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-members', currentShop?.id] });
      toast.success('রোল আপডেট করা হয়েছে');
    },
    onError: () => {
      toast.error('রোল আপডেট করতে সমস্যা হয়েছে');
    },
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email invitation system
    toast.info('ইমেইল ইনভাইটেশন সিস্টেম শীঘ্রই আসছে');
    setInviteDialogOpen(false);
    setInviteEmail('');
  };

  const getInitials = (userId: string) => {
    return userId.substring(0, 2).toUpperCase();
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(['owner', 'admin', 'editor', 'viewer'] as ShopRole[]).map((role) => (
            <Card key={role} className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {roleIcons[role]}
                  <span className="font-medium">{roleLabels[role]}</span>
                </div>
                <p className="text-xs text-muted-foreground">{roleDescriptions[role]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

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
                              {getInitials(member.user_id)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              User {member.user_id.substring(0, 8)}...
                            </p>
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
                              <DropdownMenuItem
                                onClick={() => updateRoleMutation.mutate({ 
                                  memberId: member.id, 
                                  newRole: 'admin' 
                                })}
                                disabled={member.role === 'admin'}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Admin বানান
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateRoleMutation.mutate({ 
                                  memberId: member.id, 
                                  newRole: 'editor' 
                                })}
                                disabled={member.role === 'editor'}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editor বানান
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateRoleMutation.mutate({ 
                                  memberId: member.id, 
                                  newRole: 'viewer' 
                                })}
                                disabled={member.role === 'viewer'}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Viewer বানান
                              </DropdownMenuItem>
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
                নতুন টিম মেম্বারকে ইমেইলে ইনভাইট পাঠান
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
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as ShopRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - টিম ম্যানেজ করতে পারবে</SelectItem>
                    <SelectItem value="editor">Editor - কনটেন্ট এডিট করতে পারবে</SelectItem>
                    <SelectItem value="viewer">Viewer - শুধু দেখতে পারবে</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit">
                <Mail className="h-4 w-4 mr-2" />
                ইনভাইট পাঠান
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
