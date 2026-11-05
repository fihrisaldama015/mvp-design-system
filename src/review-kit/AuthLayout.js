import { Gavel, Layers, Save } from "lucide-react";

// What the reviewer will do here, in the order they will do it.
const STEPS = [
  { Icon: Layers, title: "See what changed", text: "The developers list what the code has that Figma no longer has, and where the app uses it." },
  { Icon: Gavel, title: "Choose what happens", text: "Remove it, keep it as old, or keep it and add it to Figma. Every option explains its effect." },
  { Icon: Save, title: "Save your answers", text: "Nothing changes in the code until a developer applies your answer." },
];

// The shared frame of the review page's log in and set-a-password screens: the explanation on the left
// (on top on a phone) and the form, passed as children, on the right.
export default function AuthLayout({ children }) {
  return (
    <div className="rk-auth">
      <section className="rk-flex rk-flex-col rk-justify-center rk-gap-8 rk-bg-primary-default rk-px-page-padding rk-py-10 rk-text-base-color rk-md:py-16">
        <div className="rk-flex rk-max-w-lg rk-flex-col rk-gap-3">
          <p className="rk-typo-medium-text-sm rk-uppercase rk-tracking-wide rk-opacity-80">Design system review</p>
          <h1 className="rk-typo-semi-bold-text-2xl">Decide how the components should change</h1>
          <p className="rk-typo-regular-text-base rk-opacity-90">The design and the code have drifted apart in a few places. You choose which one wins.</p>
        </div>
        <ol className="rk-flex rk-max-w-lg rk-flex-col rk-gap-5">
          {STEPS.map(({ Icon, title, text }, n) => (
            <li key={title} className="rk-flex rk-gap-4">
              <span className="rk-flex rk-size-10 rk-shrink-0 rk-items-center rk-justify-center rk-rounded-full rk-border rk-border-current rk-opacity-90" aria-hidden><Icon size={20} /></span>
              <div className="rk-flex rk-min-w-0 rk-flex-col rk-gap-0.5">
                <p className="rk-typo-semi-bold-text-base">{n + 1}. {title}</p>
                <p className="rk-typo-regular-text-sm rk-opacity-90">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="rk-auth-form">{children}</section>
    </div>
  );
}
