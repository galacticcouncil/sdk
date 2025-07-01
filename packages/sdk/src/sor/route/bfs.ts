import { Queue } from '../../utils/Queue';

export type Node = [id: number, from: string];
export type Path = Node[];

const MAX_SIZE_OF_PATH = 6;

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
   * Check if current node is present in path or traversal within the same pool was already done
   *
   * @param x - current node
   * @param path - path
   * @returns true if node in path, otherwise false
   */
  isNotVisited(x: Node, path: Path): boolean {
    let notVisited: boolean = true;
    path.forEach((pv) => {
      if (pv[0] === x[0] || pv[1] === x[1]) {
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
   * @param dst - destination node or null if requesting all posible paths from src
   * @returns paths
   */
  findPaths(g: Map<number, Path>, src: number, dst: number | null): Path[] {
    // Store the result paths
    const paths: Path[] = [];
    // Store the traversing paths
    const queue = new Queue<Path>();
    // Store the current path
    const currentPath: Path = [];

    // First node of path has no from (initial)
    currentPath.push([src, '']);
    queue.enqueue(currentPath);

    while (queue.size() > 0) {
      const path = queue.dequeue();

      if (path == null) {
        return paths;
      }

      // Max number of edges to get from src to dst
      if (path.length > MAX_SIZE_OF_PATH) {
        return paths;
      }

      const last = path[path.length - 1];

      // If destination is undefined save all traversal to paths
      // If last node is the desired destination save to paths
      if (dst === null) {
        paths.push(path);
      } else if (last[0] === dst) {
        paths.push(path);
      }

      // Traverse to all nodes connected to current one and push path to queue
      const lastNode = g.get(last[0]);
      lastNode?.forEach((segment) => {
        if (this.isNotVisited(segment, path)) {
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
   * @param nodes - list of pool assets
   * @param edges - list of all edges [id, from, to] between assets
   * @returns - traversal graph
   */
  buildAndPopulateGraph(
    nodes: string[],
    edges: [string, string, string][]
  ): Map<number, Path> {
    const graph = new Map<number, Path>();
    for (let node of nodes) {
      graph.set(parseInt(node), []);
    }
    for (const [address, from, to] of edges) {
      const fromNumber = parseInt(from);
      const toNumber = parseInt(to);
      graph.get(fromNumber)?.push([toNumber, address]);
    }
    return graph;
  }
}
