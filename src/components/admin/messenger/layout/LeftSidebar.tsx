import { MessengerConnection, MessengerConversation, ConversationFilter } from '../types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MessageCircle, Megaphone, Star, AlertTriangle, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

interface LeftSidebarProps {
  connections: MessengerConnection[];
  conversations: MessengerConversation[];
  selectedConnectionId: string | null;
  selectedConversationId: string | null;
  filter: ConversationFilter;
  searchQuery: string;
  isLoading: boolean;
  onSelectConnection: (id: string) => void;
  onSelectConversation: (id: string) => void;
  onFilterChange: (filter: ConversationFilter) => void;
  onSearchChange: (query: string) => void;
}

const filters: { value: ConversationFilter; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'সকল', icon: MessageCircle },
  { value: 'unread', label: 'অপঠিত', icon: MessageCircle },
  { value: 'from_ads', label: 'বিজ্ঞাপন থেকে', icon: Megaphone },
  { value: 'vip', label: 'VIP', icon: Star },
  { value: 'hot_lead', label: 'হট লিড', icon: AlertTriangle },
  { value: 'pending', label: 'পেন্ডিং', icon: Clock },
  { value: 'complaint', label: 'অভিযোগ', icon: AlertTriangle },
];

export function LeftSidebar({
  connections,
  conversations,
  selectedConnectionId,
  selectedConversationId,
  filter,
  searchQuery,
  isLoading,
  onSelectConnection,
  onSelectConversation,
  onFilterChange,
  onSearchChange,
}: LeftSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Pages Selector */}
      {connections.length > 1 && (
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Users className="h-3 w-3" /> পেজ সমূহ
          </p>
          <div className="flex flex-wrap gap-1">
            {connections.map(conn => (
              <button
                key={conn.id}
                onClick={() => onSelectConnection(conn.id)}
                className={cn(
                  "text-xs px-2 py-1 rounded-md transition-colors",
                  selectedConnectionId === conn.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {conn.page_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-2 border-b">
        <div className="flex flex-wrap gap-1">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={cn(
                "text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-colors font-heading",
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              )}
            >
              <f.icon className="h-3 w-3" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              কোনো কথোপকথন নেই
            </div>
          ) : (
            conversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedConversationId}
                onClick={() => onSelectConversation(conv.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: MessengerConversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasUnread = conversation.unread_count > 0;
  const isFromAd = !!conversation.ad_source;
  const tags = conversation.tags || [];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg text-left transition-colors",
        isSelected
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50",
        hasUnread && !isSelected && "bg-accent/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {conversation.sender_profile_pic ? (
            <img
              src={conversation.sender_profile_pic}
              alt={conversation.sender_name || 'User'}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {(conversation.sender_name || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "font-medium text-sm truncate",
              hasUnread && "font-semibold"
            )}>
              {conversation.sender_name || conversation.sender_psid}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatDistanceToNow(new Date(conversation.last_message_at), {
                addSuffix: false,
                locale: bn,
              })}
            </span>
          </div>

          {/* Tags */}
          {(isFromAd || tags.length > 0) && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {isFromAd && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  <Megaphone className="h-2.5 w-2.5 mr-0.5" />
                  Ad
                </Badge>
              )}
              {tags.slice(0, 2).map(tag => (
                <Badge key={tag.id} variant="outline" className="text-[10px] px-1 py-0 h-4">
                  {tag.tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
