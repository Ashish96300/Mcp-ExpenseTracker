
export interface GuideStep {
  title: string;
  description: string;
  image: string;
  tip?: string;
}

export interface MCPClientGuide {
  id: string;
  name: string;
  description: string;
  logo?: string;
  availability?: string;

  endpoint: string;

  steps: GuideStep[];

  examplePrompts: string[];

  notes?: string[];
}
