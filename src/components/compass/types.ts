export interface ObjectiveVersionView {
  id: string;
  text: string;
  createdAt: string;
}

export interface ReflectionView {
  id: string;
  content: string;
  cycleLabel: string | null;
  isCycleSelfEvaluation: boolean;
  createdAt: string;
  ownerName?: string;
}

export interface ObjectiveView {
  id: string;
  area: string;
  currentText: string;
  status: "EXPLORANDO" | "LOGRADO_EN_VIDA_COTIDIANA";
  sharedWithCommunity: boolean;
  templateCode: string | null;
  templateIntermediateObjective?: string | null;
  terminalObjectiveRef: string | null;
  versions: ObjectiveVersionView[];
  reflections: ReflectionView[];
}

export interface SharedObjectiveView {
  id: string;
  area: string;
  currentText: string;
  status: "EXPLORANDO" | "LOGRADO_EN_VIDA_COTIDIANA";
  ownerName: string;
}

export interface SharedReflectionView {
  id: string;
  content: string;
  cycleLabel: string | null;
  isCycleSelfEvaluation: boolean;
  createdAt: string;
  ownerName: string;
}

export interface SharedNoteView {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
}

export interface CatalogTemplateView {
  id: string;
  code: string;
  area: string;
  terminalObjective: string;
  intermediateObjective: string;
}
