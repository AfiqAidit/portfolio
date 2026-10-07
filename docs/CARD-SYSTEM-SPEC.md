# Demo Bank card system (Java EE): full context and build spec

Handoff for any AI model or person helping with this project. It contains the full background, every decision made so far (and why), and the build plan. Also read `docs/PROJECT-CONTEXT.md` for the portfolio as a whole.

## In one paragraph

A small, fictional bank card system ("Demo Bank") built with **Java EE** and run on **WildFly** with an **Oracle** database. It works like a real app (issue cards, make purchases, freeze cards, staff back office), and it has a **"Show what's happening" mode** that explains, step by step, what the server actually did for each action: which servlet received the request, which service ran, the SQL that hit the database, how long each step took. So it is both a real working example and a Java EE tutorial. It lives in its own GitHub repo and is linked from the portfolio's Side projects section.

## The owner, and how to work with him

- **Muhammad Afiq Aidit** ("Afiq"), Software Engineer in Malaysia. Work experience: Spring Boot backends (Java 21, Spring Data JPA, MySQL) at Selangkah, Laravel, NestJS, Next.js, GIS, plain Java + JDBC at Elcorp, Java + SQL at Finexus (internship, card management)
- **He is new to Java EE.** He knows Java 21 the language and has used Spring Boot, but terms like Java EE, WildFly, servlet, EJB, application server, and hosting a Java API were unfamiliar. He said so directly
- **How to explain things:** plain English, short, one idea at a time. Compare new things to what he already knows (Spring Boot, Laravel, Spring Data JPA). Avoid listing many tool names at once. Define a term the first time it appears. Check he is following before moving on
- **How to build with him:** one small step at a time, each step ends with something he can see running. Explain every command before running it. He wants to understand, not just get code
- **His machine (checked Oct 2026):** macOS on Apple Silicon with Homebrew, Eclipse and IntelliJ IDEA installed. **Not installed yet:** a Java JDK, Maven, Docker. Install these only when coding starts (Phase 0)

## Why this project exists

1. **A job application.** He wants to apply for a Java developer role. The role asks for:
   - Solid OOP, Java web development, SQL and relational databases, SDLC
   - Java EE: JSP, EL, Servlets, JSF, EJB, JDBC, JPA. Hibernate, Spring
   - XML, HTML, XHTML, JavaScript, jQuery, CSS
   - Application servers: JBoss, WebLogic. Database: Oracle. Tools: Eclipse, Git (also CVS, SVN)
   - Bonus: SOAP and REST web services, Spring Boot, ReactJS, NodeJS, AWS or Google Cloud, Redmine or Jira, Docker, Jenkins, SonarSource, GitHub
   - Responsibilities include writing documentation and **sharing programming knowledge with junior programmers**. The tutorial side of this project speaks directly to that
2. **The portfolio's Side projects pattern.** Each side project is a small self-built version of the kind of system he worked on at a previous employer. This one is inspired by **Finexus** (card management for banks)
3. **His own learning.** He wants to actually learn how Java EE works, and to be able to present it to others as a tutorial

## Decisions so far

| Topic | Decision | Why |
|---|---|---|
| Stack | **Java EE (Jakarta EE)** on WildFly, not Spring Boot | The target job asks for Java EE and JBoss. His Spring Boot work at Selangkah already covers the Spring line on his resume. (An earlier suggestion of Spring Boot was dropped once the job description was known) |
| Shape | **One project**: a real bank card app with a "Show what's happening" mode, plus a few Learn pages | Earlier idea was two projects (a tutorial lab and a card app). Merged because it halves the work, the tutorial uses a realistic example instead of toy code, and the owner proposed narrating each action with notices, which fits one app best |
| Screens | Built in **JSP and JSF**, served by WildFly | The job lists JSP and JSF, so the screens themselves show those skills |
| Learn pages | Inside the Java app too (JSP pages) | Keeps it one project, one deploy, and more Java practice. Can move to the portfolio (Next.js) later if wanted |
| Database | Oracle (Oracle Database Free in Docker on his Mac, Oracle Autonomous Database in the cloud) | The job asks for Oracle |
| Hosting | **Oracle Cloud Always Free** | Free and always on. WildFly + Oracle need more memory than free tiers like Render offer (Render was an earlier idea, dropped) |
| Repo | Separate GitHub repo, `AfiqAidit/card-system` (name can change) | It is a Java project, not part of the Next.js portfolio |
| Order | Write this spec first, then build phase by phase | Owner's choice |

