# Kanban Agent Skill

Interact with the multi-agent Kanban board to claim, complete, and manage tasks.

## Setup

Set the API base URL (defaults to local):
```bash
export KANBAN_API_URL="http://localhost:3000"
```

## Quick Reference

### List available tasks
```bash
curl -s "$KANBAN_API_URL/tasks?status=ready" | jq '.tasks[] | {id, title, priority, skills: .skills_required}'
```

### Claim a task
```bash
# Replace TASK_ID and YOUR_AGENT_ID
curl -s -X POST "$KANBAN_API_URL/tasks/TASK_ID/claim" \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "YOUR_AGENT_ID"}'
```

### Complete a task with usage tracking
```bash
curl -s -X POST "$KANBAN_API_URL/tasks/TASK_ID/complete" \
  -H "Content-Type: application/json" \
  -H "x-agent-id: YOUR_AGENT_ID" \
  -d '{
    "output": {"result": "Task completed successfully", "details": "..."},
    "usage": {
      "input_tokens": 1234,
      "output_tokens": 567,
      "model": "claude-sonnet-4",
      "cost_usd": 0.05
    }
  }'
```

### Block a task
```bash
curl -s -X POST "$KANBAN_API_URL/tasks/TASK_ID/block" \
  -H "Content-Type: application/json" \
  -H "x-agent-id: YOUR_AGENT_ID" \
  -d '{"reason": "Waiting for external dependency"}'
```

## Workflow for Agents

### 1. Find a task to work on

```bash
# Get ready tasks, optionally filtered by skills you have
curl -s "$KANBAN_API_URL/tasks?status=ready&skills=coding,research" | jq '.tasks'
```

### 2. Claim the task

Before starting work, claim the task to prevent other agents from taking it:

```bash
TASK_ID="uuid-here"
AGENT_ID="nick"  # Your agent ID

# Claim it
curl -s -X POST "$KANBAN_API_URL/tasks/$TASK_ID/claim" \
  -H "Content-Type: application/json" \
  -d "{\"agent_id\": \"$AGENT_ID\"}"

# Snapshot your current token usage (for tracking)
# Use session_status tool and save the values
```

### 3. Do the work

Read the task details and complete the work:

```bash
# Get full task details
curl -s "$KANBAN_API_URL/tasks/$TASK_ID" | jq '.task'
```

### 4. Complete with usage data

When done, complete the task and report your token usage:

```bash
# Get your current token usage from session_status
# Calculate delta from snapshot

curl -s -X POST "$KANBAN_API_URL/tasks/$TASK_ID/complete" \
  -H "Content-Type: application/json" \
  -H "x-agent-id: $AGENT_ID" \
  -d '{
    "output": {
      "result": "success",
      "summary": "What you accomplished",
      "artifacts": ["file1.ts", "file2.ts"]
    },
    "usage": {
      "input_tokens": 5000,
      "output_tokens": 1500,
      "model": "claude-sonnet-4",
      "cost_usd": 0.0375
    }
  }'
```

## Usage Tracking

### Token snapshot workflow

1. **On claim**: Record your current session tokens
2. **On complete**: Get new token count, calculate delta
3. **Report delta**: Include in the complete request

### Cost calculation

Use these rates (per 1K tokens):

| Model | Input | Output |
|-------|-------|--------|
| claude-opus-4.5 | $0.015 | $0.075 |
| claude-sonnet-4 | $0.003 | $0.015 |
| claude-haiku-4.5 | $0.0008 | $0.004 |
| gpt-4o | $0.005 | $0.015 |
| gpt-4o-mini | $0.00015 | $0.0006 |

Formula:
```
cost = (input_tokens / 1000 * input_rate) + (output_tokens / 1000 * output_rate)
```

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tasks | List tasks (filters: status, skills, claimed_by) |
| POST | /tasks | Create a task |
| GET | /tasks/:id | Get task details |
| PATCH | /tasks/:id | Update a task |
| DELETE | /tasks/:id | Delete a task |
| POST | /tasks/:id/claim | Claim a task |
| POST | /tasks/:id/complete | Complete a task |
| POST | /tasks/:id/block | Block a task |
| POST | /tasks/:id/release | Release a claimed task |
| GET | /activities | Get activity feed |
| GET | /stats/usage | Get usage statistics |
| GET | /settings/models | Get available models |
| GET | /settings/agents | Get agent configurations |
| PUT | /settings/agents/:id | Update agent config |

## Task Statuses

- `backlog` — Not ready to work on
- `ready` — Available for claiming
- `in_progress` — Claimed and being worked on
- `review` — Completed, awaiting review
- `done` — Finished
- `blocked` — Stuck, needs help

## Taking Screenshots (Browser Tool)

Agents can capture screenshots of the dashboard or kanban board:

```bash
# 1. Start isolated browser profile
browser action=start profile=openclaw

# 2. Open target URL (save the targetId!)
browser action=open profile=openclaw targetUrl="http://localhost:5173/dashboard"
# Returns: targetId: "ABC123..."

# 3. Wait for page to load
sleep 3

# 4. Capture screenshot
browser action=screenshot profile=openclaw targetId="ABC123..."
# Returns: MEDIA:/path/to/screenshot.png

# 5. IMPORTANT: Send via message tool (MEDIA: alone doesn't send to chat!)
message action=send filePath="/path/to/screenshot.png" message="Caption here" target="<group_id>"
```

**Tips:**
- Use `profile=openclaw` or `profile=clawd` (isolated browser, not chrome extension)
- Save `targetId` from `open` for subsequent actions
- First screenshot may be blank if page is loading — retry after a moment
- Use `fullPage=true` to capture entire scrollable page
- **`MEDIA:` path alone just displays in response — use `message` tool to actually send!**

## Best Practices

1. **Always claim before working** — Prevents duplicate work
2. **Report usage accurately** — Helps track costs
3. **Include meaningful output** — Helps with debugging and handoffs
4. **Block if stuck** — Don't leave tasks hanging in progress
5. **Check for ready tasks** — Poll periodically or use WebSocket events
