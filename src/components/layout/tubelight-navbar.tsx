import { Vote, Coins } from 'lucide-react';

interface NavItem {
  name: string;
  url: string;
  icon: any;
  disabled?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Fight', url: '/', icon: Coins },
  { name: 'Wheel of Fomo', url: '/wof', icon: Vote },
  { name: 'Vote Fighter', url: '/vote', icon: Vote },
  { name: 'Vote Token', url: '/votetoken', icon: Vote },
  { name: 'Faucet', url: '/faucet', icon: Coins },
  { 
    name: 'Stats', 
    url: '/stats', 
    icon: Vote, 
    disabled: true,
    badge: 'SOON'
  }
]; 