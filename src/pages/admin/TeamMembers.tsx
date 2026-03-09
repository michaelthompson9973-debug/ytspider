import { useState } from 'react';
import { DynamicLayout } from '@/components/DynamicLayout';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Crown,
  Headphones,
  MoreVertical,
  Loader2,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';

interface StaffMember {
  role_id: string;
  user_id: string;
  role: string;
  granted_at: string;
  user_name: string | null;
  user_email: string | null;
  avatar_url: string | null;
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; variant: 'default' | 'secondary' | 'outline'; description: string }> = {
  super_admin: {
    label: 'Founder',
    icon: Crown,
    variant: 'default',
    description: 'Immutable platform owner with full control',
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    variant: 'secondary',
    description: 'Full platform management (cannot modify founder)',
  },
  support: {
    label: 'Support',
    icon: Headphones,
    variant: 'outline',
    description: 'Read-only access for customer support operations',
  },
};

export default function TeamMembers() {
  const { isSuperAdmin, platformRole, user } = useAuth();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('support');
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);

  // Fetch platform staff
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['platform-staff'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_platform_staff');
      if (error) throw error;
      return data as StaffMember[];
    },
  });

  // Add staff mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('add_platform_staff', {
        _email: addEmail,
        _role: addRole,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to add staff');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-staff'] });
      toast.success('Staff member added successfully');
      setAddDialogOpen(false);
      setAddEmail('');
      setAddRole('support');
    },
    onError: (err) => toast.error((err as Error).message),
  });

  // Remove staff mutation
  const removeMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { data, error } = await supabase.rpc('remove_platform_staff', {
        _role_id: roleId,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to remove staff');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-staff'] });
      toast.success('Staff member removed');
      setRemoveTarget(null);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ roleId, newRole }: { roleId: string; newRole: string }) => {
      const { data, error } = await supabase.rpc('change_platform_staff_role', {
        _role_id: roleId,
        _new_role: newRole,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to change role');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-staff'] });
      toast.success('Role updated');
    },
    onError: (err) => toast.error((err as Error).message),
  });

  // Determine assignable roles based on caller's role
  const assignableRoles = isSuperAdmin
    ? ['admin', 'support']
    : platformRole === 'admin'
      ? ['support']
      : [];

  const canManageStaff = isSuperAdmin || platformRole === 'admin';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Platform Staff
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage internal platform team members and access control
            </p>
          </div>
          {canManageStaff && (
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Staff Member
            </Button>
          )}
        </div>

        {/* Role Legend */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const count = staff.filter((s) => s.role === key).length;
            return (
              <Card key={key} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{cfg.label}</span>
                    </div>
                    <Badge variant={cfg.variant} className="font-digit">{count}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Members
            </CardTitle>
            <CardDescription>
              {staff.length} platform staff member{staff.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No platform staff found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Platform Role</TableHead>
                    <TableHead>Granted</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => {
                    const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.support;
                    const Icon = cfg.icon;
                    const isFounder = member.role === 'super_admin';
                    const isSelf = member.user_id === user?.id;

                    return (
                      <TableRow key={member.role_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {member.user_name
                                  ? member.user_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                                  : member.user_email?.substring(0, 2).toUpperCase() || '??'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {member.user_name || member.user_email || 'Unknown'}
                                {isSelf && (
                                  <span className="text-xs text-muted-foreground ml-2">(You)</span>
                                )}
                              </p>
                              {member.user_name && member.user_email && (
                                <p className="text-xs text-muted-foreground">{member.user_email}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="gap-1">
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                          {isFounder && (
                            <span className="ml-2 text-xs text-muted-foreground">(Protected)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-digit">
                          {new Date(member.granted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {canManageStaff && !isFounder && !isSelf && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {/* Role change options */}
                                {assignableRoles
                                  .filter((r) => r !== member.role)
                                  .map((role) => {
                                    const rc = ROLE_CONFIG[role];
                                    const RIcon = rc?.icon || Shield;
                                    return (
                                      <DropdownMenuItem
                                        key={role}
                                        onClick={() =>
                                          changeRoleMutation.mutate({
                                            roleId: member.role_id,
                                            newRole: role,
                                          })
                                        }
                                      >
                                        <ArrowUpDown className="h-4 w-4 mr-2" />
                                        Change to {rc?.label || role}
                                      </DropdownMenuItem>
                                    );
                                  })}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setRemoveTarget(member)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Access
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {isFounder && (
                            <Crown className="h-4 w-4 text-primary mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Add Platform Staff
              </DialogTitle>
              <DialogDescription>
                The user must have an existing account. They will gain platform access immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="staff-email">Email Address</Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="user@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Platform Role</Label>
                <Select value={addRole} onValueChange={setAddRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => {
                      const cfg = ROLE_CONFIG[role];
                      const Icon = cfg?.icon || Shield;
                      return (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{cfg?.label || role}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {ROLE_CONFIG[addRole] && (
                  <p className="text-xs text-muted-foreground">
                    {ROLE_CONFIG[addRole].description}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending || !addEmail}>
                {addMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Staff Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Platform Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{removeTarget?.user_name || removeTarget?.user_email}</strong> from
              platform staff. They will lose all admin access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.role_id)}
            >
              {removeMutation.isPending ? 'Removing...' : 'Remove Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
