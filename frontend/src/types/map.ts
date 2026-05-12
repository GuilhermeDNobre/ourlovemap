export interface ApiLocation {
  title: string;
  description: string | null;
  message: string | null;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  order: number;
}

export interface MapApiResponse {
  coupleName: string;
  opening?: string;
  relationshipStartDate: string;
  youtubeVideoId: string | null;
  youtubeStartTime: number | null;
  youtubeEndTime: number | null;
  youtubeLoop: boolean | null;
  locations: ApiLocation[];
}