## Plain-English glossary

Use these explanations with the owner.

| Term | Plain meaning | What he already knows that is similar |
|---|---|---|
| Java EE / Jakarta EE | A toolkit for building web apps in Java, the older "official" one. Renamed Jakarta EE (packages start with `jakarta.` instead of `javax.`) | Laravel is a toolkit for PHP; Spring Boot is another toolkit for Java |
| Servlet | A Java class that receives a request from the browser and decides what to do | A controller in Spring Boot or Laravel |
| Filter | Code that runs before the servlet on every request (logging, login checks) | Middleware in Laravel |
| JSP + EL | HTML pages with Java values filled in. EL is the `${card.status}` syntax | Blade views in Laravel |
| JSF | A newer way to build pages from components (tables, forms) in `.xhtml` files, with a fixed set of steps per request | Somewhat like Livewire in Laravel |
| EJB | A service class where the server manages transactions and instances for you | A Spring `@Service` with `@Transactional` |
| JPA / Hibernate | Saving and loading Java objects to the database without writing SQL. JPA is the standard, Hibernate is the engine | Spring Data JPA at Selangkah uses exactly this |
| JDBC | Writing and running SQL yourself from Java | His work at Elcorp |
| JDK | The Java Development Kit: the program that compiles and runs Java code. Eclipse and IntelliJ are only editors; they need a JDK installed to run anything | Node.js is what actually runs JavaScript; VS Code only edits it |
| Maven | Downloads the libraries the project needs and builds the code into one file (`.war`). The list of libraries lives in `pom.xml` | `composer.json` + Composer in Laravel, `package.json` + npm in Next.js |
| Docker | Runs a program inside a sealed box (a "container") with everything it needs, so it works the same on any computer. We use it to run Oracle Database on his Mac without a complicated install, and later to run the app on the cloud server | Like a ready-made, pre-configured mini computer you can start and throw away with one command |
| Application server | A program that runs Java EE apps. You package the app as a `.war` file and hand it to the server | Laravel needs Apache or `php artisan serve` to run; Spring Boot hides its server inside the app |
| WildFly / JBoss | WildFly is a free application server. JBoss EAP is the paid company version built from it. Learning WildFly counts as JBoss experience | |
| Hosting | Running the app on a computer that is always on and reachable from the internet | His portfolio is hosted on Vercel, which only runs JavaScript sites, so the Java app needs its own host |
| Session | The server remembers a logged-in user; the browser keeps a session ID cookie | Laravel's default login |
| SOAP / REST | Two ways for programs to talk to the app. REST uses JSON, SOAP uses XML with a contract file (WSDL) | REST APIs he built in Spring Boot and NestJS |

## Hard rules

- **NDA safe.** Nothing from Finexus or CARDWORKS: no names, screens, flows, table names, or wording. Only generic, public card concepts (Luhn check, masking, authorization, limits, statements)
- Fictional bank **"Demo Bank"**. Card numbers use the prefix `999` so none can match a real card. "Demo, fictional data" on every screen. No real personal data
- **Never use em dashes or en dashes** in code, comments, UI text, or docs. Use `-`, `:`, or a full stop
- The behind-the-scenes trace must **never show secrets**: no passwords, full card numbers, encryption keys, or session IDs. Mask them
- Commits: short message, the owner as the only author, no `Co-authored-by` or "Made with Cursor" trailers
- Keep code simple and readable; this is also teaching material

## Stack

| Layer | Choice |
|---|---|
| Language | Java 21 |
| Platform | Jakarta EE 10 |
| App server | WildFly (latest stable) |
| Persistence | JPA with Hibernate; plain JDBC for the statement report |
| Database | Oracle Database (Free edition locally, Autonomous Database in the cloud) |
| Screens | Servlets + JSP + EL + JSTL + jQuery (teller), JSF Facelets `.xhtml` (back office), plain CSS |
| Web services | JAX-RS (REST, JSON), JAX-WS (SOAP, XML, WSDL) |
| Build and IDE | Maven, Eclipse (the job lists Eclipse; IntelliJ is fine too) |
| Tests | JUnit 5, Mockito |
| CI | GitHub Actions (build and tests), SonarCloud (free for public repos) |
| Packaging | Docker image for deployment |

