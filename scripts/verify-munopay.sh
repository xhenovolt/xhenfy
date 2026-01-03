#!/bin/bash

# MunoPay Integration Verification Script
# Checks that all required files and configurations are in place

echo "======================================"
echo "MunoPay Integration Verification"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
PASSED=0
FAILED=0

# Function to check file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
  fi
}

# Function to check directory exists
check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
  fi
}

# Function to check environment variable
check_env() {
  if grep -q "^$1=" .env.local 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Environment variable: $1"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠${NC} Environment variable: $1 (not set)"
    ((FAILED++))
  fi
}

echo "Checking file structure..."
echo ""

# Core library files
check_file "src/lib/payment.js"
check_file "src/lib/paymentDb.js"
check_file "src/config/munopay.js"

echo ""
echo "Checking API endpoints..."

# API route files
check_file "src/app/api/payments/route.js"
check_dir "src/app/api/payments/webhook"
check_file "src/app/api/payments/webhook/route.js"
check_dir "src/app/api/payments/status"
check_file "src/app/api/payments/status/[reference]/route.js"

echo ""
echo "Checking database setup..."

# Database files
check_file "scripts/setupDb.js"

echo ""
echo "Checking documentation..."

# Documentation files
check_file "MUNOPAY_SETUP.md"
check_file "MUNOPAY_INTEGRATION.md"
check_file "MUNOPAY_EXAMPLES.js"
check_file "MUNOPAY_IMPLEMENTATION_SUMMARY.md"
check_file ".env.local.example"

echo ""
echo "Checking environment configuration..."

# Environment setup
if [ -f .env.local ]; then
  check_env "MUNOPAY_API_KEY"
  check_env "MUNOPAY_WEBHOOK_SECRET"
  check_env "NEON_DB_URL"
else
  echo -e "${YELLOW}⚠${NC} .env.local file not found"
  echo "  → Run: cp .env.local.example .env.local"
  echo "  → Then edit .env.local with your credentials"
  ((FAILED++))
fi

echo ""
echo "Checking dependencies..."

# Check if node_modules exists
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} node_modules installed"
  ((PASSED++))
  
  # Check for required packages
  if [ -f "package.json" ]; then
    if grep -q '"pg"' package.json; then
      echo -e "${GREEN}✓${NC} pg (PostgreSQL driver) in package.json"
      ((PASSED++))
    else
      echo -e "${RED}✗${NC} pg (PostgreSQL driver) missing from package.json"
      ((FAILED++))
    fi
  fi
else
  echo -e "${YELLOW}⚠${NC} node_modules not installed"
  echo "  → Run: npm install"
  ((FAILED++))
fi

echo ""
echo "======================================"
echo "Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "======================================"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Configure environment: nano .env.local"
  echo "2. Setup database: npm run db:setup"
  echo "3. Start development: npm run dev"
  echo "4. Read documentation: cat MUNOPAY_SETUP.md"
  exit 0
else
  echo -e "${RED}✗ Some checks failed. See above for details.${NC}"
  echo ""
  echo "Common issues:"
  echo "- Missing .env.local file: cp .env.local.example .env.local"
  echo "- Missing dependencies: npm install"
  echo "- Missing environment variables: Fill in MUNOPAY_API_KEY and MUNOPAY_WEBHOOK_SECRET"
  exit 1
fi
