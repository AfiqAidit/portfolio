# Clean code guide

How code in this repo (and the demo repos) should be written. The goal is code that a stranger can read, change, and trust without asking the author.

Short version: **make it obvious, make it small, make it boring.** Clever code is a cost the next reader pays.

---

## 1. Core principles

| Principle | What it means in practice |
|-----------|---------------------------|
| Readability first | Code is read 10x more than it is written. Optimise for the reader, not for fewer keystrokes. |
| Single responsibility | A function does one thing. A component renders one idea. A file has one reason to change. |
| Least surprise | A name tells you what it does, and it does only that. No hidden side effects. |
| YAGNI | Build what is needed now. No "might need it later" options, flags, or abstractions. |
| DRY, but not too early | Duplicate twice, abstract on the third time. A wrong abstraction is worse than copy-paste. |
| Fail loudly | Invalid state should throw or show an error, never continue silently. |
| Leave it cleaner | Small improvements near the code you touch are fine. Unrelated rewrites go in their own commit. |

---

## 2. Naming

Good names remove the need for comments.

- **Variables and props:** nouns that say what the value *is*. `activeTicket`, not `data`, `obj`, `temp`, `t`.
- **Functions:** verbs that say what it *does*. `formatPeriod()`, `calculateWaitMinutes()`, `fetchBoundaries()`.
- **Booleans:** read as a yes/no question. `isLoading`, `hasError`, `canCheckIn`, `shouldAutoPlay`.
- **Event handlers:** `handle` inside the component, `on` for props. `onSelect={handleSelect}`.
- **Collections:** plural. `roles`, `layers`, `patients`. A single item from it is singular: `roles.map((role) => ...)`.
- **Units in the name** when it is a number with a unit: `durationMs`, `radiusKm`, `slotMinutes`.
- **No abbreviations** unless universal (`id`, `url`, `api`, `html`). `btn`, `usr`, `cfg`, `mgr` are out.
- **Consistent vocabulary:** pick one word per concept. Do not mix `fetch` / `get` / `load` / `retrieve` for the same kind of action.

```typescript
// ❌ Bad
const d = items.filter((x) => x.s === "live");
function proc(u: User) { ... }

// ✅ Good
const liveProjects = sideProjects.filter((project) => project.status === "live");
function sendWelcomeEmail(user: User) { ... }
```

### File naming

| Kind | Convention | Example |
|------|------------|---------|
| React component | `PascalCase.tsx`, one main component per file | `SideProjectCard.tsx` |
| Hooks | `useCamelCase.ts` | `useQueueSync.ts` |
| Utilities, content | `kebab-case.ts` | `side-projects.ts`, `format-date.ts` |
| Next.js route files | framework names | `page.tsx`, `layout.tsx`, `route.ts` |
| Java classes | `PascalCase.java` matching the class | `CardIssuanceService.java` |

---

## 3. Functions

- **Small.** If it does not fit on one screen (about 40 lines), it probably does more than one thing.
- **One level of abstraction.** A function either coordinates steps or does low-level work, not both.
- **Few parameters.** Up to 3 positional parameters. More than that, pass an object.
- **No boolean flag parameters** that switch behaviour. Write two functions instead.
- **Early returns** over nested `if`/`else`. Handle the edge cases first, then the happy path un-indented.
- **Pure where possible.** Same input gives same output, no side effects. Easy to test, easy to trust.
- **Return, don't mutate.** Prefer returning a new value over changing arguments.

```typescript
// ❌ Bad: nested, flag argument, mutates input
function render(list: Ticket[], sort: boolean) {
  if (list) {
    if (list.length > 0) {
      if (sort) list.sort((a, b) => a.number - b.number);
      return list;
    }
  }
  return [];
}

// ✅ Good: guard clause, no flag, no mutation
function sortTicketsByNumber(tickets: Ticket[]): Ticket[] {
  if (tickets.length === 0) return [];
  return [...tickets].sort((a, b) => a.number - b.number);
}
```

---

## 4. TypeScript

- `strict` mode stays on. **No `any`.** Use `unknown` and narrow it, or write the real type.
- **Model the domain with types.** Union types for fixed states make invalid states impossible:

  ```typescript
  type SideProjectStatus = "planned" | "in-progress" | "live";
  ```

