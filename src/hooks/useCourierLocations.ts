import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PathaoCity {
  city_id: number;
  city_name: string;
}

export interface PathaoZone {
  zone_id: number;
  zone_name: string;
}

export interface PathaoArea {
  area_id: number;
  area_name: string;
}

export function useCourierLocations() {
  const [cities, setCities] = useState<PathaoCity[]>([]);
  const [zones, setZones] = useState<PathaoZone[]>([]);
  const [areas, setAreas] = useState<PathaoArea[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const { toast } = useToast();

  const fetchCities = async (refresh = false) => {
    setIsLoadingCities(true);
    try {
      const { data, error } = await supabase.functions.invoke('pathao-locations', {
        body: null,
        headers: {},
      });

      // Use GET with query params
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pathao-locations?type=cities${refresh ? '&refresh=true' : ''}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setCities(result.data || []);
      return result.data;
    } catch (error) {
      console.error('Error fetching cities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cities. Please authenticate with Pathao first.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoadingCities(false);
    }
  };

  const fetchZones = async (cityId: number, refresh = false) => {
    setIsLoadingZones(true);
    setZones([]);
    setAreas([]);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pathao-locations?type=zones&cityId=${cityId}${refresh ? '&refresh=true' : ''}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setZones(result.data || []);
      return result.data;
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast({
        title: 'Error',
        description: 'Failed to load zones',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoadingZones(false);
    }
  };

  const fetchAreas = async (zoneId: number, refresh = false) => {
    setIsLoadingAreas(true);
    setAreas([]);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pathao-locations?type=areas&zoneId=${zoneId}${refresh ? '&refresh=true' : ''}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setAreas(result.data || []);
      return result.data;
    } catch (error) {
      console.error('Error fetching areas:', error);
      toast({
        title: 'Error',
        description: 'Failed to load areas',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoadingAreas(false);
    }
  };

  return {
    cities,
    zones,
    areas,
    isLoadingCities,
    isLoadingZones,
    isLoadingAreas,
    fetchCities,
    fetchZones,
    fetchAreas,
  };
}
