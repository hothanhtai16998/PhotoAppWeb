
"use client"

import { memo } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { Menu, Github, Sun, Moon, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/useAuthStore"

// Define all navigation links
const navLinksConfig = [
  { to: "/profile", label: "Profile", auth: true },
  { to: "/upload", label: "Upload", auth: true },
  { to: "/signup", label: "Đăng ký", guest: true },
  { to: "/signin", label: "Đăng nhập", guest: true },
]

// A placeholder for the theme toggle functionality
const ModeToggle = memo(function ModeToggle() {
  // In a real app, you would use a theme context here.
  // For example, with next-themes: const { setTheme } = useTheme()
  const setTheme = (theme: string) => {
    // TODO: Implement theme switching logic
    // Store theme preference in localStorage or context
    return theme;

  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

export const Header = memo(function Header() {
  const { accessToken, signOut, user } = useAuthStore()
  const navigate = useNavigate()

  const navLinks = navLinksConfig.filter(link => !accessToken ? true : !link.guest);

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  return (
    <header className="sticky h-12 flex top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left Section */}
      <div className="flex-1 flex items-center justify-start">
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link to="/" className="mr-6 flex items-center space-x-2">
                <span className="font-bold sm:inline-block">Logo</span>
              </Link>
              <nav className="mt-6 grid gap-4 text-lg font-medium">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.to}>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        cn(
                          "transition-colors hover:text-foreground",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </SheetClose>
                ))}

              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo/Brand Name */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="hidden font-bold sm:inline-block">PhotoApp</span>
        </Link>
      </div>

      {/* Center Section - Desktop Navigation */}
      <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium md:flex">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "transition-colors hover:text-foreground/80",
                isActive ? "text-foreground" : "text-foreground/60"
              )
            }
          >
            {link.label}
          </NavLink>
        ))}

      </nav>

      {/* Right Section */}
      <div className="flex flex-1 items-center justify-end space-x-2">
        {user && (
          <span className="hidden sm:inline text-sm font-medium text-foreground/80">
            Xin chào, {user.displayName}!
          </span>
        )}
        <Button variant="ghost" size="icon" asChild>
          <a
            href="https://github.com/your-repo" // TODO: Add your repo link
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </a>
        </Button>
        <ModeToggle />
        {accessToken && (
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="hidden md:inline-flex">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign Out</span>
          </Button>
        )}
      </div>
    </header>
  )
})

export default Header
