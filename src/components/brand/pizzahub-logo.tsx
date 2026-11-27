export function PizzaHubBrandMark({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  const textColor = tone === "light" ? "text-[#faf6f0]" : "text-foreground";
  const subColor =
    tone === "light" ? "text-[#d9cbbd]" : "text-muted-foreground";

  return (
    <span className={`inline-flex items-center gap-2.5 ${textColor}`}>
      <span className="relative flex size-9.5 items-center justify-center rounded-[13px] bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_3px_10px_-2px_rgba(22,15,12,0.28)] ring-1 ring-black/8">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 2.8L20.6 18.8C20.92 19.4 20.49 20.12 19.81 20.12H4.19C3.51 20.12 3.08 19.4 3.4 18.8L12 2.8Z"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinejoin="round"
          />
          <path
            d="M5.6 17.2C8.1 15.9 15.9 15.9 18.4 17.2"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="12" cy="11.2" r="1.35" fill="currentColor" />
          <circle cx="9.6" cy="14.4" r="1.15" fill="currentColor" />
          <circle cx="14.5" cy="14.3" r="1.1" fill="currentColor" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-[1.22rem] font-extrabold tracking-[-0.035em]">
          PizzaHub
        </span>
        <span
          className={`mt-0.5 hidden text-[10px] font-medium tracking-[0.04em] sm:inline ${subColor}`}
        >
          WOODFIRE · BD
        </span>
      </span>
    </span>
  );
}
