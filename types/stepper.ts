import type { ComponentType, ForwardRefExoticComponent, RefAttributes } from "react";

export type StepStatus = "completed" | "current" | "upcoming";

// Every step component that needs a "Next" hook should expose this via
// useImperativeHandle, so the Stepper can call it without relying on
// window globals.
export interface StepHandle {
  beforeNext: () => Promise<void>;
}

export interface StepComponentProps {
  // Individual step components can extend this with their own props.
}

export interface StepConfig {
  id: number;
  title: string;
  description?: string;
  // Component must be a forwardRef component exposing StepHandle,
  // OR a plain component if it has no beforeNext logic.
  component: ForwardRefExoticComponent<any & RefAttributes<StepHandle>> | ComponentType<any>;
  // Extra props to inject into the component for this specific step
  props?: Record<string, any>;
}