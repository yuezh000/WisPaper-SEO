#!/bin/bash

# WisPaper SEO API Test Runner
# This script runs all API tests with proper setup and teardown

set -e

echo "🧪 Starting WisPaper SEO API Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Check if Jest is installed
if ! npm list jest &> /dev/null; then
    print_status "Installing Jest and test dependencies..."
    npm install --save-dev jest @types/jest jest-environment-node supertest ts-jest
fi

# Set test environment
export NODE_ENV=test
export DATABASE_URL="postgresql://test:test@localhost:5432/wispaper_seo_test"

print_status "Environment: $NODE_ENV"
print_status "Database URL: $DATABASE_URL"

# Run tests based on arguments
case "${1:-all}" in
    "all")
        print_status "Running all API tests..."
        npm run test
        ;;
    "watch")
        print_status "Running tests in watch mode..."
        npm run test:watch
        ;;
    "coverage")
        print_status "Running tests with coverage..."
        npm run test:coverage
        ;;
    "ci")
        print_status "Running tests for CI..."
        npm run test:ci
        ;;
    "institutions")
        print_status "Running institution API tests..."
        npm test -- __tests__/api/v1/institutions.test.ts
        ;;
    "authors")
        print_status "Running author API tests..."
        npm test -- __tests__/api/v1/authors.test.ts
        ;;
    "conferences")
        print_status "Running conference API tests..."
        npm test -- __tests__/api/v1/conferences.test.ts
        ;;
    "journals")
        print_status "Running journal API tests..."
        npm test -- __tests__/api/v1/journals.test.ts
        ;;
    "papers")
        print_status "Running paper API tests..."
        npm test -- __tests__/api/v1/papers.test.ts
        ;;
    "tasks")
        print_status "Running task API tests..."
        npm test -- __tests__/api/v1/tasks.test.ts
        ;;
    "search")
        print_status "Running search API tests..."
        npm test -- __tests__/api/v1/search.test.ts
        ;;
    "stats")
        print_status "Running stats API tests..."
        npm test -- __tests__/api/v1/stats.test.ts
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  all          Run all API tests (default)"
        echo "  watch        Run tests in watch mode"
        echo "  coverage     Run tests with coverage report"
        echo "  ci           Run tests for CI environment"
        echo "  institutions Run only institution API tests"
        echo "  authors      Run only author API tests"
        echo "  conferences  Run only conference API tests"
        echo "  journals     Run only journal API tests"
        echo "  papers       Run only paper API tests"
        echo "  tasks        Run only task API tests"
        echo "  search       Run only search API tests"
        echo "  stats        Run only stats API tests"
        echo "  help         Show this help message"
        exit 0
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' to see available commands."
        exit 1
        ;;
esac

# Check exit code
if [ $? -eq 0 ]; then
    print_success "All tests completed successfully! 🎉"
else
    print_error "Some tests failed. Please check the output above."
    exit 1
fi
