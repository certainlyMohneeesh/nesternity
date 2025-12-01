#!/bin/bash

# Comprehensive Data Sync Helper Script
# Provides easy access to all sync operations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SYNC_SCRIPT="$SCRIPT_DIR/sync-users.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
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

# Show usage
show_usage() {
    cat << EOF
Comprehensive Data Sync Helper

Usage: $0 <command> [options]

Commands:
    sync            Full sync: users + basic data integrity fixes
    sync-all        Comprehensive sync with all fixes and repairs
    validate        Validate data integrity only (no changes)
    repair-teams    Ensure all team owners are team members
    cleanup         Remove all orphaned and invalid data
    dry-run         Show what would be done without making changes
    status          Show current database status
    help            Show this help message

Options:
    --verbose       Show detailed output
    --batch-size=N  Set batch size for operations (default: 100)

Examples:
    $0 sync                    # Basic sync with user sync + basic fixes
    $0 sync-all --verbose      # Full sync with detailed output
    $0 validate                # Check data integrity only
    $0 repair-teams            # Fix team ownership issues
    $0 cleanup --dry-run       # Preview cleanup operations
    $0 status --verbose        # Detailed database status

EOF
}

# Check if Node.js and required files exist
check_prerequisites() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        exit 1
    fi

    if [ ! -f "$SYNC_SCRIPT" ]; then
        print_error "Sync script not found: $SYNC_SCRIPT"
        exit 1
    fi

    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "package.json not found. Please run from the project root."
        exit 1
    fi
}

# Run the sync script with appropriate options
run_sync() {
    local args=("$@")
    
    print_status "Running: node $SYNC_SCRIPT ${args[*]}"
    echo
    
    if node "$SYNC_SCRIPT" "${args[@]}"; then
        echo
        print_success "Operation completed successfully!"
    else
        echo
        print_error "Operation failed!"
        exit 1
    fi
}

# Main script logic
main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi

    check_prerequisites

    local command="$1"
    shift

    case "$command" in
        "sync")
            print_status "Starting basic sync (users + basic fixes)..."
            run_sync --fix-data "$@"
            ;;
        "sync-all")
            print_status "Starting comprehensive sync with all fixes..."
            run_sync --sync-all "$@"
            ;;
        "validate")
            print_status "Validating data integrity..."
            run_sync --validate-only "$@"
            ;;
        "repair-teams")
            print_status "Repairing team ownership issues..."
            run_sync --repair-teams "$@"
            ;;
        "cleanup")
            print_status "Cleaning up orphaned data..."
            run_sync --cleanup "$@"
            ;;
        "dry-run")
            print_status "Running dry-run preview..."
            run_sync --dry-run --verbose "$@"
            ;;
        "status")
            print_status "Showing database status..."
            run_sync --validate-only --verbose "$@"
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            echo
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
