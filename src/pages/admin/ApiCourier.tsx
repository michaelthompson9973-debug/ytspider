import React, { useState } from 'react';
import { DynamicLayout } from '@/components/DynamicLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourierCredentialsList, PathaoStoreConfig, WebhookStatusCard } from '@/components/admin/courier';
import { Truck } from 'lucide-react';

export default function ApiCourier() {
  const [activeTab, setActiveTab] = useState<'steadfast' | 'pathao'>('steadfast');

  return (
    <DynamicLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Courier API
          </h1>
          <p className="text-muted-foreground">
            Configure Steadfast and Pathao courier integrations for order delivery.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'steadfast' | 'pathao')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="steadfast">Steadfast</TabsTrigger>
            <TabsTrigger value="pathao">Pathao</TabsTrigger>
          </TabsList>

          <TabsContent value="steadfast" className="space-y-6 mt-6">
            <CourierCredentialsList provider="steadfast" />
            <WebhookStatusCard provider="steadfast" />
          </TabsContent>

          <TabsContent value="pathao" className="space-y-6 mt-6">
            <CourierCredentialsList provider="pathao" />
            <PathaoStoreConfig />
            <WebhookStatusCard provider="pathao" />
          </TabsContent>
        </Tabs>
      </div>
    DynamicinLayout>
  );
}