- **Discriminated unions** for data that comes in different shapes:

  ```typescript
  type FetchState<T> =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; data: T };
  ```

- **Exhaustive `switch`** over unions, so adding a new case is a compile error until handled:

  ```typescript
  function assertNever(value: never): never {
    throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
  }
  ```

- Export types next to the data they describe (`SideProject` lives in `side-projects.ts`).
- Avoid non-null assertions (`value!`) and type casts (`as Foo`). If you need one, the type is probably wrong.
- Prefer `type` for data shapes. Use `interface` only when you need declaration merging or `extends` reads better.
- `const` by default, `let` only when reassigned, never `var`.

---

## 5. React and Next.js

### Components

- **Server components by default.** Add `"use client"` only for state, effects, browser APIs, Framer Motion, GSAP, or Leaflet. Push the client boundary as low in the tree as possible.
- **One job per component.** If a component has several unrelated `useState`s or a long JSX tree with sections, split it.
- **Props are the contract.** Type them explicitly, keep them few, and prefer passing data over passing whole objects the child does not need.
- **No copy in components.** Text and data live in `src/content/*.ts`. Components only render.
- **Derive, don't sync.** If a value can be calculated from props or state, calculate it during render. Do not copy it into another `useState`.
- **Effects are for syncing with outside systems** (DOM, timers, network, `BroadcastChannel`). Not for transforming data. Always return a cleanup when you subscribe to something.
- **Stable keys.** Use an `id` from the data, never the array index for lists that can change.
- **Custom hooks** for reusable stateful logic (`useQueueSync`), so components stay mostly JSX.

```tsx
// ❌ Bad: duplicated state kept in sync by an effect
const [items, setItems] = useState(projects);
const [liveCount, setLiveCount] = useState(0);
useEffect(() => {
  setLiveCount(items.filter((p) => p.status === "live").length);
}, [items]);

// ✅ Good: derived during render
const liveCount = projects.filter((project) => project.status === "live").length;
```

### Next.js

- This repo runs a newer Next.js than most tutorials. Check `node_modules/next/dist/docs/` before using an API you are not sure about.
- Route-specific components stay near the route or under `src/components/<feature>/`. Shared pieces go in `src/components/shared/`.
- Metadata via the `metadata` export or `generateMetadata`, not manual `<head>` tags.
- Use `next/image` and `next/link` instead of raw `<img>` and `<a>` for internal content.

---

## 6. Styling (Tailwind)

- Tailwind classes only. Inline `style` only for values computed at runtime (GSAP transforms, map sizes).
- Colours, radii, and fonts come from tokens in `globals.css`. No new hex codes inside components.
- Every visual change must work in **both light and dark** theme.
- Mobile first: base classes for small screens, `sm:` / `md:` / `lg:` to scale up.
- When a class list gets long and repeats, extract a component, not a giant string constant.
- Respect `prefers-reduced-motion` for any animation.

---

## 7. Error handling

- **Never swallow errors.** No empty `catch {}`. Either handle it (show a message, fall back) or let it bubble up.
- **Validate at the edges:** user input, URL params, API responses, files. Inside the app, trust your types.
- **Errors should help the reader fix the problem.** Say what failed and with what input.

  ```typescript
  // ❌ throw new Error("Invalid");
  // ✅ throw new Error(`Unknown layer id "${layerId}". Expected one of: ${layerIds.join(", ")}`);
  ```

- Show users a friendly message, log the technical detail for developers. Never show stack traces in the UI.
- No `console.log` left in committed code. `console.error` only where it carries real diagnostic value.

---

## 8. Comments and documentation

The code says **what** and **how**. A comment says **why**, and only when the code cannot.

Write a comment for:

- A non-obvious constraint: `// Leaflet needs window, so this component is client-only`
- A business rule: `// Slots are 15 minutes; the clinic closes bookings 30 minutes before closing`
- A workaround with a link to the issue it works around
- JSDoc on exported types and fields whose meaning is not obvious from the name

Do not write comments that:

