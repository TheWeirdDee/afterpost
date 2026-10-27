/**
 * EVM address helpers. All comparisons use numeric address ordering (PRD §7.4),
 * never case-sensitive string comparison, because token0/token1 ordering on a
 * pool is defined by numeric address value.
 */

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export function isHexAddress(value: string): value is `0x${string}` {
  return HEX_ADDRESS.test(value);
}

export function assertHexAddress(value: string): `0x${string}` {
  if (!isHexAddress(value)) {
    throw new Error(`Not a valid EVM address: ${value}`);
  }
  return value.toLowerCase() as `0x${string}`;
}

/** Canonical lowercase form used for DB uniqueness keys. */
export function canonicalAddress(value: string): string {
  return assertHexAddress(value).toLowerCase();
}

/**
 * Numeric comparison of two EVM addresses, matching how a pool's
 * token0 < token1 ordering is actually defined onchain.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
export function compareEvmAddress(a: string, b: string): number {
  const aBig = BigInt(assertHexAddress(a));
  const bBig = BigInt(assertHexAddress(b));
  if (aBig < bBig) return -1;
  if (aBig > bBig) return 1;
  return 0;
}

export function isSameAddress(a: string, b: string): boolean {
  return compareEvmAddress(a, b) === 0;
}
