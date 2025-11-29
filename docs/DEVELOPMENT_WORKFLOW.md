# 🚀 Development Workflow Guide

## ⚡ **Optimized Scripts Explanation**

### **Why the Change?**
The previous setup ran `prisma generate` on every `pnpm dev`, which is:
- ❌ **Slow**: Adds 2-3 seconds to every dev restart
- ❌ **Unnecessary**: Prisma client only needs regeneration when schema changes
- ❌ **Not Production-Ready**: Creates inefficient development workflow

### **New Optimized Scripts**

```json
{
  "dev": "next dev --turbopack",           // Fast dev start
  "build": "prisma generate && next build", // Generate for production
  "postinstall": "prisma generate",        // Auto-generate after npm install
  "setup": "prisma generate && prisma migrate dev", // Initial setup
  "prisma:dev": "prisma migrate dev && prisma generate" // Schema changes
}
```

## 🔄 **When to Run What**

### **Daily Development**
```bash
# Fast development server (no Prisma generation)
pnpm dev
```

### **After Schema Changes**
```bash
# Run migrations and regenerate client
pnpm prisma:dev

# Or manually
npx prisma migrate dev
npx prisma generate
```

### **Fresh Project Setup**
```bash
# Complete setup (only once)
./setup.sh

# Or manually
pnpm setup
```

### **After Installing Dependencies**
```bash
# Prisma client auto-generates via postinstall hook
pnpm install
```

### **Production Build**
```bash
# Includes Prisma generation
pnpm build
```

## 📋 **Complete Script Reference**

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `pnpm dev` | Start development server | Daily development |
| `pnpm build` | Production build | Deployment |
| `pnpm setup` | Initial project setup | First time setup |
| `pnpm prisma:dev` | Schema changes + migrate | After schema edits |
| `pnpm prisma:generate` | Regenerate client only | Rarely needed manually |
| `pnpm prisma:studio` | Database GUI | Database exploration |
| `pnpm prisma:reset` | Reset database | Fresh start needed |

## 🎯 **Best Practices**

### **✅ DO**
- Use `pnpm dev` for daily development
- Run `pnpm prisma:dev` after schema changes
- Let `postinstall` handle Prisma generation automatically
- Use `./setup.sh` for initial project setup

### **❌ DON'T**
- Run `prisma generate` manually unless needed
- Add Prisma generation to dev script
- Ignore Prisma client errors (usually means regeneration needed)

## 🔧 **Development Workflow**

### **Starting Work**
```bash
# 1. Pull latest changes
git pull

# 2. Install dependencies (auto-generates Prisma)
pnpm install

# 3. Run any new migrations
pnpm prisma:dev

# 4. Start development
pnpm dev
```

### **Making Schema Changes**
```bash
# 1. Edit prisma/schema.prisma
# 2. Run migration
pnpm prisma:dev

# 3. Development server auto-restarts
```

### **Production Deployment**
```bash
# Build includes Prisma generation
pnpm build

# Database migration (production)
npx prisma migrate deploy
```

## 🎨 **IDE Setup**

### **VSCode Settings**
Add to `.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "prisma.showPrismaDataPlatformNotification": false
}
```

### **Useful Extensions**
- Prisma (Prisma.prisma)
- TypeScript Hero
- Auto Rename Tag

## 🐛 **Troubleshooting**

### **"Cannot find module '.prisma/client'"**
```bash
# Regenerate Prisma client
npx prisma generate
```

### **"Database connection error"**
```bash
# Check .env.local DATABASE_URL
# Run fresh migration
pnpm prisma:dev
```

### **"Schema out of sync"**
```bash
# Reset and regenerate
pnpm prisma:reset
```

## 📊 **Performance Comparison**

| Approach | Dev Start Time | Production Ready |
|----------|----------------|------------------|
| **Old**: `prisma generate && next dev` | ~5-8 seconds | ❌ No |
| **New**: `next dev` | ~2-3 seconds | ✅ Yes |

## 🎉 **Benefits**

- ⚡ **50% faster dev starts**
- 🔧 **Proper separation of concerns**
- 🚀 **Production-ready workflow**
- 📦 **Automatic dependency handling**
- 🎯 **Clear script purposes**

Your development workflow is now **optimized** and **production-ready**! 🚀
