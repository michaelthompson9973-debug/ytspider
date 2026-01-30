import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCourierCredentials } from '@/hooks/useCourierCredentials';
import { useCourierLocations, PathaoCity, PathaoZone, PathaoArea } from '@/hooks/useCourierLocations';
import { useCourierActions } from '@/hooks/useCourierActions';
import { Badge } from '@/components/ui/badge';

export function PathaoStoreConfig() {
  const { credentials, addCredential, updateCredential, getCredentialValue, getTokenStatus, refetch } = useCourierCredentials('pathao');
  const { cities, zones, areas, isLoadingCities, isLoadingZones, isLoadingAreas, fetchCities, fetchZones, fetchAreas } = useCourierLocations();
  const { authenticatePathao, isAuthenticating } = useCourierActions();

  const [storeId, setStoreId] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const tokenStatus = getTokenStatus();

  useEffect(() => {
    const savedStoreId = getCredentialValue('store_id');
    if (savedStoreId) setStoreId(savedStoreId);
  }, [credentials]);

  useEffect(() => {
    if (tokenStatus.valid) {
      fetchCities();
    }
  }, [tokenStatus.valid]);

  const handleAuthenticate = async () => {
    const success = await authenticatePathao();
    if (success) {
      await refetch();
      await fetchCities();
    }
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    setSelectedZone('');
    setSelectedArea('');
    if (cityId) {
      fetchZones(parseInt(cityId));
    }
  };

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId);
    setSelectedArea('');
    if (zoneId) {
      fetchAreas(parseInt(zoneId));
    }
  };

  const handleSaveStoreId = async () => {
    if (!storeId) return;
    
    setIsSaving(true);
    const existing = credentials.find(c => c.credential_type === 'store_id');
    if (existing) {
      await updateCredential(existing.id, { credential_value: storeId });
    } else {
      await addCredential('store_id', storeId, 'Store ID');
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Pathao Store Configuration</span>
          {tokenStatus.valid ? (
            <Badge variant="secondary">
              <CheckCircle className="h-3 w-3 mr-1" />
              Authenticated
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Not Authenticated
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure your Pathao store settings and authenticate with the API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Authentication Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">OAuth Authentication</p>
              {tokenStatus.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Token expires: {tokenStatus.expiresAt.toLocaleString()}
                </p>
              )}
            </div>
            <Button onClick={handleAuthenticate} disabled={isAuthenticating} variant="outline">
              {isAuthenticating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {tokenStatus.valid ? 'Refresh Token' : 'Authenticate'}
            </Button>
          </div>
        </div>

        {/* Store ID */}
        <div className="space-y-2">
          <Label>Store ID</Label>
          <div className="flex gap-2">
            <Input
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              placeholder="Enter Pathao Store ID"
            />
            <Button onClick={handleSaveStoreId} disabled={isSaving || !storeId}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </div>

        {/* Default Location Selection */}
        {tokenStatus.valid && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Default Delivery Location (Optional)</p>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={selectedCity} onValueChange={handleCityChange} disabled={isLoadingCities}>
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
                <Label>Zone</Label>
                <Select value={selectedZone} onValueChange={handleZoneChange} disabled={!selectedCity || isLoadingZones}>
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
                <Label>Area</Label>
                <Select value={selectedArea} onValueChange={setSelectedArea} disabled={!selectedZone || isLoadingAreas}>
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
