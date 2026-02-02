import { useState, useRef, useEffect } from 'react';
import { MessengerConversation, MessengerMessage } from '../types';
import { useMessages, useSendMessage, useMarkAsRead, useQuickReplies } from '../hooks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Sparkles, 
  Zap,
  Package,
  Truck,
  MessageSquare,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ChatWindowProps {
  conversation: MessengerConversation | undefined;
  connectionId: string | null;
}

export function ChatWindow({ conversation, connectionId }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [], isLoading } = useMessages(conversation?.id || null);
  const { data: quickReplies = [] } = useQuickReplies();
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when opening conversation
  useEffect(() => {
    if (conversation && conversation.unread_count > 0) {
      markAsRead.mutate(conversation.id);
    }
  }, [conversation?.id]);

  const handleSend = () => {
    if (!message.trim() || !conversation || !connectionId) return;

    sendMessage.mutate({
      conversationId: conversation.id,
      connectionId: connectionId,
      recipientPsid: conversation.sender_psid,
      message: message.trim(),
    });

    setMessage('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (content: string) => {
    setMessage(content);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <MessageSquare className="h-12 w-12 mx-auto opacity-50" />
          <p>কথোপকথন নির্বাচন করুন</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
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
          <div>
            <h3 className="font-medium">
              {conversation.sender_name || conversation.sender_psid}
            </h3>
            {conversation.ad_source && (
              <p className="text-xs text-muted-foreground">
                বিজ্ঞাপন থেকে: {conversation.ad_source.campaign_name || 'Unknown Campaign'}
              </p>
            )}
          </div>
        </div>

        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                <Skeleton className="h-12 w-48 rounded-lg" />
              </div>
            ))
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              কোনো মেসেজ নেই
            </div>
          ) : (
            messages.map((msg, index) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                showTimestamp={
                  index === 0 ||
                  new Date(msg.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000
                }
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* AI Suggestion Box - placeholder */}
      <div className="px-4 py-2 border-t bg-accent/30">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">AI সাজেশন:</span>
          <span className="text-foreground">"অর্ডার করতে নাম ও ঠিকানা দিন"</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto">
            ব্যবহার করুন
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t flex items-center gap-2">
        <Button variant="outline" size="sm" className="text-xs h-7">
          <Package className="h-3 w-3 mr-1" />
          অর্ডার
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-7">
          <Truck className="h-3 w-3 mr-1" />
          ডেলিভারি
        </Button>
        <Popover open={showQuickReplies} onOpenChange={setShowQuickReplies}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs h-7">
              <Zap className="h-3 w-3 mr-1" />
              কুইক রিপ্লাই
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              {quickReplies.map(qr => (
                <button
                  key={qr.id}
                  onClick={() => handleQuickReply(qr.content)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                >
                  <span className="font-medium">{qr.title}</span>
                  {qr.shortcut && (
                    <span className="text-xs text-muted-foreground ml-2">{qr.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="মেসেজ লিখুন..."
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
            <Smile className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!message.trim() || sendMessage.isPending}
            className="h-9 w-9 flex-shrink-0"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, showTimestamp }: { message: MessengerMessage; showTimestamp: boolean }) {
  const isFromPage = message.is_from_page;

  return (
    <div className={cn("flex flex-col", isFromPage ? "items-end" : "items-start")}>
      {showTimestamp && (
        <span className="text-xs text-muted-foreground mb-1 px-2">
          {format(new Date(message.timestamp), 'PPp', { locale: bn })}
        </span>
      )}
      <div
        className={cn(
          "max-w-[70%] px-4 py-2 rounded-2xl",
          isFromPage
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        {message.message_text && (
          <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
        )}
        
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((att, i) => (
              <div key={i}>
                {att.type === 'image' && att.payload.url && (
                  <img
                    src={att.payload.url}
                    alt="Attachment"
                    className="max-w-full rounded-lg"
                  />
                )}
                {att.type === 'sticker' && (
                  <span className="text-2xl">🎉</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
