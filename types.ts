
export type StreamStatusType = 'LIVE' | 'OFFLINE' | 'BRB' | 'CODING' | 'DEBUGGING';

export interface StreamData {
  status: StreamStatusType;
  project: string;
  tech: string[];
  message: string;
  viewers: number;
}

export const INITIAL_DATA: StreamData = {
  status: "LIVE",
  project: "StreamStatus Pro",
  tech: ["React", "Tailwind", "Gemini"],
  message: "Refactoring the UI for maximum performance",
  viewers: 128
};
