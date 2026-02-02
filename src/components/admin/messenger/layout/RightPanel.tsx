import { MessengerConversation, ControlPanelTab } from '../types';
import { useCustomerProfile, useCustomerLabels, useCustomerOrders } from '../hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Tag, 
  ShoppingCart, 
  BarChart3, 
  Bot, 
  History,
  Phone,
  Mail,
  MapPin,
  Star,
  AlertTriangle,
  Check,
  Plus,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

interface RightPanelProps {
  conversation: MessengerConversation | undefined;
  activeTab: ControlPanelTab;
  onTabChange: (tab: ControlPanelTab) => void;
}

const tabs: { value: ControlPanelTab; label: string; icon: React.ElementType }[] = [
  { value: 'customer', label: 'গ্রাহক', icon: User },
  { value: 'labels', label: 'লেবেল', icon: Tag },
  { value: 'orders', label: 'অর্ডার', icon: ShoppingCart },
  { value: 'ads', label: 'অ্যাড', icon: BarChart3 },
  { value: 'ai', label: 'AI', icon: Bot },
  { value: 'history', label: 'হিস্টরি', icon: History },
];

export function RightPanel({ conversation, activeTab, onTabChange }: RightPanelProps) {
  const { data: customer, isLoading: customerLoading } = useCustomerProfile(
    conversation?.sender_psid || null,
    conversation?.connection_id || null
  );

  const { data: labels = [] } = useCustomerLabels();
  const { data: orders = [] } = useCustomerOrders(customer?.id || null);

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <User className="h-12 w-12 mx-auto opacity-50" />
          <p className="text-sm">গ্রাহক নির্বাচন করুন</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as ControlPanelTab)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b px-2 h-auto py-1 bg-transparent">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-muted px-2 py-1.5 text-xs"
            >
              <tab.icon className="h-3.5 w-3.5 mr-1" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Customer Tab */}
          <TabsContent value="customer" className="p-4 mt-0 space-y-4">
            {customerLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                {/* Profile Header */}
                <div className="text-center">
                  {conversation.sender_profile_pic ? (
                    <img
                      src={conversation.sender_profile_pic}
                      alt={conversation.sender_name || 'User'}
                      className="h-20 w-20 rounded-full mx-auto object-cover border-4 border-background shadow"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full mx-auto bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-medium text-primary">
                        {(conversation.sender_name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h3 className="font-semibold mt-3">
                    {conversation.sender_name || 'Unknown User'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    PSID: {conversation.sender_psid}
                  </p>
                  
                  {/* VIP & Risk badges */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {customer?.is_vip && (
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        <Star className="h-3 w-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                    {customer && customer.risk_score > 50 && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Risk
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{customer?.total_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">মোট অর্ডার</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">৳{customer?.total_spent || 0}</p>
                    <p className="text-xs text-muted-foreground">মোট খরচ</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">যোগাযোগ তথ্য</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ফোন নম্বর"
                        defaultValue={customer?.phone || ''}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ইমেইল"
                        defaultValue={customer?.email || ''}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ঠিকানা"
                        defaultValue={customer?.address || ''}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <Button size="sm" className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    সেভ করুন
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Labels Tab */}
          <TabsContent value="labels" className="p-4 mt-0 space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-3">লেবেল যোগ করুন</h4>
              <div className="flex flex-wrap gap-2">
                {labels.map(label => {
                  const isAssigned = customer?.labels?.some(l => l.id === label.id);
                  return (
                    <button
                      key={label.id}
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium transition-all border",
                        isAssigned
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary"
                      )}
                      style={{
                        borderColor: isAssigned ? label.color : undefined,
                        backgroundColor: isAssigned ? `${label.color}20` : undefined,
                        color: isAssigned ? label.color : undefined,
                      }}
                    >
                      {isAssigned && <Check className="h-3 w-3 inline mr-1" />}
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3">কথোপকথন ট্যাগ</h4>
              <div className="flex flex-wrap gap-2">
                {conversation.tags?.map(tag => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.tag}
                  </Badge>
                ))}
                <Button variant="outline" size="sm" className="h-6">
                  <Plus className="h-3 w-3 mr-1" />
                  ট্যাগ
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="p-4 mt-0 space-y-4">
            {/* Quick Order Form */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                দ্রুত অর্ডার
              </h4>
              <div className="space-y-2">
                <Label className="text-xs">প্রোডাক্ট</Label>
                <Input placeholder="প্রোডাক্ট নির্বাচন করুন" className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">পরিমাণ</Label>
                  <Input type="number" defaultValue={1} min={1} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">মূল্য</Label>
                  <Input placeholder="৳0" className="h-8 text-sm" />
                </div>
              </div>
              <Button size="sm" className="w-full">
                অর্ডার তৈরি করুন
              </Button>
            </div>

            {/* Order History */}
            <div>
              <h4 className="font-medium text-sm mb-3">অর্ডার হিস্টরি</h4>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  কোনো অর্ডার নেই
                </p>
              ) : (
                <div className="space-y-2">
                  {orders.map(order => (
                    <div key={order.id} className="bg-muted/30 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">৳{order.total || 0}</span>
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(order.created_at), 'PPp', { locale: bn })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="p-4 mt-0 space-y-4">
            {conversation.ad_source ? (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">বিজ্ঞাপন সোর্স</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ক্যাম্পেইন</span>
                    <span className="text-sm font-medium">{conversation.ad_source.campaign_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">অ্যাড নাম</span>
                    <span className="text-sm font-medium">{conversation.ad_source.ad_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">প্লেসমেন্ট</span>
                    <span className="text-sm font-medium">{conversation.ad_source.placement || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="h-12 w-12 mx-auto opacity-50 mb-2" />
                <p className="text-sm">বিজ্ঞাপন থেকে আসেনি</p>
              </div>
            )}
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="p-4 mt-0 space-y-4">
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto opacity-50 mb-2" />
              <p className="text-sm">AI ট্রেনিং সেটিংস</p>
              <p className="text-xs mt-1">শীঘ্রই আসছে...</p>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="p-4 mt-0 space-y-4">
            <div className="text-center text-muted-foreground py-8">
              <History className="h-12 w-12 mx-auto opacity-50 mb-2" />
              <p className="text-sm">ইন্টারঅ্যাকশন হিস্টরি</p>
              <p className="text-xs mt-1">শীঘ্রই আসছে...</p>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
