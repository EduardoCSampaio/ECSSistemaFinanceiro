'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User, LogOut, Monitor, Moon, Sun, Settings, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { getNotifications, markAllNotificationsAsRead, deleteNotification } from '@/services/notifications';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


export function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const { setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const unsubscribeNotifications = getNotifications(currentUser.uid, setNotifications);
        return () => unsubscribeNotifications();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (user) {
      await markAllNotificationsAsRead(user.uid);
    }
  }

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
        try {
            await deleteNotification(user.uid, notificationId);
            toast({
                title: 'Notificação Removida',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não foi possível remover a notificação.',
            });
        }
    }
  }

  const unreadNotifications = notifications.filter(n => !n.isRead);

  if (!user) {
    return null; // Don't render anything if user is not logged in
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Icons.bell className="h-5 w-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
           <div className="flex items-center justify-between p-2 border-b">
              <h3 className="font-semibold text-sm px-2">Notificações</h3>
              {unreadNotifications.length > 0 && (
                <Button variant="link" size="sm" onClick={handleMarkAllAsRead}>
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          <ScrollArea className="h-96">
            {notifications.length > 0 ? (
                notifications.map(notification => (
                  <Link href={notification.href} key={notification.id}>
                    <div className={cn("group p-3 hover:bg-muted/50 block border-b relative", !notification.isRead && 'bg-primary/5')}>
                      <p className="text-sm font-medium pr-6">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true, locale: ptBR })}
                      </p>
                       <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1/2 right-1 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  </Link>
                ))
            ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    Você não tem nenhuma notificação.
                </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL ?? `https://picsum.photos/40/40`} data-ai-hint="person" alt={user.displayName ?? 'User'} />
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName ?? 'Usuário'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Settings className="mr-2 h-4 w-4" />
                <span>Tema</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Claro</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Escuro</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>Sistema</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
