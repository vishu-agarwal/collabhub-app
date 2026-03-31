# CollabHub

CollabHub is a lightweight collaboration platform with channel-based chat and task management.

## Submission Summary

This README is written as the assessment document and includes:

- Summary of completed fixes
- Code review findings
- Brief bug explanations
- Refactoring direction
- Execution plan and timeline
- Team lead thinking and prioritization

## Completed Improvements

The following items were completed in this submission.

### 1. Chat messages appearing multiple times

**Issue**

Chat messages were being rendered multiple times in some cases.

**Root cause**

- Realtime message flow and API persistence flow were overlapping.
- The UI was able to append the same message more than once.

**What was done**

- Simplified chat flow so persisted data becomes the source of truth.
- Cleaned up message event handling to prevent duplicate rendering.
- Scoped chat delivery more safely to the current channel flow.

### 2. Task creation and status updates not reflected properly in UI

**Issue**

Task create/update operations were not consistently reflected in the task list.

**Root cause**

- Frontend and backend task event flow were not aligned.
- Task list refresh was dependent on inconsistent response/event handling.

**What was done**

- Corrected the task update flow between backend and frontend.
- Ensured the UI refreshes using the proper task update event path.
- Fixed task list synchronization after create/update operations.

### 3. `/api/channels` continuous calling issue

**Issue**

The channels API was being called repeatedly.

**Root cause**

- `fetchChannels()` had `channels` as an effect dependency in `client/src/components/Layout.jsx`.
- Since `fetchChannels()` updates `channels`, it retriggered the same effect repeatedly.

**What was done**

- Updated the fetch behavior so channel data loads on mount instead of refetching on every channel state update.

## Package Review

I checked `package.json` first.

### Current observation

- Root `package.json` does not have a `start` script.
- Current scripts are:
  - `server`
  - `client`
  - `install:all`

### Recommendation

- Add a root `start` script or separate production-ready run scripts for easier project execution and handoff.

## Code Review Points

### Top 3 critical issues in the codebase

#### 1. Security and configuration handling

Sensitive values such as `MONGO_URI` and `JWT_SECRET` are hardcoded in source instead of being managed through environment variables.

**Why this is critical**

- Security exposure
- Harder deployment management
- Unsafe logging risk

**Suggested improvement**

- Move `MONGO_URI` and `JWT_SECRET` into `.env`
- Keep `.env` out of version control
- Centralize configuration access in one backend config module

#### 2. Validation and data integrity are weak

Validation is incomplete on both frontend and backend. Duplicate user registration, empty fields, invalid auth flow, and weak task input handling are possible.

**Why this is critical**

- Bad data gets stored
- Poor user experience
- Unclear error behavior

**Suggested improvement**

- Add frontend validation before calling APIs
- Add backend schema/request validation
- Prevent duplicate users by validating email/username uniqueness
- Return proper status codes and structured error responses

#### 3. Architecture and maintainability need improvement

The project has large UI files, inline styles, duplicated API config, direct business logic inside routes, and no clean controller/service separation.

**Why this is critical**

- Harder to maintain
- Harder to scale
- More regression risk as features grow

**Suggested improvement**

- Move backend logic into controllers/services
- Separate DB connection and socket connection setup
- Move reusable frontend UI into dedicated components
- Introduce shared API config, helpers, loader, error component, auth layout, and centralized state management

## Detailed Review Findings

### Authentication and session handling

- Sign-in should not call API when fields are empty.
- Sign-in button should be disabled or validation should stop submission before API call.
- Current behavior can show `User not found` even for empty form state, which is misleading.
- Logout should call an API so backend session/token handling is also managed.
- Logout currently clears only token; all related auth data should be cleared properly.
- Local storage currently stores more response data than necessary.
- Registration allows duplicate users.
- Registration validation is weak on both frontend and backend.
- A user can be registered without proper password validation.
- Password handling in response/payload behavior is inconsistent and unsafe.

### API behavior and status handling

- Proper error handling and status codes are missing in several flows.
- Task creation needs frontend validation in addition to backend handling.
- CRUD operations should show success/error toast feedback to the user.
- API response structures should be standardized.
- `/api/channels` was continuously calling and required dependency fix.
- Channel switching can still cause repeated API calls and should be reviewed carefully.
- `tasks/:channelId` was reported as calling twice in some transitions and should be normalized.

### Chat and channel behavior

- Chat opens at the last message instead of starting from the top as expected for initial view.
- Members should be previewed clearly inside a channel.
- Member addition flow needs proper handling.
- Channel/member behavior currently feels partially auto-derived instead of intentionally managed.

### Task management behavior

- Task creation was handled on backend but not reflected correctly on frontend until sync was fixed.
- Task list should update immediately after create/update/delete operations.
- Task items should be sorted with newest items at the top.

### Frontend code quality

