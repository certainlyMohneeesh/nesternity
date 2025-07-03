'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'
import { Menu, X, Home, Users, FolderOpen, FileText, FileCheck, Settings, Users2, AlertCircle } from 'lucide-react'

interface NavLink {
  href: string
  label: string
  iconName: string
}

interface MobileNavigationProps {
  navLinks: NavLink[]
}

// Icon mapping for mobile navigation
const iconMap = {
  Home,
  Users,
  FolderOpen,
  FileText,
  FileCheck,
  AlertCircle,
  Users2,
  Settings,
};

export function MobileNavigation({ navLinks }: MobileNavigationProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <img src="/nesternity.svg" alt="Nesternity" className="w-8 h-8" />
              <span className="font-bold text-lg">Nesternity</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4">
            <NavigationMenu orientation="vertical" className="w-full">
              <NavigationMenuList className="flex flex-col gap-2 w-full">
                {navLinks.map((link) => {
                  const Icon = iconMap[link.iconName as keyof typeof iconMap]
                  const isActive = pathname === link.href || 
                    (link.href !== '/dashboard' && pathname.startsWith(link.href))
                  
                  return (
                    <NavigationMenuItem key={link.href} className="w-full">
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    </NavigationMenuItem>
                  )
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
