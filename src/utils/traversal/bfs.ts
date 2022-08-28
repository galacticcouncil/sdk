import { Queue } from "../queue";

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
  isNotVisited(x: number, path: number[]): boolean {
    let notVisited: boolean = true;
    path.forEach((pv) => {
      if (pv === x) {
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
  findPaths(g: number[][], src: number, dst: number): number[][] {
    // Store the results
    const paths: number[][] = [];
    // Store the traversing paths
    const queue = new Queue<number[]>();
    // Store the current path
    const currentPath: number[] = [];

    currentPath.push(src);
    queue.enqueue(currentPath);

    while (queue.size() > 0) {
      const path = queue.dequeue();

      if (path === undefined) {
        return paths;
      }

      const last = path[path.length - 1];

      // If last node is the desired destination save to paths
      if (last === dst) {
        paths.push(path);
      }

      // Traverse to all nodes connected to current node and push path to queue
      const lastNode = g[last];
      lastNode.forEach((segment) => {
        if (this.isNotVisited(segment, path)) {
          const newpath = [...path];
          newpath.push(segment);
          queue.enqueue(newpath);
        }
      });
    }
    return paths;
  }
}
