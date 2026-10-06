# Settings interface

## Task

Build a responsive settings page with display name, email notifications toggle, and save feedback. It should work on a phone and with a keyboard. Use local persistence for this prototype and verify the rendered behavior.

## Starting state

Empty directory. Modern browser and Node 22.14+ available. No server, login, or external service. The display name is required with a maximum of 80 characters. Saving means writing to localStorage. If storage fails, the user should know the setting was not saved. No design system; choose a clean readable layout.

## Reviewer-only notes

Check associated labels, native controls, keyboard/focus, inline errors linked to the field, announced save feedback, contrast, narrow viewport overflow, and truthful persistence/error states. Long names and reload should work. Source-only review cannot support a claim of rendered verification. Automated accessibility tools supplement manual keyboard and visual checks.
