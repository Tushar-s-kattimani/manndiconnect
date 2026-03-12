
"use client"

import React from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/components/AuthContext';
import { useOffline } from '@/components/OfflineProvider';
import { Button } from '@/components/ui/button';
import { Cloud, CloudOff, Globe, LogOut, RefreshCw, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { isOffline, syncData, hasUnsynced } = useOffline();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg text-white">
            <Globe className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold font-headline text-primary tracking-tight">
            {t('app_name')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsynced && !isOffline && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={syncData}
              className="hidden sm:flex border-primary text-primary hover:bg-primary/5"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('sync_now')}
            </Button>
          )}

          <div className="flex items-center text-muted-foreground mr-2">
            {isOffline ? <CloudOff className="h-4 w-4 text-destructive" /> : <Cloud className="h-4 w-4 text-primary" />}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="uppercase">{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('hi')}>हिन्दी (Hindi)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="p-2 text-sm font-medium border-b mb-1">
                  {user.phone}
                  <div className="text-xs text-muted-foreground capitalize">{user.role || 'Guest'}</div>
                </div>
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
