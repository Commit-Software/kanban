#!/usr/bin/env bash
# kanban-cli.sh — Helper script for Kanban task operations with usage tracking
# Usage: ./kanban-cli.sh <command> [args]

set -e

KANBAN_API_URL="${KANBAN_API_URL:-http://localhost:3000}"
KANBAN_TOKEN="${KANBAN_TOKEN:-}"
SNAPSHOT_DIR="${KANBAN_SNAPSHOT_DIR:-/tmp/kanban-snapshots}"

mkdir -p "$SNAPSHOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

auth_header() {
  if [[ -n "$KANBAN_TOKEN" ]]; then
    echo "-H" "Authorization: Bearer $KANBAN_TOKEN"
  fi
}

check_auth() {
  if [[ -z "$KANBAN_TOKEN" ]]; then
    echo -e "${RED}❌ Error: KANBAN_TOKEN environment variable is not set${NC}"
    echo -e "   Run 'kanban-cli.sh login <email> <password>' to get a token"
    echo -e "   Then: export KANBAN_TOKEN=<your_token>"
    exit 1
  fi
}

usage() {
  echo "Kanban CLI — Multi-agent task coordination"
  echo ""
  echo "Usage: $0 <command> [args]"
  echo ""
  echo "Commands:"
  echo "  login <email> <password> Get auth token (save to KANBAN_TOKEN)"
  echo "  whoami                  Show current user info"
  echo "  list [status]           List tasks (default: ready)"
  echo "  show <task_id>          Show task details"
  echo "  claim <task_id> <agent> Claim a task"
  echo "  complete <task_id> <agent> <input_tokens> <output_tokens> <model>"
  echo "                          Complete a task with usage data"
  echo "  block <task_id> <agent> <reason>"
  echo "                          Block a task"
  echo "  release <task_id> <agent>"
  echo "                          Release a claimed task"
  echo "  stats                   Show usage statistics"
  echo ""
  echo "Environment:"
  echo "  KANBAN_API_URL          API base URL (default: http://localhost:3000)"
  echo "  KANBAN_TOKEN            Authentication token (required for most commands)"
  echo "  KANBAN_SNAPSHOT_DIR     Snapshot storage (default: /tmp/kanban-snapshots)"
}

# Calculate cost based on model
calc_cost() {
  local input=$1
  local output=$2
  local model=$3
  
  case "$model" in
    claude-opus-4.5|*opus*)
      echo "scale=4; ($input / 1000 * 0.015) + ($output / 1000 * 0.075)" | bc
      ;;
    claude-sonnet-4|*sonnet*)
      echo "scale=4; ($input / 1000 * 0.003) + ($output / 1000 * 0.015)" | bc
      ;;
    claude-haiku-4.5|*haiku*)
      echo "scale=4; ($input / 1000 * 0.0008) + ($output / 1000 * 0.004)" | bc
      ;;
    gpt-4o-mini)
      echo "scale=4; ($input / 1000 * 0.00015) + ($output / 1000 * 0.0006)" | bc
      ;;
    gpt-4o|*gpt*)
      echo "scale=4; ($input / 1000 * 0.005) + ($output / 1000 * 0.015)" | bc
      ;;
    *)
      echo "scale=4; ($input / 1000 * 0.003) + ($output / 1000 * 0.015)" | bc
      ;;
  esac
}

cmd_login() {
  local email="$1"
  local password="$2"
  [[ -z "$email" || -z "$password" ]] && { echo "Error: email and password required"; exit 1; }
  
  echo -e "${YELLOW}🔐 Logging in as $email...${NC}"
  
  result=$(curl -s -X POST "$KANBAN_API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$email\", \"password\": \"$password\"}")
  
  if echo "$result" | jq -e '.tokens.accessToken' > /dev/null 2>&1; then
    token=$(echo "$result" | jq -r '.tokens.accessToken')
    echo -e "${GREEN}✅ Login successful!${NC}"
    echo ""
    echo "Set this token in your environment:"
    echo -e "${BLUE}export KANBAN_TOKEN=\"$token\"${NC}"
    echo ""
    echo "Or add to your shell config (~/.bashrc or ~/.zshrc)"
  else
    echo -e "${RED}❌ Login failed${NC}"
    echo "$result" | jq -r '.error // .'
    exit 1
  fi
}

cmd_whoami() {
  check_auth
  echo -e "${BLUE}👤 Current User${NC}"
  curl -s "$KANBAN_API_URL/auth/me" $(auth_header) | jq '.user'
}

cmd_list() {
  check_auth
  local status="${1:-ready}"
  echo -e "${BLUE}📋 Tasks (status: $status)${NC}"
  curl -s "$KANBAN_API_URL/tasks?status=$status" $(auth_header) | jq -r '.tasks[] | "  [\(.priority)★] \(.id | .[0:8])... \(.title)"'
}

cmd_show() {
  check_auth
  local task_id="$1"
  [[ -z "$task_id" ]] && { echo "Error: task_id required"; exit 1; }
  curl -s "$KANBAN_API_URL/tasks/$task_id" $(auth_header) | jq '.task'
}

