#!/bin/bash

# Script to fix lint issues automatically

echo "Fixing lint issues..."

# Fix unescaped characters in pages
find src -name "*.tsx" -exec sed -i "s/Don't/Don\&apos;t/g" {} \;
find src -name "*.tsx" -exec sed -i "s/We'll/We\&apos;ll/g" {} \;
find src -name "*.tsx" -exec sed -i "s/you're/you\&apos;re/g" {} \;
find src -name "*.tsx" -exec sed -i "s/they're/they\&apos;re/g" {} \;
find src -name "*.tsx" -exec sed -i "s/can't/can\&apos;t/g" {} \;
find src -name "*.tsx" -exec sed -i "s/won't/won\&apos;t/g" {} \;
find src -name "*.tsx" -exec sed -i "s/shouldn't/shouldn\&apos;t/g" {} \;
find src -name "*.tsx" -exec sed -i "s/wouldn't/wouldn\&apos;t/g" {} \;

# Fix quotes
find src -name "*.tsx" -exec sed -i 's/"/\&quot;/g' {} \;

echo "Basic character fixes completed. Manual fixes still needed for TypeScript issues."
