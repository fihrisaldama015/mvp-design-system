import { Stepper } from "components/stepper";

/** Stepper — progress through a multi-step flow. Display only. */
export default {
  title: "Navigation/Stepper",
  component: Stepper,
  args: { steps: ["Borrower", "Equipment", "Review"], current: 1 },
  decorators: [(Story) => <div className="w-[520px]"><Story /></div>],
};

export const Default = {};

export const FirstStep = { args: { current: 0 } };

export const LastStep = { args: { current: 2 } };
