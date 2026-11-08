"use client";
export type TasteTag = "sweet" | "savory";
const options = [
  { value: "sweet" as const, label: "Sucré", emoji: "🍰" },
  { value: "savory" as const, label: "Salé", emoji: "🧂" },
];
export function PlaceTags({
  tags,
  compact = false,
}: {
  tags?: TasteTag[];
  compact?: boolean;
}) {
  if (!tags?.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {options
        .filter((option) => tags.includes(option.value))
        .map((option) => (
          <span
            key={option.value}
            title={option.label}
            aria-label={option.label}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-foreground"
          >
            {option.emoji}
            {!compact && option.label}
          </span>
        ))}
    </span>
  );
}
export function TastePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: TasteTag[];
  onChange: (tags: TasteTag[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-2">
      <legend className="text-sm font-bold">
        Type de dégustation (optionnel)
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value.includes(option.value)}
            className={`min-h-11 rounded-xl border-2 px-4 text-sm font-bold ${value.includes(option.value) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground"}`}
            onClick={() =>
              onChange(
                value.includes(option.value)
                  ? value.filter((tag) => tag !== option.value)
                  : [...value, option.value],
              )
            }
          >
            {option.emoji} {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
