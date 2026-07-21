/**
 * Relay logo — swaps image by theme.
 *
 * - Light mode: /relay-light.png
 * - Dark mode:  /relay-dark.png
 *
 * Switching is driven by the `.dark` class (toggled by next-themes / fumadocs)
 * via rules in global.css — NOT Tailwind's `dark:` variant, which isn't wired
 * to the class here. Done in CSS so there's no hydration flash.
 */
export function RelayLogo({ className = '' }: { className?: string }) {
  return (
    <>
      <img
        src="/relay-light-trim.png"
        alt="Relay"
        className={`relay-logo relay-logo--light w-auto ${className}`}
      />
      <img
        src="/relay-dark-trim.png"
        alt="Relay"
        className={`relay-logo relay-logo--dark w-auto ${className}`}
      />
    </>
  );
}