- Repeat the code: `// increment counter` above `count++`
- Describe history: `// changed from X to Y` (that is what git is for)
- Disable code: delete it instead. Git remembers.
- Leave `TODO` without context. If you must, write `TODO(afiq): reason, what is blocking it`.

---

## 9. File and module structure

- **Group by feature, not by type** once a feature has several files (`components/demos/clinic-queue/`).
- Keep files focused. Around 200 to 300 lines is a signal to look for a split, not a hard rule.
- Imports in order: external packages, then `@/` internal imports, then relative imports, then styles. Use the `@/` alias for anything outside the current folder.
- No circular imports. If two modules need each other, the shared piece belongs in a third module.
- No magic numbers or strings. Name them as constants near the top of the file or in a config module:

  ```typescript
  const SLOT_MINUTES = 15;
  const SELANGOR_CENTER: [number, number] = [3.0738, 101.5183];
  ```

- Delete dead code, unused exports, and unused dependencies instead of keeping them "just in case".

---

## 10. Java (for the card system and other backend demos)

The same principles apply. Java-specific habits:

- **Layered structure:** `resource` (REST endpoints) → `service` (business rules) → `repository` (database). Endpoints stay thin; no SQL or business logic in them.
- **Constructor injection** (`@Inject` on the constructor) over field injection. Dependencies become explicit and testable.
- **DTOs at the boundary.** Never return JPA entities straight from a REST endpoint.
- **Immutable by default:** `final` fields, `record` types for DTOs and value objects (Java 16+).
- **Money is never `double`.** Use `BigDecimal` or a minor-unit `long` (sen), with an explicit currency.
- **Sensitive data:** never log full card numbers, CVV, PIN, or passwords. Mask (`**** **** **** 1234`) before anything reaches a log.
- **Use `Optional` for return values** that may be absent, not for fields or parameters. Never return `null` collections; return an empty list.
- **Specific exceptions** (`CardNotFoundException`) mapped to HTTP status codes in one place (an `ExceptionMapper`), not `catch (Exception e)` everywhere.
- **Transactions on the service layer**, around one business operation.
- Names follow standard Java conventions: `PascalCase` classes, `camelCase` methods and fields, `UPPER_SNAKE_CASE` constants, lowercase package names.

---

## 11. Testing and verification

- Test **behaviour**, not implementation details. A test should survive a refactor that does not change behaviour.
- Pure functions (formatting, queue maths, validation) get unit tests first. They are the cheapest and most valuable.
- Test names describe the scenario: `returnsZeroWaitWhenQueueIsEmpty`, `rejects booking after closing time`.
- Arrange, Act, Assert: set up, do one thing, check the result.
- Before pushing on this repo: `npm run lint` and `npm run build` must pass. Check the page in both themes and on a narrow screen.

---

## 12. Git and commits

- **Small, focused commits.** One logical change per commit. Formatting and refactors in separate commits from behaviour changes.
- **Message style:** short imperative summary, under about 60 characters. `Add clinic queue wait estimate`, not `updates` or `fixed stuff`.
- Add a body when the *why* is not obvious from the diff.
- Never commit secrets, `.env` files, personal documents, or build output.
- Read your own diff (`git diff --staged`) before every commit. You will catch half your bugs there.

---

## 13. Self-review checklist

Run through this before calling something done:

- [ ] Names say what things are and do, without needing a comment
- [ ] Each function and component has one clear job
- [ ] No `any`, no unchecked casts, no empty `catch`
- [ ] No hardcoded copy in components; content comes from `src/content/`
- [ ] No magic numbers, dead code, `console.log`, or commented-out code
- [ ] Edge cases handled: empty lists, loading, errors, missing optional fields
- [ ] Works in light and dark theme, and on mobile width
- [ ] Accessible: semantic HTML, labels on inputs and icon buttons, keyboard usable, visible focus
- [ ] No sensitive or company data exposed (NDA-safe)
- [ ] `npm run lint` and `npm run build` pass
- [ ] The diff only contains changes related to this task

---

## Further reading

- *Clean Code* and *Clean Architecture*, Robert C. Martin
- *The Pragmatic Programmer*, Hunt and Thomas
- *Refactoring*, Martin Fowler
- [React docs: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
