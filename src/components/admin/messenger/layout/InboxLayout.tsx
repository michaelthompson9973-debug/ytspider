import { useState } from 'react';
import { MessengerState, ConversationFilter, ControlPanelTab } from '../types';
import { LeftSidebar } from './LeftSidebar';
import { ChatWindow } from './ChatWindow';
import { RightPanel } from './RightPanel';
import { useConnections, useConversations, useMessengerRealtime } from '../hooks';
import { cn } from '@/lib/utils';

export function InboxLayout() {
  const [state, setState] = useState<MessengerState>({
    selectedConnectionId: null,
    selectedConversationId: null,
    filter: 'all',
    searchQuery: '',
    controlPanelTab: 'customer',
  });

  // Fetch connections
  const { data: connections = [], isLoading: connectionsLoading } = useConnections();

  // Auto-select first connection if none selected
  if (!state.selectedConnectionId && connections.length > 0) {
    setState(prev => ({ ...prev, selectedConnectionId: connections[0].id }));
  }

  // Fetch conversations for selected connection
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations(
    state.selectedConnectionId,
    state.filter
  );

  // Selected conversation
  const selectedConversation = conversations.find(c => c.id === state.selectedConversationId);

  // Setup realtime
  useMessengerRealtime(state.selectedConnectionId, state.selectedConversationId);

  const handleSelectConnection = (connectionId: string) => {
    setState(prev => ({
      ...prev,
      selectedConnectionId: connectionId,
      selectedConversationId: null,
    }));
  };

  const handleSelectConversation = (conversationId: string) => {
    setState(prev => ({
      ...prev,
      selectedConversationId: conversationId,
    }));
  };

  const handleFilterChange = (filter: ConversationFilter) => {
    setState(prev => ({
      ...prev,
      filter,
      selectedConversationId: null,
    }));
  };

  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleTabChange = (tab: ControlPanelTab) => {
    setState(prev => ({ ...prev, controlPanelTab: tab }));
  };

  // Filter conversations by search
  const filteredConversations = state.searchQuery
    ? conversations.filter(c =>
        c.sender_name?.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        c.sender_psid.includes(state.searchQuery)
      )
    : conversations;

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background rounded-lg border overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-72 border-r flex-shrink-0">
        <LeftSidebar
          connections={connections}
          conversations={filteredConversations}
          selectedConnectionId={state.selectedConnectionId}
          selectedConversationId={state.selectedConversationId}
          filter={state.filter}
          searchQuery={state.searchQuery}
          isLoading={connectionsLoading || conversationsLoading}
          onSelectConnection={handleSelectConnection}
          onSelectConversation={handleSelectConversation}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          conversation={selectedConversation}
          connectionId={state.selectedConnectionId}
        />
      </div>

      {/* Right Panel */}
      <div className={cn(
        "w-80 border-l flex-shrink-0 transition-all duration-200",
        !selectedConversation && "hidden lg:block"
      )}>
        <RightPanel
          conversation={selectedConversation}
          activeTab={state.controlPanelTab}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
}
