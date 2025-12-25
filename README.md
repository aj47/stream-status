<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Stream Status

A real-time stream overlay for displaying task status during live coding sessions. Features a control panel for managing tasks and an OBS-compatible overlay view.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Run the app:
   ```bash
   pnpm dev
   ```
3. Open http://localhost:3000 for the control panel
4. Open http://localhost:3000/status for the OBS overlay (transparent background)

## MCP Server

The app exposes an MCP (Model Context Protocol) server at `/mcp` that allows AI agents to manage tasks.

### Connect an AI Agent

Add to your MCP config (Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "stream-status": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Available Tools

#### `list_status`
Lists all current tasks and their statuses.

#### `update_status`
Manage tasks with the following actions:
- `add` - Add a new task (requires `taskName` and `status`)
- `remove` - Remove a task by name (requires `taskName`)
- `edit` - Edit a task (requires `taskName`, optional `newName` and `status`)
- `replace_all` - Replace the entire task list (requires `tasks` array)

**Valid status values:** `"done"`, `"building"`, `"todo"`

### Example Usage

```
# List all tasks
list_status

# Add a new task
update_status(action="add", taskName="New feature", status="todo")

# Mark a task as in progress
update_status(action="edit", taskName="New feature", status="building")

# Remove a task
update_status(action="remove", taskName="New feature")
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vite Dev Server                         │
├─────────────────────────────────────────────────────────────┤
│  /api/config  → GET/POST current config                    │
│  /api/stream  → SSE for real-time updates to browsers      │
│  /mcp         → MCP protocol endpoint for AI agents        │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
    Web Browser          OBS Browser          AI Agents
    (Control Panel)      (Status Page)     (Claude, Cursor)
```
