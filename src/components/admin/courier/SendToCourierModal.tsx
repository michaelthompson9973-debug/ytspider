import React, { useState, useEffect } from 'react';
import { Loader2, Truck } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useCourierActions } from '@/hooks/useCourierActions';
import { useCourierCredentials } from '@/hooks/useCourierCredentials';
import { useCourierLocations } from '@/hooks/useCourierLocations';

interface SendToCourierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSuccess?: () => void;
}

export function SendToCourierModal({ open, onOpenChange, orderId, onSuccess }: SendToCourierModalProps) {
  const [provider, setProvider] = useState<'steadfast' | 'pathao'>('steadfast');
  const [cityId, setCityId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [weight, setWeight] = useState('0.5');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const { sendToCourier, isSending } = useCourierActions();
  const steadfastCredentials = useCourierCredentials('steadfast');
  const pathaoCredentials = useCourierCredentials('pathao');
  const { cities, zones, areas, isLoadingCities, isLoadingZones, isLoadingAreas, fetchCities, fetchZones, fetchAreas } = useCourierLocations();

  const hasValidSteadfast = steadfastCredentials.credentials.some(c => c.credential_type === 'api_key') &&
                           steadfastCredentials.credentials.some(c => c.credential_type === 'secret_key');
  
  const pathaoTokenStatus = pathaoCredentials.getTokenStatus();
  const hasValidPathao = pathaoTokenStatus.valid;

  useEffect(() => {
    if (provider === 'pathao' && hasValidPathao) {
      fetchCities();
    }
  }, [provider, hasValidPathao]);

  const handleCityChange = (value: string) => {
    setCityId(value);
    setZoneId('');
    setAreaId('');
    if (value) fetchZones(parseInt(value));
  };

  const handleZoneChange = (value: string) => {
    setZoneId(value);
    setAreaId('');
    if (value) fetchAreas(parseInt(value));
  };

  const handleSubmit = async () => {
    const result = await sendToCourier({
      orderId,
      provider,
      cityId: cityId ? parseInt(cityId) : undefined,
      zoneId: zoneId ? parseInt(zoneId) : undefined,
      areaId: areaId ? parseInt(areaId) : undefined,
      weight: parseFloat(weight),
      specialInstructions,
    });

    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const canSubmit = provider === 'steadfast' 
    ? hasValidSteadfast 
    : (hasValidPathao && cityId && zoneId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            কুরিয়ারে পাঠান
          </DialogTitle>
          <DialogDescription>
            অর্ডারটি কুরিয়ার সার্ভিসে পাঠাতে প্রোভাইডার নির্বাচন করুন
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>কুরিয়ার প্রোভাইডার</Label>
            <Select value={provider} onValueChange={(v: 'steadfast' | 'pathao') => setProvider(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="steadfast" disabled={!hasValidSteadfast}>
                  Steadfast {!hasValidSteadfast && '(Not Configured)'}
                </SelectItem>
                <SelectItem value="pathao" disabled={!hasValidPathao}>
                  Pathao {!hasValidPathao && '(Not Authenticated)'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pathao Location Selection */}
          {provider === 'pathao' && (
            <>
              <div className="space-y-2">
                <Label>City *</Label>
                <Select value={cityId} onValueChange={handleCityChange} disabled={isLoadingCities}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCities ? 'Loading...' : 'Select city'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.city_id} value={city.city_id.toString()}>
                        {city.city_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zone *</Label>
                <Select value={zoneId} onValueChange={handleZoneChange} disabled={!cityId || isLoadingZones}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingZones ? 'Loading...' : 'Select zone'} />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.zone_id} value={zone.zone_id.toString()}>
                        {zone.zone_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Area (Optional)</Label>
                <Select value={areaId} onValueChange={setAreaId} disabled={!zoneId || isLoadingAreas}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingAreas ? 'Loading...' : 'Select area'} />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.area_id} value={area.area_id.toString()}>
                        {area.area_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label>বিশেষ নির্দেশনা (Optional)</Label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="কুরিয়ারের জন্য বিশেষ নোট..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button onClick={handleSubmit} disabled={isSending || !canSubmit}>
            {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            পাঠান
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
