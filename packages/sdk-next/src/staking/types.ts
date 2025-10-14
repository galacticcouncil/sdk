export const CONVICTIONS = {
  none: 0.1,
  locked1x: 1,
  locked2x: 2,
  locked3x: 3,
  locked4x: 4,
  locked5x: 5,
  locked6x: 6,
} as const satisfies { [key: string]: number };

export type TConviction = keyof typeof CONVICTIONS;

export type TVote = {
  id: number;
  amount: bigint;
  conviction: TConviction;
};

export const isConviction = (conviction: string): conviction is TConviction =>
  Object.keys(CONVICTIONS).includes(conviction);
