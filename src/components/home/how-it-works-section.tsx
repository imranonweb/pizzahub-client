import { CalendarCheck2, Search, Truck } from "lucide-react";
import { MotionReveal } from "@/components/home/motion-reveal";

const STEPS = [
  {
    step: "1",
    title: "Browse local pizza menus",
    description:
      "Search approved pies, sides, and drinks by category, neighborhood location, or price order.",
    icon: Search,
  },
  {
    step: "2",
    title: "Set delivery date & notes",
    description:
      "Pick your delivery date, enter your address, and add crust or preparation instructions.",
    icon: CalendarCheck2,
  },
  {
    step: "3",
    title: "Track status with clarity",
    description:
      "Follow your order from Pending to Accepted directly from your Customer Dashboard, or cancel while pending.",
    icon: Truck,
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <MotionReveal className="mb-12 max-w-xl space-y-2">
        <h2
          id="how-it-works-heading"
          className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl"
        >
          How PizzaHub works
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Three straightforward steps from discovering a nearby oven to
          following your delivery.
        </p>
      </MotionReveal>

      <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
        {STEPS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li
              key={item.step}
              className="relative flex flex-col gap-3.5 border-t border-border pt-6"
            >
              <MotionReveal
                delay={idx * 0.06}
                className="flex flex-col gap-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                    Step {item.step}
                  </span>
                </div>

                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {item.title}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </MotionReveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
