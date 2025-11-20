#!/bin/bash
#
# Integration test script for the Texas Hold'em backend.
# This script uses curl to interact with the API endpoints.
#
# Prerequisite: The Flask server (app.py) must be running.
#   - python texas-holdem-backend/app.py

# --- Configuration ---
BASE_URL="http://localhost:5001/api"
PLAYER_NAME="CURL_Matador"

# --- Colors and Helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_test() {
    echo -e "\n${YELLOW}--- TESTING: $1 ---${NC}"
}

check_success() {
    if [ "$1" -eq "$2" ]; then
        echo -e "${GREEN}PASS: Expected HTTP $2, got $1.${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}FAIL: Expected HTTP $2, got $1.${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

check_error_contains() {
    # $1: response body, $2: expected substring
    if echo "$1" | grep -q "$2"; then
        echo -e "${GREEN}PASS: Error message contains expected text ('$2').${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}FAIL: Error message did not contain expected text ('$2').${NC}"
        echo "Full response: $1"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

# --- Test Execution ---
PASS_COUNT=0
FAIL_COUNT=0

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: 'jq' is not installed. Please install it to run this script (e.g., 'sudo apt-get install jq' or 'brew install jq').${NC}"
    exit 1
fi

echo "Starting backend integration tests..."

# 1. Create a New Game
print_test "Create a New Game (POST /api/game)"
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"playerName\": \"$PLAYER_NAME\"}" \
  "$BASE_URL/game")
  
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "{\"playerName\": \"$PLAYER_NAME\"}" "$BASE_URL/game")
check_success "$HTTP_STATUS" 200

GAME_ID=$(echo "$CREATE_RESPONSE" | jq -r '.gameId')
if [ "$GAME_ID" != "null" ] && [ ! -z "$GAME_ID" ]; then
    echo -e "${GREEN}PASS: Successfully created game with ID: $GAME_ID${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}FAIL: Could not extract gameId from response.${NC}"
    echo "Full response: $CREATE_RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    exit 1 # Cannot continue without a game ID
fi


# 2. Get Game State
print_test "Get Game State (GET /api/game/$GAME_ID)"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/game/$GAME_ID")
check_success "$HTTP_STATUS" 200


# 3. Submit an Invalid Action Payload
print_test "Submit Invalid Action Payload (POST /api/game/$GAME_ID/action)"
RESPONSE_BODY=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"playerID": 0, "move": "fold"}' \
    "$BASE_URL/game/$GAME_ID/action")
HTTP_STATUS=$(echo "$RESPONSE_BODY" | tail -n1)
BODY=$(echo "$RESPONSE_BODY" | sed '$d')
check_success "$HTTP_STATUS" 400
check_error_contains "$BODY" "Invalid request payload"


# 4. Attempt to Act Out of Turn
# In a new game, player 0 (human) is not first to act.
print_test "Attempt to Act Out of Turn (POST /api/game/$GAME_ID/action)"
RESPONSE_BODY=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"playerId": 0, "action": "call", "amount": 0}' \
    "$BASE_URL/game/$GAME_ID/action")
HTTP_STATUS=$(echo "$RESPONSE_BODY" | tail -n1)
BODY=$(echo "$RESPONSE_BODY" | sed '$d')
check_success "$HTTP_STATUS" 400
check_error_contains "$BODY" "Not this player's turn"


# 5. Get State for a Non-Existent Game
print_test "Get State for a Non-Existent Game (GET /api/game/fake-id)"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/game/fake-id")
check_success "$HTTP_STATUS" 404

# --- Summary ---
echo -e "\n--- Test Summary ---"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"

if [ "$FAIL_COUNT" -gt 0 ]; then
    exit 1
else
    echo -e "${GREEN}All integration tests passed successfully.${NC}"
    exit 0
fi
