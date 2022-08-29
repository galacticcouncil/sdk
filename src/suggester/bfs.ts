import { Queue } from "../utils/queue";

export type Path = Node[];
export type Node = [id: number, from: string];

/**
 * Breadth First Search.
 *
 * - uses Queue to find the shortest path
 * - slower than DFS (Depth First Search)
 * - better when dst is closer to src
 * - complexity O(N+E) where N are nodes and E are edges
 */
export class Bfs {
  /**
   * Check if current node is already present in path
   *
   * @param x - current node
   * @param path - path
   * @returns true if node in path, otherwise false
   */
  isNotVisited(x: number, path: Path): boolean {
    let notVisited: boolean = true;
    path.forEach((pv) => {
      if (pv[0] === x) {
        notVisited = false;
      }
    });
    return notVisited;
  }

  /**
   * Finding paths in graph from given source to destination
   *
   * @param g - routes graph containing nodes & corresponding edges
   * @param src - source node
   * @param dst - destination node
   * @returns paths
   */
  findPaths(g: Path[], src: number, dst: number): Path[] {
    // Store the result paths
    const paths: Path[] = [];
    // Store the traversing paths
    const queue = new Queue<Path>();
    // Store the current path
    const currentPath: Path = [];

    // First node of path has no from (initial)
    currentPath.push([src, ""]);
    queue.enqueue(currentPath);

    while (queue.size() > 0) {
      const path = queue.dequeue();

      if (path === undefined) {
        return paths;
      }

      const last = path[path.length - 1];

      // If last node is the desired destination save to paths
      if (last[0] === dst) {
        paths.push(path);
      }

      // Traverse to all nodes connected to current one and push path to queue
      const lastNode = g[last[0]];
      lastNode.forEach((segment) => {
        if (this.isNotVisited(segment[0], path)) {
          const newpath = [...path];
          newpath.push(segment);
          queue.enqueue(newpath);
        }
      });
    }
    return paths;
  }

  /**
   * Build and populate graph
   *
   * @param nodes - list of tokens
   * @param edges - list of all edges [id, from, to]
   * @returns - traversal graph
   */
  buildAndPopulateGraph(nodes: string[], edges: [string, string, string][]): Path[] {
    const graph: Path[] = [];
    for (let j = 0; j < nodes.length; j++) {
      graph.push([]);
    }

    for (const [address, from, to] of edges) {
      const fromNumber = parseInt(from);
      const toNumber = parseInt(to);
      graph[fromNumber].push([toNumber, address]);
    }

    return graph;
  }
}
