# KODIACK STUDIO - MASTER ARCHITECTURE DOCUMENT
## The Complete Blueprint for the Unified Development Platform
### Created: December 19, 2025
### Version: 1.0.0

---

# TABLE OF CONTENTS

1. [Vision & Purpose](#vision--purpose)
2. [The Big Picture](#the-big-picture)
3. [Port Architecture](#port-architecture)
4. [AI Team Structure](#ai-team-structure)
5. [The Data Pipeline](#the-data-pipeline)
6. [Application Structure](#application-structure)
7. [Universal Dashboard](#universal-dashboard)
8. [The 5 Tabs (Work Areas)](#the-5-tabs-work-areas)
9. [File & Folder Structure](#file--folder-structure)
10. [Architecture Rules](#architecture-rules)
11. [Server Organization](#server-organization)
12. [Future Scaling Considerations](#future-scaling-considerations)
13. [Migration Plan](#migration-plan)
14. [Glossary](#glossary)

---

# VISION & PURPOSE

## What Is Kodiack Studio?

Kodiack Studio is a **unified development platform** that serves as the central command center for all development operations. It is designed to:

- Manage multiple clients and their projects under one roof
- Provide developers with all tools needed without leaving the platform
- Enable AI-assisted development through a team of specialized AI workers
- Track time, tasks, and progress automatically
- Scale from a solo developer to a full development team
- Give each developer their OWN AI team that works exclusively for them

## Why Are We Building This?

1. **One Source of Truth** - No more jumping between apps, tabs, or tools
2. **AI-Augmented Development** - Each dev gets their own AI team (Claude, Chad, Jen, Susan, 2 Testers)
3. **Team Ready** - Built to scale with proper isolation and structure
4. **Client Management** - Handle multiple clients (Kodiack, Premier Group, future clients)
5. **Production Ready** - Built properly from the start, won't need major restructuring
6. **Worker Isolation** - Dev A cannot affect Dev B's workers, ever

## Long-Term Benefits

| Benefit | How It Helps |
|---------|--------------|
| **Developer Productivity** | Everything in one place, personal AI team handles busywork |
| **Quality Assurance** | 2 testers per dev - one automated, one puppeted |
| **Documentation** | Clair documents for entire team after hours |
| **Knowledge Retention** | Each dev's Susan stores their institutional knowledge |
| **Task Management** | Ryan orchestrates globally, devs stay productive |
| **Capture Everything** | Each dev's Chad logs their conversations |
| **Scalability** | Add devs (up to 10), each gets their own AI team |
| **Isolation** | One dev's crash doesn't affect others |

---

# THE BIG PICTURE

## Visual Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           KODIACK STUDIO (:5500)                                 │
│                         The Unified Interface                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  HEADER (Universal - Never Changes)                                      │    │
│  │  [LOGO] [Servers][Dev Tools][HelpDesk][Calendar][Studio] [Chat][AI][S][X]│    │
│  │    ↑                                                                     │    │
│  │    └── Click = Universal Dashboard (personalized per user)               │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  GRADIENT BANNER BAR                                                     │    │
│  │  [Production Status v] [<-] Page Title                                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌────────┬────────────────────────────────────────────────────────────────┐    │
│  │        │                                                                │    │
│  │  ICON  │              CONTENT AREA                                      │    │
│  │  SIDE  │              (Full Page - No Blink on Navigation)              │    │
│  │  BAR   │                                                                │    │
│  │        │              Each tab has its own sidebar icons                │    │
│  │   🖥️   │              Each icon = Full page view                        │    │
│  │   📊   │                                                                │    │
│  │   🔑   │                                                                │    │
│  │        │                                                                │    │
│  └────────┴────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

# PORT ARCHITECTURE

## Port Numbering Scheme

```
54 [DEV] [WORKER]
    │      │
    │      └── 0-7 = Worker assignment within team
    │
    └── 0 = Global AI team (shared)
        1 = Dev A's team
        2 = Dev B's team
        3 = Dev C's team
        4 = Dev D's team
        ...
        9 = Dev J's team (up to 10 devs)

55XX = Dashboard/UI Services
56XX = Integration Services (Zoom, Meet, etc.)
```

## At A Glance - Port Decoding

```
See port 5423?
├── 54 = AI worker range
├── 2  = Dev B's team
└── 3  = Worker #3 (Susan)
Answer: "That's Dev B's Susan"

See port 5401?
├── 54 = AI worker range
├── 0  = Global team
└── 1  = Worker #1 (Clair)
Answer: "That's the shared Clair"

See port 5500?
├── 55 = Dashboard range
└── 00 = Main UI
Answer: "That's the Kodiack Studio interface"
```

---

## Complete Port Map

### 540X - GLOBAL AI TEAM (Shared Across All Devs)

| Port | Worker | Role | Notes |
|------|--------|------|-------|
| **5400** | Ryan | Orchestration Lead | Manages roadmap, assigns tasks, sees all |
| **5401** | Clair | Documentation Specialist | Todos, journals, doc updates, works after hours |
| **5402** | *reserved* | Future global AI | |
| **5403** | *reserved* | Future global AI | |
| **5404** | *reserved* | Future global AI | |
| **5405** | *reserved* | Future global AI | |
| **5406** | *reserved* | Future global AI | |
| **5407** | *reserved* | Future global AI | |
| **5408** | Chat Service | Slack-like messaging | Dev-to-dev and dev-to-AI chat |
| **5409** | Task Orchestrator | Ryan 2.0 | Advanced task queue backend |

### 541X - DEV A's AI TEAM

| Port | Worker | Role | Notes |
|------|--------|------|-------|
| **5410** | Claude-A | Coding Assistant | Dev A's terminal connection |
| **5411** | Chad-A | Capture Specialist | Records Dev A's sessions |
| **5412** | Jen-A | Data Scrubber | Scrubs Dev A's captured data |
| **5413** | Susan-A | Classification | Categorizes Dev A's knowledge |
| **5414** | Tester-A1 | Automated Tester | Runs scripts 500x in background |
| **5415** | Tester-A2 | Puppeted Tester | Dev A writes scripts through this |
| **5416** | *reserved* | Future worker | |
| **5417** | *reserved* | Future worker | |

### 542X - DEV B's AI TEAM

| Port | Worker | Role | Notes |
|------|--------|------|-------|
| **5420** | Claude-B | Coding Assistant | Dev B's terminal connection |
| **5421** | Chad-B | Capture Specialist | Records Dev B's sessions |
| **5422** | Jen-B | Data Scrubber | Scrubs Dev B's captured data |
| **5423** | Susan-B | Classification | Categorizes Dev B's knowledge |
| **5424** | Tester-B1 | Automated Tester | Runs scripts in background |
| **5425** | Tester-B2 | Puppeted Tester | Dev B writes scripts through this |
| **5426** | *reserved* | Future worker | |
| **5427** | *reserved* | Future worker | |

### 543X - DEV C's AI TEAM

| Port | Worker | Role | Notes |
|------|--------|------|-------|
| **5430** | Claude-C | Coding Assistant | Dev C's terminal connection |
| **5431** | Chad-C | Capture Specialist | Records Dev C's sessions |
| **5432** | Jen-C | Data Scrubber | Scrubs Dev C's captured data |
| **5433** | Susan-C | Classification | Categorizes Dev C's knowledge |
| **5434** | Tester-C1 | Automated Tester | Runs scripts in background |
| **5435** | Tester-C2 | Puppeted Tester | Dev C writes scripts through this |
| **5436** | *reserved* | Future worker | |
| **5437** | *reserved* | Future worker | |

### 544X-549X - FUTURE DEV TEAMS

```
544X = Dev D's team (when hired)
545X = Dev E's team
546X = Dev F's team
547X = Dev G's team
548X = Dev H's team
549X = Dev I's team

Maximum: 10 developers, each with 8 workers
```

### 55XX - DASHBOARD/UI SERVICES

| Port | Service | Purpose |
|------|---------|---------|
| **5500** | Kodiack Studio UI | Main unified interface |
| **5501-5509** | *reserved* | Future UI services |

### 56XX - INTEGRATION SERVICES

| Port | Service | Purpose |
|------|---------|---------|
| **5600** | Client Interface | Zoom/Google Meet integration |
| **5601-5609** | *reserved* | Future integrations (Slack, GitHub, etc.) |

### OTHER SERVICES

| Port | Service | Purpose |
|------|---------|---------|
| **5432** | PostgreSQL | Database (standard PG port) |
| **7000** | Auth/Gateway | Authentication service |
| **7500** | Dashboard API | NextBid Core Dashboard API |

---

# AI TEAM STRUCTURE

## Per-Developer AI Team

Each developer gets their own isolated team of 6 AI workers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEV A's PERSONAL AI TEAM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   CLAUDE    │  │    CHAD     │  │    JEN      │             │
│  │   :5410     │  │   :5411     │  │   :5412     │             │
│  │  Coding     │  │  Capture    │  │  Scrubbing  │             │
│  │  Assistant  │  │  Sessions   │  │  Data       │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   SUSAN     │  │  TESTER 1   │  │  TESTER 2   │             │
│  │   :5413     │  │   :5414     │  │   :5415     │             │
│  │  Classify   │  │  Automated  │  │  Puppeted   │             │
│  │  Knowledge  │  │  Scripts    │  │  By Dev     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ISOLATION: Only Dev A can restart these workers               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Global AI Team (Shared)

Two workers serve the entire team:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL AI TEAM (SHARED)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐  │
│  │           RYAN              │  │         CLAIR           │  │
│  │          :5400              │  │         :5401           │  │
│  │    Orchestration Lead       │  │   Documentation Lead    │  │
│  ├─────────────────────────────┤  ├─────────────────────────┤  │
│  │ • Sees all dev calendars    │  │ • Updates all todos     │  │
│  │ • Assigns tasks to devs     │  │ • Writes daily journals │  │
│  │ • Manages roadmap           │  │ • Updates documentation │  │
│  │ • Prioritizes work          │  │ • Works after hours     │  │
│  │ • Checks completion         │  │ • Marks tasks complete  │  │
│  └─────────────────────────────┘  └─────────────────────────┘  │
│                                                                 │
│  ADMIN ONLY: Requires admin privileges to restart              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Worker Roles Explained

| Worker | Title | What They Do |
|--------|-------|--------------|
| **Claude** | Coding Assistant | The dev's AI pair programmer, code generation, debugging |
| **Chad** | Information Capture Specialist | Records ALL conversations (internal + external), session logging |
| **Jen** | Data Quality Analyst | Scrubs raw captures, extracts signals, flags bugs/features/todos/errors |
| **Susan** | Information Analyst | Categorizes knowledge, stores for retrieval, provides briefings |
| **Tester 1** | QA Analyst (Automated) | Runs test scripts repeatedly (500x), background testing while dev works |
| **Tester 2** | QA Analyst (Puppeted) | Dev writes test scripts through this tester, manual test creation |
| **Ryan** | Product Operations Manager | Global orchestrator, assigns work, manages roadmap (SHARED) |
| **Clair** | Technical Documentation Specialist | Todos, journals, doc updates, after-hours work (SHARED) |

---

## Worker Isolation Rules

```
┌─────────────────────────────────────────────────────────────────┐
│                      ISOLATION RULES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Dev A runs "restart chad" → Only restarts Chad-A (:5411)    │
│  ✅ Dev B runs "kill all workers" → Only kills Dev B's 541X     │
│  ✅ Dev C's Claude crashes → Dev A and B completely unaffected  │
│                                                                 │
│  ❌ Dev A CANNOT touch Dev B or C's workers                     │
│  ❌ No global kill commands affect other devs                   │
│  ❌ "kill all" scoped to YOUR worker set only                   │
│                                                                 │
│  🔒 Shared workers (Ryan/Clair) require ADMIN to restart        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# THE DATA PIPELINE

## Per-Developer Pipeline

Each dev has their own capture → scrub → classify pipeline:

```
DEV A WORKING
     │
     ▼
┌─────────────────┐
│    CHAD-A       │  ← Captures Dev A's sessions
│    :5411        │     Every 10 minutes dumps data
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     JEN-A       │  ← Scrubs Dev A's raw data
│    :5412        │     Flags: Bugs, Features, Todos, Errors
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    SUSAN-A      │  ← Categorizes for Dev A
│    :5413        │     Stores in Dev A's knowledge base
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     CLAIR       │  ← Global: Documents for everyone
│    :5401        │     Updates todos, writes journals
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     RYAN        │  ← Global: Orchestrates all devs
│    :5400        │     Assigns next task to Dev A
└─────────────────┘
```

## Session Hub Monitoring

The Session Hub shows real-time pipeline status for YOUR workers:

```
┌─────────────────────────────────────────────────────────────────┐
│  MY PIPELINE STATUS                              [Dev A View]   │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  📥 CHAD-A      │  🔍 JEN-A       │  📊 SUSAN-A                 │
│  Captures: 47   │  Scrubbing: 12  │  Categorized: 35            │
│  ● ONLINE       │  ● WORKING      │  ● WORKING                  │
│  Last: 2m ago   │  Queue: 8       │  Remaining: 12              │
│  [Restart]      │  [Restart]      │  [Restart]                  │
└─────────────────┴─────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  MY BUCKETS (Flagged by Jen-A)                                  │
├─────────────┬─────────────┬─────────────┬───────────────────────┤
│  🐛 Bugs    │  ✨ Features│  📝 Todos   │  ⚠️ Errors            │
│     15      │     23      │     8       │     3                 │
└─────────────┴─────────────┴─────────────┴───────────────────────┘
```

## Diagnostic Logic

| Symptom | Problem | Solution |
|---------|---------|----------|
| No session logs | Your Chad is stuck | Restart YOUR Chad |
| Buckets not increasing | Your Jen is stuck | Restart YOUR Jen |
| Numbers only going up | Your Susan isn't processing | Restart YOUR Susan |
| No new tasks appearing | Ryan or Clair stuck | Contact admin |

---

# TESTER WORKFLOW

## Two Testers Per Developer

```
DEV A working on NextBidder:
│
├── TESTER-A1 (:5414) - AUTOMATED
│   ├── Runs in background while dev works
│   ├── Executes: "Test login flow 500 times"
│   ├── Executes: "Stress test API endpoints"
│   ├── Results stored with NextBidder TEST instance
│   └── Reports failures to Dev A's dashboard
│
└── TESTER-A2 (:5415) - PUPPETED
    ├── Dev A writes test scripts through this tester
    ├── "Click signup, enter invalid email, verify error"
    ├── Tester-A2 executes step by step
    ├── Dev A refines the script
    └── Script saved → Given to Tester-A1 for automation
```

## Tester Data Isolation

```
Test results stay with the TEST INSTANCE of the program:

NextBidder-Test (:5001)
├── Tester-A1's results
├── Tester-B1's results (if assigned)
└── All test data for this project

NextTech-Test (:5002)
├── Tester-C1's results
└── All test data for this project

Testers are UNIVERSAL - they follow scripts
Scripts define what to test, not the tester
```

---

# CLAIR'S SCHEDULE

## During Work Hours

```
WHILE DEVS ARE WORKING:
├── Receives "task complete" notifications from devs
├── Updates todo list immediately
├── Ryan sees updates in real-time
├── Quick doc updates as needed
└── Light documentation work
```

## After Hours

```
WHEN DEVS GO OFFLINE:
├── Writes comprehensive daily journal entries
├── Processes all captured data from the day
├── Updates documentation based on new information
├── Reorganizes knowledge bases
├── Prepares briefings for tomorrow
└── No one working = no interruptions = deep work
```

---

# TASK FEEDER FLOW

## The Never-Ending Task Widget

```
┌─────────────────────────────────────────────────────────────────┐
│                    RYAN'S ORCHESTRATION                          │
└─────────────────────────────────────────────────────────────────┘

RYAN monitors continuously:
├── Roadmap (what's planned for each project)
├── Calendar (who's available today)
├── Overdue (what should have been done yesterday)
├── Completed (what Clair marked done)
└── Dev availability (who's working, who's off)
         │
         ▼
RYAN assigns task to DEV A
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  TASK FEEDER WIDGET (Dev A's Dashboard)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 CURRENT TASK                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Fix authentication bug in NextBidder login             │   │
│  │  Priority: HIGH  │  Due: Today  │  Est: 2 hours         │   │
│  │                                                         │   │
│  │  [Mark Done]  [Need Help]  [Blocked]                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📋 UP NEXT (3 tasks in queue)                                  │
│  • Implement password reset flow                               │
│  • Add email verification                                      │
│  • Update user profile page                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Dev clicks [Mark Done]
         ▼
RYAN receives completion
         │
         ▼
RYAN tells CLAIR: "Mark task X complete for Dev A"
         │
         ▼
CLAIR updates todo list, documents completion
         │
         ▼
RYAN assigns NEXT task to Dev A
         │
         ▼
CYCLE REPEATS (never-ending)
```

---

# APPLICATION STRUCTURE

## Navigation Model

```
CLICK LOGO ──────────────────────► UNIVERSAL DASHBOARD
                                   (Personalized home for each user)

CLICK TAB ───────────────────────► WORK AREA
                                   (Each tab has its own icon sidebar)

CLICK SIDEBAR ICON ──────────────► FULL PAGE VIEW
                                   (Content fills entire area, no blink)
```

## Header Components

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [🐻 LOGO]  [Servers][Dev Tools][HelpDesk][Calendar][Studio]  [💬][🤖][⚙][🚪] │
│     │          │         │         │         │        │        │   │   │  │  │
│     │          │         │         │         │        │        │   │   │  │  └─ Logout
│     │          │         │         │         │        │        │   │   │  └─── Settings
│     │          │         │         │         │        │        │   │   └────── AI Team Chat
│     │          │         │         │         │        │        │   └────────── Team Chat
│     │          │         │         │         │        │        └────────────── Studio Tab
│     │          │         │         │         │        └─────────────────────── Calendar Tab
│     │          │         │         │         └──────────────────────────────── HelpDesk Tab
│     │          │         │         └────────────────────────────────────────── Dev Tools Tab
│     │          │         └──────────────────────────────────────────────────── Servers Tab
│     │          └────────────────────────────────────────────────────────────── (tabs)
│     └───────────────────────────────────────────────────────────────────────── Click = Dashboard
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# UNIVERSAL DASHBOARD

## Purpose

The Universal Dashboard is the **personalized command center** for each logged-in user. It answers: "What do I need to know and do today?"

## Layout

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  Dashboard - Your daily overview                      [⚙️ Customize Widgets]  │
├───────────────────┬─────────────────────────────┬─────────────────────────────┤
│                   │                             │                             │
│  🔔 ALERTS &      │    WIDGET SLOT 3            │   📅 TODAY                  │
│  MESSAGES         │    (Phase Tracker)          │   Friday, Dec 19, 2025      │
│  ┌─────────────┐  │    ┌───────────────────┐    │                             │
│  │ ● 3 tickets │  │    │ NextBidder: 78%   │    │   9:00  Stand-up            │
│  │ ● 1 urgent  │  │    │ Portal: 45%       │    │   10:00 Dev work            │
│  └─────────────┘  │    │ NextTech: 92%     │    │   14:00 Code review         │
│                   │    └───────────────────┘    │                             │
│  ┌─────────────┐  ├─────────────────────────────┤   [+ Add Event]             │
│  │ TASK FEEDER │  │                             ├─────────────────────────────┤
│  │             │  │    WIDGET SLOT 4            │                             │
│  │ Fix auth    │  │    (Server Status)          │   QUICK ACTIONS             │
│  │ bug in      │  │    ┌───────────────────┐    │   [+ New Ticket]            │
│  │ NextBidder  │  │    │ All servers: ✅   │    │   [+ Add Task]              │
│  │             │  │    └───────────────────┘    │   [+ Schedule]              │
│  │ [Done][Skip]│  │                             │                             │
│  └─────────────┘  ├─────────────────────────────┤   TIMESHEET                 │
│                   │                             │   Today: 4h 32m             │
│  ┌─────────────┐  │    WIDGET SLOT 5            │   Week:  22h 15m            │
│  │ MY PROJECTS │  │    (AI Team Health)         │   [Clock In/Out]            │
│  │ - NextBidder│  │    ┌───────────────────┐    │                             │
│  │ - Portal    │  │    │ Your team: 6/6 ✅ │    │                             │
│  └─────────────┘  │    └───────────────────┘    │                             │
└───────────────────┴─────────────────────────────┴─────────────────────────────┘
```

## Available Widgets

| Widget | Description | Data Source |
|--------|-------------|-------------|
| **Alerts & Messages** | System alerts, urgent tickets | HelpDesk feed |
| **Task Feeder** | Never-ending task queue from Ryan | Ryan (:5400) |
| **Day Planner** | Today's schedule | Calendar |
| **Phase Tracker** | Progress on YOUR assigned projects | Project data |
| **My Projects** | Projects you're assigned to | Client/Project assignments |
| **Server Status** | Quick health check | Server monitoring |
| **AI Team Health** | YOUR worker status (6 workers) | Your 541X ports |
| **Timesheet** | Time tracking | TimeClock module |
| **Quick Actions** | Fast common tasks | Various |

---

# THE 5 TABS (WORK AREAS)

## Tab 1: Servers

**Purpose:** Monitor and manage production servers for all clients

**Sidebar Icons:**
| Icon | Page | Description |
|------|------|-------------|
| 🖥️ | Overview | All servers at a glance |
| 📊 | Tradelines | Tradeline engine monitoring |
| 🔑 | Credentials | Server credentials by type |
| ⚡ | Health | Server health metrics |

---

## Tab 2: Dev Tools

**Purpose:** Build, patch, and deploy to servers

**Sidebar Icons:**
| Icon | Page | Description |
|------|------|-------------|
| 🔧 | Controls | Dev controls and toggles |
| 📦 | Patches | Apply patches to projects |
| 🚀 | Deploy | Deployment management |
| 📝 | Logs | View application logs |

---

## Tab 3: HelpDesk

**Purpose:** Handle support tickets from servers and portal users

**Sidebar Icons:**
| Icon | Page | Description |
|------|------|-------------|
| 🎫 | Tickets | All tickets |
| 👥 | Portal Issues | Issues from Portal users |
| 📈 | Stats | Ticket statistics |

**Feeds:** Dashboard alerts widget

---

## Tab 4: Calendar

**Purpose:** Team scheduling and Ryan's command center

**Sidebar Icons:**
| Icon | Page | Description |
|------|------|-------------|
| 📅 | Schedule | Team calendar view |
| 🗺️ | Roadmap | Project roadmap (Ryan's view) |
| 👤 | Assignments | Who's working on what |
| ✅ | Availability | Team availability |

**Feeds:** Dashboard day planner widget

---

## Tab 5: Studio

**Purpose:** The creative space where engineers build, test, and fix

**WHERE THE TERMINAL LIVES** - Each dev's Claude connection is here

**Sidebar Icons (The 7):**
| Icon | Page | Description |
|------|------|-------------|
| ⚙️ | Projects | Project switching and management |
| 🌐 | Browser | Work on projects in-studio |
| 🎯 | Session Hub | YOUR Chad → Jen → Susan pipeline |
| 📁 | Docs | Project documentation (popout) |
| 💬 | Comms | Chat logs + Terminal capture |
| 🗄️ | Database | Schema + Storage monitoring |
| 🤖 | AI Team | YOUR 6 workers status/control |

---

# FILE & FOLDER STRUCTURE

## Complete Project Structure

```
/var/www/Kodiack_Studio/kodiack-dashboard-5500/
│
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout (shell - never reloads)
│   │   ├── page.tsx                      # Login/home
│   │   │
│   │   ├── dashboard/                    # UNIVERSAL DASHBOARD
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── AlertsWidget.tsx
│   │   │       ├── TaskFeederWidget.tsx
│   │   │       ├── DayPlannerWidget.tsx
│   │   │       ├── PhaseTrackerWidget.tsx
│   │   │       ├── ProjectsWidget.tsx
│   │   │       ├── TimesheetWidget.tsx
│   │   │       ├── AITeamHealthWidget.tsx
│   │   │       ├── WidgetSlot.tsx
│   │   │       └── WidgetCustomizer.tsx
│   │   │
│   │   ├── servers/                      # TAB 1: SERVERS
│   │   │   ├── layout.tsx                # Servers sidebar
│   │   │   ├── page.tsx
│   │   │   ├── tradelines/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   ├── credentials/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   ├── health/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   └── components/
│   │   │       └── ServersSidebar.tsx
│   │   │
│   │   ├── dev-tools/                    # TAB 2: DEV TOOLS
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── controls/
│   │   │   ├── patches/
│   │   │   ├── deploy/
│   │   │   ├── logs/
│   │   │   └── components/
│   │   │       └── DevToolsSidebar.tsx
│   │   │
│   │   ├── helpdesk/                     # TAB 3: HELPDESK
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── tickets/
│   │   │   ├── portal-issues/
│   │   │   ├── stats/
│   │   │   └── components/
│   │   │       └── HelpDeskSidebar.tsx
│   │   │
│   │   ├── calendar/                     # TAB 4: CALENDAR
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── roadmap/
│   │   │   ├── assignments/
│   │   │   ├── availability/
│   │   │   └── components/
│   │   │       └── CalendarSidebar.tsx
│   │   │
│   │   ├── studio/                       # TAB 5: STUDIO
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   ├── browser/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   ├── session-hub/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   ├── docs/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   ├── comms/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   ├── database/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   ├── ai-team/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   └── components/
│   │   │       └── StudioSidebar.tsx
│   │   │
│   │   ├── settings/
│   │   │   ├── clients/
│   │   │   ├── users/
│   │   │   └── preferences/
│   │   │
│   │   └── api/
│   │
│   ├── modules/                          # ISOLATED MODULES
│   │   ├── ai-workers/
│   │   │   ├── chad/
│   │   │   ├── jen/
│   │   │   ├── susan/
│   │   │   ├── tester/
│   │   │   ├── ryan/
│   │   │   └── clair/
│   │   ├── terminal/
│   │   ├── timeclock/
│   │   └── notifications/
│   │
│   ├── components/
│   │   ├── shell/                        # Header, Navigation (universal)
│   │   ├── dropdowns/                    # Chat, AI, Settings dropdowns
│   │   └── ui/                           # Basic primitives only
│   │
│   └── lib/                              # Core utilities only
│
├── public/
├── package.json
└── next.config.js
```

---

# ARCHITECTURE RULES

## Rule 1: Self-Contained Folders

Each feature folder contains its own components. NO shared component folders between features.

```
✅ CORRECT:
/studio/session-hub/components/WorkerCard.tsx
/studio/ai-team/components/WorkerCard.tsx     ← DUPLICATE IS OK

❌ WRONG:
/shared/components/WorkerCard.tsx             ← DON'T DO THIS
```

## Rule 2: Isolation > DRY

If a component is needed in multiple places, **DUPLICATE IT**.

- Each module can be updated independently
- No breaking changes across features
- Easier to debug
- Can delete entire folder without breaking others

## Rule 3: Limited Exceptions

Only these can be shared:
- `/components/shell/` - Header, navigation (truly universal)
- `/components/ui/` - Basic primitives (Button, Input, Card)
- `/lib/` - Core utilities (database, auth)

## Rule 4: Worker Isolation

Each dev's workers are completely isolated:
- Dev A's code cannot import from Dev B's workers
- Workers communicate via API calls only
- Restart commands are scoped to YOUR workers

---

# SERVER ORGANIZATION

## Droplet Structure

```
/var/www/
│
├── Kodiack_Studio/                       # CLIENT: Kodiack
│   ├── kodiack-dashboard-5500/           # Main unified app
│   ├── dev-studio-5000/                  # Legacy (being migrated)
│   ├── ai-workers/                       # AI worker services
│   │   ├── global/                       # Ryan, Clair (540X)
│   │   ├── dev-a/                        # Dev A's team (541X)
│   │   ├── dev-b/                        # Dev B's team (542X)
│   │   └── dev-c/                        # Dev C's team (543X)
│   └── auth-7000/
│
├── Premier_Group/                        # CLIENT: Premier
│   ├── NextBid_Engine/
│   │   ├── dev/5100/
│   │   └── test/5000/
│   ├── NextBid_Sources/
│   │   ├── dev/5103/
│   │   └── test/5003/
│   ├── NextBidder/
│   │   ├── dev/5101/
│   │   └── test/5001/
│   ├── NextBid_Portal/
│   │   ├── dev/5104/
│   │   └── test/5004/
│   ├── NextBid_Core/
│   │   ├── gateway-7000/
│   │   └── dashboard-7500/
│   └── NextTech/
│       ├── dev/5102/
│       └── test/5002/
│
└── [Future_Clients]/
```

---

# FUTURE SCALING CONSIDERATIONS

## Adding a New Developer

1. Assign dev letter (D, E, F, etc.)
2. Spin up their AI team on 544X, 545X, etc.
3. Create their worker folder in `/ai-workers/dev-d/`
4. They appear in Calendar availability
5. Ryan can now assign tasks to them
6. No code changes needed - just infrastructure

## Adding More Global AI Workers

Use reserved ports 5402-5407:
- 5402: Security Analyst
- 5403: Performance Monitor
- 5404: Client Communication Bot
- etc.

## Integration Services

Use 56XX range:
- 5600: Zoom/Meet integration
- 5601: Slack integration
- 5602: GitHub integration
- 5603: Email service

---

# MIGRATION PLAN

## Phase 1: Foundation (Current)
- [x] Server folder reorganization
- [x] Port documentation
- [x] Architecture planning
- [x] Master document created

## Phase 2: Dashboard Enhancement
- [ ] Icon sidebar system
- [ ] Universal Dashboard with widgets
- [ ] Task Feeder widget
- [ ] Widget customization

## Phase 3: Tab Restructuring
- [ ] Servers tab with icon sidebar
- [ ] Dev Tools tab with icon sidebar
- [ ] HelpDesk tab with icon sidebar
- [ ] Calendar tab with icon sidebar

## Phase 4: Studio Migration
- [ ] Migrate from :5000 to Studio tab
- [ ] Projects page
- [ ] Browser page
- [ ] Session Hub page
- [ ] AI Team page (shows YOUR 6 workers)

## Phase 5: Multi-Dev Infrastructure
- [ ] Per-dev worker deployment
- [ ] Worker isolation enforcement
- [ ] Restart command scoping

## Phase 6: Polish
- [ ] Performance optimization
- [ ] Testing
- [ ] Documentation

---

# GLOSSARY

| Term | Definition |
|------|------------|
| **Universal Dashboard** | Personalized home page with customizable widgets |
| **Task Feeder** | Never-ending task queue managed by Ryan |
| **Pipeline** | Chad captures → Jen scrubs → Susan classifies |
| **Session Hub** | Real-time monitoring of YOUR pipeline |
| **Icon Sidebar** | Vertical icon-based navigation within each tab |
| **Widget** | Customizable component on the dashboard |
| **Worker Set** | The 6 AI workers assigned to each developer |
| **Global Workers** | Ryan and Clair, shared across all devs |
| **Shell** | The persistent header/nav that never reloads |

---

# DOCUMENT HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 19, 2025 | Initial comprehensive document |

---

# SIGN-OFF

This document represents the complete architecture for Kodiack Studio as planned on December 19, 2025.

**Key Decisions:**
- Port scheme: 54[DEV][WORKER] for clean identification
- Per-dev AI teams: 6 workers each (Claude, Chad, Jen, Susan, 2 Testers)
- Global workers: Ryan (orchestration) and Clair (documentation)
- Isolation: Devs cannot affect each other's workers
- Scalability: Up to 10 devs, 8 workers each

All future development should reference this document.

---

*Document generated during planning session*
*Captured by Chad for future reference*
*Stored by Susan in knowledge base*