## The app

### Screens

| Screen | Tech | Who | What it does |
|---|---|---|---|
| Home | JSP | Visitor | What the project is, demo login details, the "Show what's happening" switch, links to everything |
| Teller | Servlet + JSP + jQuery | Bank teller | Issue a card, look up a card, make a test purchase with approve or decline and the reason |
| Back office | JSF | Bank staff (login) | Card list and search, freeze and unfreeze, change limits, transaction history |
| Learn | JSP | Visitor | Short lessons (see below), each linking into the live app |
| API docs | HTML | Developers | How to call the REST and SOAP APIs, with copy-paste examples |

### "Show what's happening" mode

The heart of the project. A switch in the header, remembered per visitor.

- **Off:** a normal bank app
- **On:** after each action, short notices appear, and a **timeline panel** on the side keeps the full history (so notices that fade are not lost). Each step shows: the layer (Filter, Servlet, EJB, JPA, Database), a one-sentence plain-English description, and how long it took. Database steps show the SQL that ran, with values masked where sensitive

Example, staff login:

1. Browser sent the username and password to `/login`
2. A filter checked the request first
3. The servlet received it and called the login service
4. The password was checked against the stored hash (never stored as plain text)
5. A session was created: the server remembers you, your browser holds a session cookie
6. Done in 42 ms

**The trace must be real, not pre-written text.** The server records what it actually did during the request and sends it back with the response. If something fails, the trace shows where. Suggested design (adjust if a simpler one works):

- A request-scoped `Trace` object collects steps
- A servlet filter starts the trace and records the request
- An EJB interceptor records each service method call and its time
- A Hibernate `StatementInspector` (or a JDBC wrapper for the JDBC code) records SQL
- For normal page loads, the JSP layout renders the trace into the panel. For jQuery calls, the JSON response includes the trace

### Learn pages

Short pages for topics that do not fit inside a button click. Each has a short explanation, a simple diagram, a real code snippet from this repo, and a "Try it" link into the app. Under two minutes to read each.

1. **OOP in this codebase:** encapsulation, abstraction, inheritance, polymorphism, each shown with the real card classes
2. **The life of a request:** browser, WildFly, filter, servlet, service, database, back
3. **Servlets and threads:** one servlet instance serves many requests at once; why shared fields are dangerous
4. **Request, session, and application scope**
5. **JSP vs JSF:** how a JSP becomes a servlet, and JSF's six phases
6. **EJB and transactions:** what happens when something fails halfway (rollback)
7. **JDBC vs JPA:** the same query both ways, the SQL Hibernate writes for you, and the N+1 problem
8. **Session vs token login:** how this app remembers you, and how token-based apps (like many mobile backends) differ
9. **REST vs SOAP:** the same operation as JSON and as XML

### Domain and OOP design

Deliberate OOP, explained in `docs/DESIGN.md` in the card-system repo and in Learn page 1.

- **Encapsulation:** `Card` has no `setBalance()` or `setStatus()`. State only changes through methods that enforce the rules: `authorize(amount)`, `freeze()`, `unfreeze()`, `changeLimit(...)`
- **Abstraction and inheritance:** abstract `Card`, with `DebitCard` (spends from a balance) and `CreditCard` (spends against a credit limit)
- **Polymorphism:** each subclass decides `canSpend(amount)` its own way; authorization code never asks "is this debit or credit"
- **Interfaces:** `FeePolicy` (e.g. `NoFee`, `OverseasFee`)
- **Value objects:** `Money` (amount + currency, `BigDecimal`, never `double`) and `CardNumber` (validates with Luhn, prints masked as `9999 •••• •••• 1234`)

## Build phases

Each phase ends with something running and its own behind-the-scenes steps, so learning and building happen together. Stopping after any phase still leaves a working project.

**Phase 0: setup on his Mac**
- Install a Java 21 JDK, Maven, and Docker (Homebrew is available). Explain each tool before installing
- Run WildFly locally. Run Oracle Database Free in Docker
- One "Hello" servlet and a page that confirms the database connection
- GitHub repo with a README and a CI build

**Phase 1: domain model**
- The classes in "Domain and OOP design", JPA entities where needed
- Unit tests: Luhn, masking, debit vs credit spending, frozen cards

