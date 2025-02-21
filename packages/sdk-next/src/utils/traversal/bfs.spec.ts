import { Bfs } from './bfs';

describe('Breadth First Search', () => {
  const g: number[][] = [];
  const size = 4;

  beforeEach(() => {
    for (let j = 0; j < size; j++) {
      g.push([]);
    }

    g[0].push(3);
    g[0].push(1);
    g[0].push(2);
    g[1].push(3);
    g[2].push(0);
    g[2].push(1);
  });

  it('Should find all possible routes from 2 to 3', () => {
    const result = new Bfs().findPaths(g, 2, 3);
    expect(result).toStrictEqual([
      [2, 0, 3],
      [2, 1, 3],
      [2, 0, 1, 3],
    ]);
  });
});
