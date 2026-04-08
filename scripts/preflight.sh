#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

errors=0

# 1. Check .env exists
if [ ! -f .env ]; then
    echo -e "${RED}ERROR:${NC} .env file not found."
    echo "  → Copy .env.example to .env: cp .env.example .env"
    errors=$((errors + 1))
fi

# 2. Check PostgreSQL is reachable
if command -v pg_isready &>/dev/null; then
    if ! pg_isready -h localhost -p 5432 -q 2>/dev/null; then
        echo -e "${RED}ERROR:${NC} PostgreSQL is not running on localhost:5432."
        echo "  → Run: pnpm docker:infra:up"
        errors=$((errors + 1))
    fi
else
    # Fallback: try connecting via psql or just warn
    echo -e "${RED}WARNING:${NC} pg_isready not found. Cannot verify PostgreSQL status."
    echo "  → Install postgresql client or ensure PostgreSQL is running."
fi

# 3. Check Redis is reachable
if command -v redis-cli &>/dev/null; then
    if ! redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
        echo -e "${RED}ERROR:${NC} Redis is not running on localhost:6379."
        echo "  → Run: pnpm docker:infra:up"
        errors=$((errors + 1))
    fi
else
    echo -e "${RED}WARNING:${NC} redis-cli not found. Cannot verify Redis status."
    echo "  → Install redis-tools or ensure Redis is running."
fi

if [ $errors -gt 0 ]; then
    echo ""
    echo -e "${RED}Preflight failed with $errors error(s). Fix the issues above and retry.${NC}"
    exit 1
fi

echo -e "${GREEN}Preflight checks passed.${NC}"
