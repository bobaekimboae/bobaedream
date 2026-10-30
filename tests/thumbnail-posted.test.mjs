import test from "node:test";
import assert from "node:assert/strict";
import { thumbnailPostedText } from "../src/prototype/listing/thumbnail-posted.ts";

test("absolute dates use Korean calendar days across the midnight boundary", () => {
  assert.equal(thumbnailPostedText("2026.10.23 확인", Date.parse("2026-10-23T14:59:59Z")), "오늘 확인");
  assert.equal(thumbnailPostedText("2026.10.23 확인", Date.parse("2026-10-23T15:00:00Z")), "1일전 확인");
  assert.equal(thumbnailPostedText("2026-10-20 등록", Date.parse("2026-10-23T03:00:00Z")), "3일전");
});

test("short relative labels remain compact and invalid dates are not invented", () => {
  for (const [input, expected] of [["3일 전", "3일전"], ["12분 전", "12분전"], ["2시간 전", "2시간전"], ["어제", "어제"], ["오늘", "오늘"]]) {
    assert.equal(thumbnailPostedText(input), expected);
  }
  assert.equal(thumbnailPostedText("2026.02.30 확인"), "2026.02.30 확인");
});
