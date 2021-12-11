export interface IClientRequest {
  directory: string;
  id: string;
  x: number;
  y: number;
  image_path: string;
  status: number;
}

export interface IVoiceMetrics {
  talk_ratio: number;
  longest_monologue: number;
  current_monologue: number;
  is_talking: boolean;
}

export interface IFace {
  directory: string;
  id: string;
  x: number;
  y: number;
  image_path: string;
  status: number;
  label: string;
  sentiment: number;
}

export interface IServerResponse {
  audio_location: string;
  faces: IFace[];
  command: number;
  voice_metrics: IVoiceMetrics;
}
