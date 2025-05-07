export function humanizeAmount(
  amount: string | number,
  signDigits?: number
): string {
  const amountNo = Number(amount);

  if (!Number.isFinite(amountNo)) {
    return null;
  }

  let maxSignDigits: number = signDigits || 4;
  if (amountNo > 1) {
    const intPartLen = Math.ceil(Math.log10(amountNo + 1));
    maxSignDigits = maxSignDigits + intPartLen;
  }
  const formattedNo = new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: maxSignDigits,
  }).format(amountNo);
  return formattedNo.replaceAll(',', ' ');
}
