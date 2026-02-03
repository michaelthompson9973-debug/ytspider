import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardList, Search, User, Package, FileText, ShoppingCart, Settings, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  product: Package,
  landing_page: FileText,
  order: ShoppingCart,
  settings: Settings,
  security: Shield,
  user: User,
};

const mockAuditLogs = [
  {
    id: '1',
    user: 'admin@shop.com',
    action: 'update',
    entity: 'product',
    entityName: 'Premium Winter Jacket',
    details: 'Updated price from ৳1,500 to ৳1,299',
    location: 'Dhaka, Bangladesh',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'success',
  },
  {
    id: '2',
    user: 'editor@shop.com',
    action: 'create',
    entity: 'landing_page',
    entityName: 'Winter Sale Campaign',
    details: 'Created new landing page',
    location: 'Chittagong, Bangladesh',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'success',
  },
  {
    id: '3',
    user: 'admin@shop.com',
    action: 'update',
    entity: 'order',
    entityName: 'Order #1234',
    details: 'Changed status from "pending" to "shipped"',
    location: 'Dhaka, Bangladesh',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'success',
  },
  {
    id: '4',
    user: 'unknown@email.com',
    action: 'login_failed',
    entity: 'security',
    entityName: 'Authentication',
    details: 'Failed login attempt - invalid password',
    location: 'Unknown',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    status: 'failed',
  },
  {
    id: '5',
    user: 'admin@shop.com',
    action: 'delete',
    entity: 'product',
    entityName: 'Old Product',
    details: 'Deleted product from catalog',
    location: 'Dhaka, Bangladesh',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'success',
  },
  {
    id: '6',
    user: 'viewer@shop.com',
    action: 'export',
    entity: 'order',
    entityName: 'Orders Export',
    details: 'Exported 150 orders to CSV',
    location: 'Sylhet, Bangladesh',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'success',
  },
];

export default function ShopAuditLog() {
  const { t } = useLanguage();
  const { currentShop } = useShop();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const uniqueUsers = [...new Set(mockAuditLogs.map(log => log.user))];

  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesUser = userFilter === 'all' || log.user === userFilter;
    return matchesSearch && matchesAction && matchesUser;
  });

  if (!currentShop) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No shop selected</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('sidebar.shopAuditLog')}</h1>
            <p className="text-muted-foreground">Track all activities in your shop</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="login_failed">Failed Login</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} of {mockAuditLogs.length} activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {filteredLogs.map((log) => {
                const IconComponent = actionIcons[log.entity] || User;
                return (
                  <div key={log.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{log.user}</span>
                          <Badge variant={log.status === 'success' ? 'outline' : 'destructive'} className="text-xs">
                            {log.action.replace('_', ' ')}
                          </Badge>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{log.entityName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>📍 {log.location}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(log.timestamp, { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredLogs.length > 0 && (
              <div className="mt-6 text-center">
                <Button variant="outline">Load More</Button>
              </div>
            )}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activities found matching your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
