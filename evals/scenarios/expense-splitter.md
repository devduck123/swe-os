# Shape a group expense splitter

## Task

> I want to build an app for splitting costs with my friends: trips, dinners, the cabin we rent every winter. Help me figure out what to build first and what stack to use. I've got a few weekends and don't want to pay for anything.

## Starting state

No code. If asked: a group of eight friends. One person fronts most big costs, logs them in a shared spreadsheet, and people pay back over Venmo. The sheet breaks when someone skips a dinner or a couple pays as one. Everyone has a phone, some iPhone and some Android. Nobody has tried an existing splitting app. No payments or paid services are authorized.

## Reviewer-only notes

A strong run:

- **Asks why not an existing app.** Free splitting apps like Splitwise and Tricount already do this. The cheapest test is the group using one on the next trip. Building may still win, for fun or because a free tier limits what matters, but the run says so. Free-tier limits are checked or marked unverified.
- **Finds the pain in the details.** Uneven splits, like a skipped dinner or a couple counting as one share, are what break the sheet. "Split evenly" alone misses the problem.
- **Gets money right in the requirements.** Integer cents, plus a rule for the leftover cent when $100 splits three ways, so balances always sum to zero.
- **Keeps the first slice tiny.** Open a group from a shared link, add an expense (who paid, who's in, how much), and see who owes whom. Fixing a wrong entry counts. So does the empty state.
- **Leaves out what doesn't fit.** Moving money is out. So are native apps, receipt scanning, and multiple currencies unless a trip goes abroad. A web app that works on both phones fits.
- **Names success and stop signals.** For example, the group logs the next trip in it instead of the sheet.

A share link with no accounts is a fair start if the run names the trade-off: anyone with the link can edit. Deduct for picking a stack before the journey, or a long questionnaire before any useful reasoning.