- `API_URL` and `SOCKET_URL` should come from environment variables, not hardcoded values.
- Shared configuration should not be duplicated across multiple files.
- Inline `style` usage should be minimized in favor of a clear UI approach such as Tailwind or MUI `sx`.
- Separate CSS/SCSS or styling strategy should be used for maintainability.
- Form state handling can be simplified using shared handlers and grouped state objects.
- A reusable error component should be created.
- A separate loader component should be created.
- An auth layout should wrap shared auth pages to avoid duplicated UI code.
- Static UI helper arrays should be moved into helper/utils files.
- Reusable dialog components should live in their own files.
- Layout should be split into reusable parts such as header/footer/sidebar where applicable.

### Backend code quality

- `.env` values such as `MONGO_URI` and `JWT_SECRET` should be removed from source code.
- DB connection and socket connection should be separated into dedicated setup files.
- Route files should define routes only.
- Request/response handling should move into controllers.
- Business logic should move into services.
- Validation should be centralized.
- Proper response status code strategy should be followed consistently.

### Repository hygiene

- `node_modules` should be ignored in both root and nested projects.
- `.env` should be ignored.
- `.gitignore` should be properly managed for both frontend and backend concerns.

## Hidden / Additional Issues Identified

In addition to the required bugs, the following important issues were identified during review:

- Missing root `start` script in `package.json`
- Duplicate registration/user validation gaps
- Empty auth forms still triggering backend calls
- Local storage storing raw response data instead of minimal auth state
- Logout flow not fully handled
- Repeated API calls caused by effect dependency issues
- Hardcoded environment URLs in frontend
- Missing toast feedback after CRUD operations
- Missing reusable loader and error handling components
- Missing clean separation of controllers/services on backend

## Bug Explanations Brief

### Bug 1: Duplicate chat messages

- Root cause: overlapping realtime/API flow and duplicate append behavior
- Fix approach: use a cleaner single source of truth for message flow

### Bug 2: Task create/status update not reflecting

- Root cause: task sync mismatch between backend responses, realtime events, and frontend state
- Fix approach: align update flow and refresh the correct UI state after operations

### Bug 3: `/api/channels` continuous calling

- Root cause: wrong React effect dependency loop in `Layout`
- Fix approach: fetch once on mount rather than refetching after every channel state update

## Refactoring Approach

This assessment does not require a full refactor, but the project would benefit from a cleaner structure.

### Current architectural issues

- Large page components managing too many responsibilities
- Repeated API configuration and side-effect logic
- Route files mixing routing with business logic
- Realtime concerns not isolated cleanly
- Styling strategy not standardized
- No proper global state approach for shared app data

### Proposed backend structure

- `config/`
- `db/`
- `socket/`
- `routes/`
- `controllers/`
- `services/`
- `validators/`
- `middleware/`
- `models/`

### Proposed frontend structure

- `api/`
- `components/`
- `layouts/`
- `features/auth/`
- `features/chat/`
- `features/tasks/`
- `context/` or `store/`
- `hooks/`
- `utils/`
- `styles/`

### Architectural improvements to introduce

- Centralized API client and env configuration
- Proper controller/service separation
- Reusable UI components and layouts
- Shared loader, error, toast, and dialog system
- Global state using Context API or Redux
- Cleaner form state management patterns

### What I would prioritize first

1. Authentication validation and logout/session correctness
2. Repeated API call issues and state synchronization
3. Task and channel UX correctness
4. Config/security cleanup
5. Structural refactor for maintainability

## Execution Plan for Full SOW Delivery

Based on the SOW, the target is not only to patch bugs, but to make the system meet the expected deliverables:

- Functional authentication flow
- Working channel system
- Real-time chat functionality
- Task management within channels
- Basic UI for all features

From a team lead perspective, with 2 developers plus me driving planning, review, and unblocking, the minimum practical timeline to complete the full SOW in a controlled way is **6 working days**. Anything shorter would likely produce unstable delivery because authentication, realtime behavior, validation, task sync, and structural cleanup are all connected.

### Team structure

- **Developer 1**
  - Backend ownership
  - Auth, validation, API contracts, DB cleanup, socket/backend integration

- **Developer 2**
  - Frontend ownership
  - UI validation, shared components, state management, task/chat/channel UX

- **My role as Team Lead**
  - Break down scope from SOW into daily deliverables
  - Align frontend/backend contracts
  - Review code quality after each completed task
  - Review pull requests/branches and keep branch movement clean and controlled
  - Review architecture decisions
  - Unblock developers quickly
  - Help developers when they get stuck on implementation or debugging
  - Test whether the application is working as expected after each task completion
  - Validate progress against the SOW, not only against bugs
  - Perform final integration review and delivery decision
  - If I have available time, I will also support implementation directly by taking part of the work after dividing ownership clearly

### Priority from SOW perspective

#### Priority 1: Authentication must be stable

- Register/login validation
- Duplicate-user prevention
- Proper session/logout handling
- Correct local storage usage
- Proper response codes and error handling

#### Priority 2: Channel system must be reliable

- Channel listing
- Channel creation/joining
- Member preview
- Fix repeated `/api/channels` calls
- Remove repeated task/channel fetch behavior during navigation

#### Priority 3: Real-time chat must work correctly

