'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal, Wifi, Shield } from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
};

export function MainNav() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: <Wifi className="w-4 h-4 mr-2" />,
    },
    {
      name: 'Tools',
      href: '#',
      icon: <Terminal className="w-4 h-4 mr-2" />,
      children: [
        { name: 'Nmap Scanner', href: '/tools/nmap' },
        { name: 'Password Cracker', href: '/tools/hydra' },
        { name: 'Vulnerability Scanner', href: '/tools/vulnscan' },
      ],
    },
    {
      name: 'Status',
      href: '/status',
      icon: <Shield className="w-4 h-4 mr-2" />,
    },
    {
      name: 'Encryption',
      href: '/test/encryption',
    },
  ];

  const isActive = (href: string) => pathname === href;
  const isChildActive = (items?: NavItem[]) => 
    items?.some(item => isActive(item.href) || isChildActive(item.children));

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      {navItems.map((item) => (
        <div key={item.href} className="relative group">
          {item.children ? (
            <>
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className={cn(
                  'flex items-center transition-colors hover:text-primary',
                  isChildActive(item.children) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.icon}
                {item.name}
                {toolsOpen ? (
                  <ChevronUp className="ml-1 w-4 h-4" />
                ) : (
                  <ChevronDown className="ml-1 w-4 h-4" />
                )}
              </button>
              
              {(toolsOpen || isChildActive(item.children)) && (
                <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-gray-900 border border-gray-800 z-50">
                  <div className="py-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block px-4 py-2 text-sm hover:bg-gray-800',
                          isActive(child.href) ? 'text-primary' : 'text-gray-300'
                        )}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              href={item.href}
              className={cn(
                'flex items-center transition-colors hover:text-primary',
                isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
