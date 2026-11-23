export function PizzaHubBrandMark({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  const textColor = tone === "light" ? "text-white" : "text-foreground";

  return (
    <span className={`inline-flex items-center gap-2.5 ${textColor}`}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_2px_6px_rgba(22,15,12,0.18)] ring-1 ring-black/5">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 3L20.5 19.2C20.8 19.78 20.38 20.48 19.72 20.48H4.28C3.62 20.48 3.2 19.78 3.5 19.2L12 3Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          <circle cx="9.6" cy="16.2" r="1.25" fill="currentColor" />
          <circle cx="14.5" cy="16.4" r="1.15" fill="currentColor" />
        </svg>
      </span>
      <span className="font-heading text-xl font-bold tracking-[-0.035em]">
        PizzaHub
      </span>
    </span>
  );
}
