import { describe, expect, it } from "vitest";
import {
  personalTaskResults,
  type PersonalTaskFilters,
} from "./projectedge-my-tasks";
import { personalTaskFixture } from "@/components/projectedge/my-tasks.fixture";
const filters: PersonalTaskFilters = {
  status: "",
  project: "",
  blocked: false,
  search: "",
  sort: "due",
};
describe("personal task presentation", () => {
  it("sorts globally by due or priority with missing dates last and stable ID ties", () => {
    expect(
      personalTaskResults(personalTaskFixture, filters).map((task) => task.id),
    ).toEqual([1, 2, 3]);
    expect(
      personalTaskResults(personalTaskFixture, {
        ...filters,
        sort: "priority",
      }).map((task) => task.id),
    ).toEqual([2, 3, 1]);
    const tied = [
      { ...personalTaskFixture[0], id: 10 },
      { ...personalTaskFixture[0], id: 4 },
    ];
    expect(personalTaskResults(tied, filters).map((task) => task.id)).toEqual([
      4, 10,
    ]);
    expect(tied.map((task) => task.id)).toEqual([10, 4]);
  });
  it("combines status/project/blocked/search without recomputing block state", () => {
    expect(
      personalTaskResults(personalTaskFixture, {
        ...filters,
        status: "on_hold",
      }).map((task) => task.id),
    ).toEqual([3]);
    expect(
      personalTaskResults(personalTaskFixture, {
        ...filters,
        project: "7",
        blocked: true,
        search: " LAUNCH ",
      }).map((task) => task.id),
    ).toEqual([1]);
    expect(
      personalTaskResults(personalTaskFixture, {
        ...filters,
        project: "8",
        search: "PRJ-008",
      }).map((task) => task.id),
    ).toEqual([2, 3]);
    expect(
      personalTaskResults(personalTaskFixture, {
        ...filters,
        blocked: true,
        status: "on_hold",
      }),
    ).toEqual([]);
  });
});
