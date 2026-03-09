import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DynamicLayout } from '@/components/DynamicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Tracking() {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery({
    queryKey: ['conversion-events', platformFilter],
    queryFn: async () => {
      let query = supabase
        .from('conversion_events')
        .select(`
          *,
          orders (
            customer_name,
            customer_phone,
            products (name)
          )
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const event = events?.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      // Call the track-conversion function again
      const { error } = await supabase.functions.invoke('track-conversion', {
        body: {
          eventId: event.event_id,
          orderId: event.order_id,
          retry: true,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion-events'] });
      toast({ title: 'Event retried' });
    },
    onError: (error) => {
      toast({ title: 'Retry failed', description: error.message, variant: 'destructive' });
    },
  });

  const filteredEvents = events?.filter(event => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      event.event_id.toLowerCase().includes(searchLower) ||
      event.event_name.toLowerCase().includes(searchLower) ||
      event.orders?.customer_name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: number | null) => {
    if (status === null) {
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    }
    if (status >= 200 && status < 300) {
      return <Badge className="gap-1 bg-primary"><CheckCircle className="h-3 w-3" /> Success</Badge>;
    }
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Failed ({status})</Badge>;
  };

  return (
    <DynamicLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Tracking Events</h1>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['conversion-events'] })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by event ID, name, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Time</th>
                    <th className="px-4 py-3 text-left font-medium">Event</th>
                    <th className="px-4 py-3 text-left font-medium">Platform</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredEvents?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No tracking events yet
                      </td>
                    </tr>
                  ) : (
                    filteredEvents?.map((event) => (
                      <tr key={event.id} className="border-b">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {format(new Date(event.sent_at), 'MMM d, HH:mm')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{event.event_name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {event.event_id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{event.platform}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {event.orders?.customer_name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(event.response_status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(event.response_status === null || event.response_status >= 400) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryMutation.mutate(event.id)}
                              disabled={retryMutation.isPending}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Event Details Section */}
        {filteredEvents && filteredEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{event.event_name}</span>
                      {getStatusBadge(event.response_status)}
                    </div>
                    {event.response_body && (
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {event.response_body}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
