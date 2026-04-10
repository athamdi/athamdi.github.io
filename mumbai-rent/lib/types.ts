export type BHK = 1 | 2 | 3 | 4;
export type Furnishing = 'unfurnished' | 'semi' | 'fully';
export type PinType = 'rent' | 'seeker' | 'owner';

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  bhk: BHK;
  rent: number;
  furnishing: Furnishing;
  gated: boolean;
  one_liner?: string;
  pin_type: PinType;
  verified: boolean;
  report_count: number;
  created_at: string;
  expires_at?: string;
}

export interface PolygonStats {
  count: number;
  median_rent: number;
  p25_rent: number;
  p75_rent: number;
  avg_rent: number;
  min_rent: number;
  max_rent: number;
  by_bhk: { bhk: BHK; count: number; median: number }[];
  by_furnishing: { type: Furnishing; count: number }[];
}

export interface Filters {
  bhk: BHK | null;
  furnishing: Furnishing | null;
  gated: boolean | null;
  pin_type: PinType | null;
}

export interface PinFormData {
  lat: number;
  lng: number;
  bhk: BHK;
  rent: number;
  furnishing: Furnishing;
  gated: boolean;
  one_liner: string;
  pin_type: PinType;
}
