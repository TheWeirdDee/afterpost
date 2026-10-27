import { describe, expect, it } from "vitest";
import { decodeTokenLaunchedTopics, extractPoolCandidateFromTokenLaunchedData } from "./abis.js";
import { REFERENCE_PONS_POOL } from "./constants.js";

// Raw topics/data captured live from REFERENCE_LAUNCH_TX on 2026-10-27.
const REAL_TOKEN_LAUNCHED_TOPICS = [
  "0xdb51ea9ad51ab453a65a4cb7e60c3cb378c9501bb002609f8f97778fb6c4235a",
  "0x00000000000000000000000039dbed3a2bd333467115de45665cc57f813c4571",
  "0x000000000000000000000000b9f5f4ea1af1f5d3678470eb98e8fbdcadeb24b0",
  "0x0000000000000000000000001f7d7550b1b028f7571e69a784071f0205fd2efa",
] as const;

const REAL_TOKEN_LAUNCHED_DATA =
  "0x0000000000000000000000000bd7d308f8e1639fab988df18a8011f41eacad7300000000000000000000000010cc6bd38112cac182db90b6a71d8bb5939526ba0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001aaa00000000000000000000000000000000000000000000000000000000001858104000000000000000000000000000000000000000000000000016345785d8a0000" as const;

describe("decodeTokenLaunchedTopics", () => {
  it("extracts the real token and creator addresses from the reference launch", () => {
    // #given
    const topics = REAL_TOKEN_LAUNCHED_TOPICS;
    // #when
    const decoded = decodeTokenLaunchedTopics(topics);
    // #then
    expect(decoded?.token.toLowerCase()).toBe("0x39dbed3a2bd333467115de45665cc57f813c4571");
    expect(decoded?.creator.toLowerCase()).toBe("0xb9f5f4ea1af1f5d3678470eb98e8fbdcadeb24b0");
  });

  it("returns null when topics are too short", () => {
    // #given
    const topics = [REAL_TOKEN_LAUNCHED_TOPICS[0]] as const;
    // #when
    const decoded = decodeTokenLaunchedTopics(topics);
    // #then
    expect(decoded).toBeNull();
  });
});

describe("extractPoolCandidateFromTokenLaunchedData", () => {
  it("extracts the real documented reference pool address from data word[1]", () => {
    // #given
    const data = REAL_TOKEN_LAUNCHED_DATA;
    // #when
    const pool = extractPoolCandidateFromTokenLaunchedData(data);
    // #then
    expect(pool?.toLowerCase()).toBe(REFERENCE_PONS_POOL.toLowerCase());
  });

  it("returns null when data is too short to contain a second word", () => {
    // #given
    const shortData = "0x00" as const;
    // #when
    const pool = extractPoolCandidateFromTokenLaunchedData(shortData);
    // #then
    expect(pool).toBeNull();
  });
});
