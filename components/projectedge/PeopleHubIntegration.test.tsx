import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonLabel } from "./PersonLabel";
import { OffboardingWarning } from "./OffboardingWarning";

describe("PeopleHub identity and offboarding", () => {
  it("retains a readable name and initials when an avatar is missing", () => {
    render(<PersonLabel person={{ id: 1, name: "Amina Engineer", avatar: null }} />);
    expect(screen.getByText("Amina Engineer")).toBeInTheDocument();
    expect(screen.getByText("AE")).toBeInTheDocument();
  });
  it("shows an explicit unassigned fallback", () => {
    render(<PersonLabel person={null} />);
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });
  it("announces reassignment without claiming automatic ownership changes", () => {
    const { rerender } = render(<OffboardingWarning warnings={[{ code: "OFFBOARDED_EMPLOYEE_HAS_OPEN_TASKS", message: "2 open tasks require manager reassignment." }]} />);
    expect(screen.getByRole("status")).toHaveTextContent("2 open tasks");
    expect(screen.getByRole("status")).toHaveTextContent("no automatic reassignment");
    rerender(<OffboardingWarning warnings={[]} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
