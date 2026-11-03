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
    <div className="grid min-h-screen grid-cols-1 bg-surface md:grid-cols-2">
      <section className="flex flex-col justify-center gap-8 bg-primary-default px-page-padding py-10 text-base-color md:py-16">
        <div className="flex max-w-lg flex-col gap-3">
          <p className="typo-medium-text-sm uppercase tracking-wide opacity-80">Design system review</p>
          <h1 className="typo-semi-bold-text-2xl">Decide how the components should change</h1>
          <p className="typo-regular-text-base opacity-90">The design and the code have drifted apart in a few places. You choose which one wins.</p>
        </div>
        <ol className="flex max-w-lg flex-col gap-5">
          {STEPS.map(({ Icon, title, text }, n) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-current opacity-90" aria-hidden><Icon size={20} /></span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="typo-semi-bold-text-base">{n + 1}. {title}</p>
                <p className="typo-regular-text-sm opacity-90">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="flex items-center justify-center px-page-padding py-10 md:py-16">{children}</section>
    </div>
  );
}
