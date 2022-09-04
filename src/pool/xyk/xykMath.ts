import {
  calculate_in_given_out,
  calculate_out_given_in,
  get_spot_price,
} from '@galacticcouncil/math-xyk';

function getSpotPrice(a: string, b: string, c: string): string {
  return get_spot_price(a, b, c);
}

function calculateInGivenOut(a: string, b: string, c: string): string {
  return calculate_in_given_out(a, b, c);
}

function calculateOutGivenIn(a: string, b: string, c: string): string {
  return calculate_out_given_in(a, b, c);
}

export default { getSpotPrice, calculateInGivenOut, calculateOutGivenIn };