**Phase 2: teller screen and the trace**
- Servlet + JSP: issue, look up, test purchase
- First version of "Show what's happening" (filter, servlet, SQL steps)

**Phase 3: EJB and transactions**
- `AuthorizationService` as a stateless EJB with container-managed transactions; EJB steps appear in the trace
- Concurrency test page: many purchases at one card at once, shown without locking (balance goes wrong) and with optimistic locking (`@Version`), with a simple chart
- EJB timer (`@Schedule`) that resets demo data every night

**Phase 4: login and back office**
- Staff login with sessions (Jakarta Security, one demo account shown on the home page); login steps appear in the trace
- JSF back office: card list, search, freeze and unfreeze, limits, history

**Phase 5: Learn pages 1 to 4**

**Phase 6: web services**
- REST (JAX-RS): issue card, authorize, get transactions
- SOAP (JAX-WS): the same authorize operation, with its WSDL
- API docs page

**Phase 7: security and reports**
- Card numbers encrypted in the database (AES-GCM, key from an environment variable, never in the repo)
- Monthly statement with plain JDBC, exported as PDF with JasperReports (he used Jaspersoft at Finexus)

**Phase 8: Learn pages 5 to 9**

**Phase 9: deploy**
- Docker image; Oracle Cloud Always Free (see Hosting)

## Time and milestones

Rough estimate for a beginner to Java EE working part-time (evenings and weekends). Learning time is included; it is most of the effort at the start and gets faster later.

| Milestone | Phases | Rough time | What he has at the end |
|---|---|---|---|
| Setup works | 0 | 1 or 2 evenings | "Hello" page from his own servlet on WildFly, database connected, repo on GitHub |
| Worth showing | 1 to 3 | 2 to 4 weeks | Real teller screen, OOP card classes with tests, EJB, concurrency test, behind-the-scenes trace. Enough to link on a job application as "in progress" |
| Core app | 4 and 5 | about 2 more weeks | Login, JSF back office, first Learn pages |
| Complete | 6 to 9 | about 4 to 6 more weeks | SOAP and REST, encryption, PDF statements, all Learn pages, deployed online |

Total: roughly 2 to 3 months part-time. **Do not wait for the full project before applying for jobs.** After the "Worth showing" milestone, the GitHub repo is already strong evidence; link it as in progress.

## Hosting

- **Oracle Cloud Always Free:** one free virtual machine (runs WildFly in Docker) and one free Autonomous Database. "Oracle" is the company; "Oracle Database" is their database (what the job means by Oracle); "Oracle Cloud" is their hosting service, like AWS. Sign-up asks for a card for identity checks; Always Free resources are not charged. Pick a nearby region such as Singapore
- **HTTPS is required.** Put Caddy in front of WildFly for free automatic certificates, using a free subdomain (e.g. DuckDNS) until the owner has a custom domain
- Write every setup step for a beginner in `docs/DEPLOY.md` in the card-system repo

## Wiring it into the portfolio

- Add an entry to `src/content/side-projects.ts`: `id: "card-system"`, `inspiredBy: "Finexus"`, `status: "in-progress"` once building starts, `href` set to the deployed URL once live
- `stack`: what was actually used (e.g. Java, Jakarta EE, WildFly, JSF, EJB, Hibernate, Oracle)
- Home card: a static screenshot in `public/projects/` (no live calls from the home page)
- Add a "View code" link to the GitHub repo. For Java recruiters the repo matters as much as the demo

## Open questions

- Final app and repo name ("Demo Bank" and `card-system` are placeholders)
- Whether Learn pages stay in the Java app or move to the portfolio later
- Custom domain (also on the portfolio roadmap)

## Done when

- [ ] Teller, back office, and Learn pages work on desktop and phone
- [ ] "Show what's happening" shows real steps for every action, with no secrets visible
- [ ] Concurrency test clearly shows the bug without locking and the fix with it
- [ ] REST and SOAP both authorize a purchase; WSDL is reachable
- [ ] Card numbers encrypted in the database, always masked on screen and in APIs
- [ ] Unit tests pass in CI; SonarCloud scan runs
- [ ] README: one-paragraph summary, architecture diagram, how to run locally. `docs/DESIGN.md` explains the OOP choices and JDBC vs JPA
- [ ] Deployed over HTTPS; nightly reset works
- [ ] Nothing resembles Finexus or CARDWORKS; no em dashes anywhere