cmd_claim() {
  check_auth
  local task_id="$1"
  local agent_id="$2"
  [[ -z "$task_id" || -z "$agent_id" ]] && { echo "Error: task_id and agent_id required"; exit 1; }
  
  echo -e "${YELLOW}🔒 Claiming task $task_id as $agent_id...${NC}"
  
  result=$(curl -s -X POST "$KANBAN_API_URL/tasks/$task_id/claim" \
    $(auth_header) \
    -H "Content-Type: application/json" \
    -d "{\"agent_id\": \"$agent_id\"}")
  
  if echo "$result" | jq -e '.task' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Claimed!${NC}"
    echo "$result" | jq '.task | {id, title, description, priority}'
    
    # Save snapshot marker (agents should record their own token counts)
    echo "{\"task_id\": \"$task_id\", \"agent_id\": \"$agent_id\", \"claimed_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$SNAPSHOT_DIR/$task_id.json"
    echo -e "${BLUE}📸 Snapshot saved. Record your current token usage!${NC}"
  else
    echo -e "${RED}❌ Failed to claim${NC}"
    echo "$result" | jq -r '.error // .'
    exit 1
  fi
}

cmd_complete() {
  check_auth
  local task_id="$1"
  local agent_id="$2"
  local input_tokens="$3"
  local output_tokens="$4"
  local model="$5"
  
  [[ -z "$task_id" || -z "$agent_id" ]] && { echo "Error: task_id and agent_id required"; exit 1; }
  
  # Default values if not provided
  input_tokens="${input_tokens:-0}"
  output_tokens="${output_tokens:-0}"
  model="${model:-claude-sonnet-4}"
  
  # Calculate cost
  local cost=$(calc_cost "$input_tokens" "$output_tokens" "$model")
  
  echo -e "${YELLOW}✅ Completing task $task_id...${NC}"
  echo -e "   Tokens: ${input_tokens} in / ${output_tokens} out"
  echo -e "   Model: $model"
  echo -e "   Cost: \$${cost}"
  
  result=$(curl -s -X POST "$KANBAN_API_URL/tasks/$task_id/complete" \
    $(auth_header) \
    -H "Content-Type: application/json" \
    -H "x-agent-id: $agent_id" \
    -d "{
      \"output\": {\"completed_by\": \"$agent_id\", \"completed_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
      \"usage\": {
        \"input_tokens\": $input_tokens,
        \"output_tokens\": $output_tokens,
        \"model\": \"$model\",
        \"cost_usd\": $cost
      }
    }")
  
  if echo "$result" | jq -e '.task' > /dev/null 2>&1; then
    echo -e "${GREEN}🎉 Task completed!${NC}"
    
    # Clean up snapshot
    rm -f "$SNAPSHOT_DIR/$task_id.json"
  else
    echo -e "${RED}❌ Failed to complete${NC}"
    echo "$result" | jq -r '.error // .'
    exit 1
  fi
}

cmd_block() {
  check_auth
  local task_id="$1"
  local agent_id="$2"
  local reason="$3"
  
  [[ -z "$task_id" || -z "$agent_id" || -z "$reason" ]] && { echo "Error: task_id, agent_id, and reason required"; exit 1; }
  
  echo -e "${YELLOW}🚫 Blocking task $task_id...${NC}"
  
  curl -s -X POST "$KANBAN_API_URL/tasks/$task_id/block" \
    $(auth_header) \
    -H "Content-Type: application/json" \
    -H "x-agent-id: $agent_id" \
    -d "{\"reason\": \"$reason\"}" | jq '.'
}

cmd_release() {
  check_auth
  local task_id="$1"
  local agent_id="$2"
  
  [[ -z "$task_id" || -z "$agent_id" ]] && { echo "Error: task_id and agent_id required"; exit 1; }
  
  echo -e "${YELLOW}🔓 Releasing task $task_id...${NC}"
  
  curl -s -X POST "$KANBAN_API_URL/tasks/$task_id/release" \
    $(auth_header) \
    -H "Content-Type: application/json" \
    -H "x-agent-id: $agent_id" | jq '.'
    
  rm -f "$SNAPSHOT_DIR/$task_id.json"
}

cmd_stats() {
  check_auth
  echo -e "${BLUE}📊 Usage Statistics${NC}"
  curl -s "$KANBAN_API_URL/stats/usage" $(auth_header) | jq '.totals'
  echo ""
  echo -e "${BLUE}By Agent:${NC}"
  curl -s "$KANBAN_API_URL/stats/usage" $(auth_header) | jq -r '.by_agent[] | "  \(.agent): $\(.cost_usd | tostring | .[0:6]) (\(.task_count) tasks)"'
}

# Main command router
case "${1:-}" in
  login)   cmd_login "$2" "$3" ;;
  whoami)  cmd_whoami ;;
  list)    cmd_list "$2" ;;
  show)    cmd_show "$2" ;;
  claim)   cmd_claim "$2" "$3" ;;
  complete) cmd_complete "$2" "$3" "$4" "$5" "$6" ;;
  block)   cmd_block "$2" "$3" "$4" ;;
  release) cmd_release "$2" "$3" ;;
  stats)   cmd_stats ;;
  help|--help|-h|"")
    usage
    ;;
  *)
    echo "Unknown command: $1"
    usage
    exit 1
    ;;
esac