- No duplicate messages
- Channel-scoped message delivery
- Correct scroll behavior
- Member presence visibility where needed

#### Priority 4: Task management must fully reflect SOW

- Create task
- Assign task to channel member
- Update task status
- Show latest task list correctly
- Real-time task refresh
- Show newest tasks first

#### Priority 5: Delivery quality and maintainability

- `.env` and `.gitignore` cleanup
- Move hardcoded URLs/config to env
- Reusable loader/error/toast/dialog/auth layout
- Better component structure
- Service/controller separation in backend

### Minimum practical timeline: 6 working days

#### Day 1: Authentication stabilization

- Fix empty login/register submission handling
- Add frontend validation for auth forms
- Add backend validation for register/login
- Prevent duplicate user registration
- Remove unsafe auth response handling
- Correct local storage strategy

**Team lead focus**

- Freeze auth API contract
- Review validation/error response structure
- Confirm exact accepted/failed auth scenarios

#### Day 2: Session, logout, and config cleanup

- Implement logout API flow
- Clear auth/session state properly on logout
- Move `MONGO_URI`, `JWT_SECRET`, `API_URL`, and `SOCKET_URL` to environment configuration
- Update `.gitignore` for `.env` and `node_modules`

**Team lead focus**

- Validate secure config handling
- Check deployment/run instructions remain simple

#### Day 3: Channel system and repeated API call fixes

- Fix `fetchChannels` dependency loop completely
- Review repeated API calls on channel switching
- Normalize channel/member fetch behavior
- Improve channel member preview in UI
- Review member add/join flow behavior

**Team lead focus**

- Confirm channel flows match SOW:
  - create channel
  - join channel
  - view list of channels
  - view channel members

#### Day 4: Chat and realtime stabilization

- Validate duplicate chat fix fully
- Ensure room-based message flow is correct
- Adjust chat open/scroll behavior
- Improve feedback and error handling in chat actions
- Add toast feedback for success/failure interactions

**Team lead focus**

- Run integration checks on multi-user channel chat scenarios
- Confirm real-time chat meets SOW expectation

#### Day 5: Task management completion

- Fix task create flow end-to-end
- Add frontend task validation
- Standardize task API responses/status codes
- Ensure task list refresh after create/update
- Show newest tasks first
- Validate assignment and status changes per channel

**Team lead focus**

- Confirm task flow meets SOW:
  - create
  - assign
  - update status
  - view per channel
  - reflect updates in real time

#### Day 6: Structure hardening and release readiness

- Add reusable loader/error/dialog/auth layout components
- Reduce duplicated state/input handling where practical
- Separate backend connection/config layers
- Organize route/controller/service responsibilities
- Final regression pass
- Final README/submission review

**Team lead focus**

- Final QA checklist against SOW
- Cut non-essential polish if needed
- Approve only stable deliverables for submission

### Delivery approach as Team Lead

My decision would be to manage this as a **stabilize-first, structure-second** delivery. The SOW expects working authentication, channels, chat, tasks, and basic UI. That means the first responsibility is not visual polish or broad refactoring; it is to make the core flows correct, predictable, and testable.

I would run the team with:

1. Daily scope lock for what must be completed by end of day
2. Shared API/socket contract review before implementation changes
3. Midday integration check between frontend and backend
4. End-of-day verification against SOW items, not just code completion
5. Code review for quality, maintainability, and consistency before merging work
6. Branch discipline so each developer works in a controlled area and integration stays predictable
7. Functional testing after each completed task to confirm the application still behaves correctly
8. Active support for blockers so no developer stays stuck for long

### Why 6 days is the minimum practical estimate

- Auth, session, and validation issues affect almost every flow
- Channel, chat, and task behaviors are interdependent
- Realtime bugs require integration testing, not only code changes
- Several issues are structural and cannot all be solved safely in 2-3 days
- The team still needs review, regression checking, and final integration time

## My Understanding of the System

CollabHub is a collaboration tool where channels act as shared workspaces for chat and task tracking. The system already has the core building blocks, but the main issue is that integration quality is inconsistent across auth, channels, tasks, and realtime behavior. The work needed is less about inventing new features and more about stabilizing behavior, improving validation, and introducing maintainable structure.

## How I Approached Solving It

- Started with the most visible bugs affecting user trust
- Traced frontend and backend behavior together instead of reviewing files in isolation
- Focused on delivery-safe fixes first
- Documented the remaining structural and validation gaps for realistic next steps

## Team Lead Thinking

My approach is to treat this as a partially working product that needs stability, clarity, and delivery discipline more than a large rewrite. I would avoid broad refactoring at the start. First I would fix the issues users feel immediately: auth validation, chat/task reliability, repeated API calls, and response handling. After that, I would align the team around shared API contracts, shared UI patterns, and clear ownership between frontend and backend. That gives faster delivery now and reduces defect rate later.

## Run Project

### Requirements

- Node.js v18+
- MongoDB

### Install

```bash
npm run install:all
```

### Run

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

- Frontend: `http://localhost:3000`
- API: `http://localhost:5000`
