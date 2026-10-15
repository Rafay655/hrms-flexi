import { HrmsShiftProvider } from "./context";

export default function HrmsShiftLayout({ children }: { children: React.ReactNode }) {
  return <HrmsShiftProvider>{children}</HrmsShiftProvider>;
}
