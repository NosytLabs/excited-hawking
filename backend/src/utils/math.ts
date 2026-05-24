/** Integer square root for bigints using Newton's method */
export function bigIntSqrt(value: bigint): bigint {
  if (value < 0n) throw new RangeError('Cannot compute sqrt of negative number');
  if (value < 2n) return value;
  let x = value;
  let y = (x + 1n) >> 1n;
  while (y < x) {
    x = y;
    y = (y + value / y) >> 1n;
  }
  return x;
}
