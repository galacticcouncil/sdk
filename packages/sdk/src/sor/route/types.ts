export type Node = [id: number, from: string];
export type Path = Node[];

export type Edge = [address: string, from: string, to: string];

export type NodeEdges = {
  [node: string]: Edge[];
};

export type RouteProposal = Edge[][];
