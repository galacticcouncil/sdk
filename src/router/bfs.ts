import { Queue } from "../utils/queue";

export type node = [number, string];

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
  isNotVisited(x: number, path: node[]): boolean {
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
  findPaths(g: node[][], src: number, dst: number): node[][] {
    // Store the results
    const paths: node[][] = [];
    // Store the traversing paths
    const queue = new Queue<node[]>();
    // Store the current path
    const currentPath: node[] = [];

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

      // Traverse to all nodes connected to current node and push path to queue
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
   * @param nodes - nodes
   * @param edges - edges
   * @returns - graph
   */
  buildAndPopulateGraph(nodes: string[], edges: [string, string, string][]): node[][] {
    const graph: node[][] = [];
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
