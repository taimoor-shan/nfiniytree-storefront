/**
 * The visual radio dot used inside checkout's radio groups.
 *
 * This is deliberately presentational. Every call site nests it inside a
 * Headless UI `Radio` or `Listbox.Option`, which is itself the real control —
 * it owns the `radio` role, the checked state, arrow-key navigation and the
 * single group tab stop. This component only draws the ring and the dot.
 *
 * It used to render `<button type="button" role="radio" aria-checked="true">`,
 * which was wrong three times over:
 *
 *   1. `aria-checked` was the hardcoded string `"true"` and never read the
 *      `checked` prop, so a screen reader announced *every* option in the group
 *      as selected — including in checkout's payment, shipping and salutation
 *      groups. A blind shopper had no way to tell which payment method was
 *      actually going to be charged.
 *   2. An interactive control nested inside another interactive control. The
 *      inner button had no click handler, so it was a tab stop that did
 *      nothing, landed between the group's options, and gave the group two
 *      competing `radio` roles for the same choice.
 *   3. The nesting also made the accessible name ambiguous — the outer option's
 *      label text was inside the inner button's subtree.
 *
 * `aria-hidden` here is correct rather than lossy: the state it was pretending
 * to expose is expressed properly by the wrapping option.
 */
const Radio = ({
  checked,
  "data-testid": dataTestId,
}: {
  checked: boolean
  "data-testid"?: string
}) => {
  return (
    <span
      // `data-state` drives the `group-data-[state=checked]:` classes below, so
      // the coral fill and the inner dot render exactly as before.
      data-state={checked ? "checked" : "unchecked"}
      className="group relative flex h-5 w-5 shrink-0 items-center justify-center outline-none"
      data-testid={dataTestId || "radio-button"}
      aria-hidden="true"
    >
      <span className="shadow-borders-base group-hover:shadow-borders-strong-with-shadow bg-canvas group-data-[state=checked]:bg-primary group-data-[state=checked]:shadow-borders-interactive flex h-[14px] w-[14px] items-center justify-center rounded-full transition-all">
        {checked && (
          <span className="bg-canvas shadow-details-contrast-on-bg-interactive block h-1.5 w-1.5 rounded-full" />
        )}
      </span>
    </span>
  )
}

export default Radio
