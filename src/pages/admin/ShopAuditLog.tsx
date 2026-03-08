import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Search, User, Package, FileText, ShoppingCart, Settings, Shield, RefreshCw, Palette, MessageSquare, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useActivityLog, ActionType, EntityType } from '@/hooks/useActivityLog';

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  product: Package, landing_page: FileText, order: ShoppingCart, shop_settings: Settings,
  shop_theme: Palette, security: Shield, team_member: Users, invitation: User, messenger: MessageSquare, section: FileText,
};

const actionLabels: Record<ActionType, string> = {
  create: 'Create', update: 'Update', delete: 'Delete', view: 'View', export: 'Export',
  login: 'Login', login_failed: 'Login Failed', logout: 'Logout', invite: 'Invite',
  role_change: 'Role Change', settings_change: 'Settings Change', theme_change: 'Theme Change',
};

const entityLabels: Record<EntityType, string> = {
  product: 'Product', order: 'Order', landing_page: 'Landing Page', section: 'Section',
  messenger: 'Messenger', team_member: 'Team Member', shop_settings: 'Shop Settings',
  shop_theme: 'Shop Theme', invitation: 'Invitation', security: 'Security',
};

export default function ShopAuditLog() {
  const { t } = useLanguage();
  const { currentShop } = useShop();
  const { logs, isLoading, refetch } = useActivityLog();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueEntities = [...new Set(logs.map(log => log.entity_type))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) || log.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  if (!currentShop) {
    return (<AdminLayout><div className="flex items-center justify-center h-64"><p className="text-muted-foreground">No shop selected</p></div></AdminLayout>);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><ClipboardList className="h-8 w-8 text-primary" /><div><h1 className="text-2xl font-bold">{t('sidebar.shopAuditLog')}</h1><p className="text-muted-foreground">Track all activities in your shop</p></div></div>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
        </div>
        <Card><CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <Select value={actionFilter} onValueChange={setActionFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Actions" /></SelectTrigger><SelectContent><SelectItem value="all">All Actions</SelectItem>{uniqueActions.map(action => (<SelectItem key={action} value={action}>{actionLabels[action as ActionType] || action}</SelectItem>))}</SelectContent></Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Entities" /></SelectTrigger><SelectContent><SelectItem value="all">All Entities</SelectItem>{uniqueEntities.map(entity => (<SelectItem key={entity} value={entity}>{entityLabels[entity as EntityType] || entity}</SelectItem>))}</SelectContent></Select>
          </div>
        </CardContent></Card>
        <Card>
          <CardHeader><CardTitle>Activity Log</CardTitle><CardDescription>{isLoading ? 'Loading...' : `Showing ${filteredLogs.length} activities`}</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? (<div className="space-y-4">{[1,2,3,4,5].map(i => (<div key={i} className="flex gap-4 p-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div></div>))}</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No activities found</p></div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log) => {
                  const IconComponent = entityIcons[log.entity_type] || User;
                  const isError = log.action === 'login_failed' || log.action === 'delete';
                  return (
                    <div key={log.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${isError ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}><IconComponent className="h-4 w-4" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">User {log.user_id.substring(0, 8)}...</span>
                            <Badge variant={isError ? 'destructive' : 'outline'} className="text-xs">{actionLabels[log.action as ActionType] || log.action}</Badge>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{entityLabels[log.entity_type as EntityType] || log.entity_type}</span>
                          </div>
                          {(log.old_data || log.new_data) && (
                            <div className="mt-2 text-xs bg-muted/50 p-2 rounded">
                              {log.old_data && <div className="text-red-600 dark:text-red-400">- {JSON.stringify(log.old_data)}</div>}
                              {log.new_data && <div className="text-green-600 dark:text-green-400">+ {JSON.stringify(log.new_data)}</div>}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {log.user_agent && (<><span>🖥️ {log.user_agent.substring(0, 50)}...</span><span>•</span></>)}
                            <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}