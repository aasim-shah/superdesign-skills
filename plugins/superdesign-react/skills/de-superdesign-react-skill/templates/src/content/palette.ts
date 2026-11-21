/**
 * palette.ts: the finder palette's index. Generate it from research data when there are many items
 * (a 40-line script in src/gen/ reading research/locations.json, writing this file). Each item:
 * group, label (match-highlighted), desc, keywords and a #hash href that wires like any link.
 * Handoff: the index becomes a search endpoint or a generated JSON file.
 */
import { MapPin, MessageCircle, Sparkles, Tag, type LucideIcon } from 'lucide-react';

export type PaletteItem = { id: string; href: string; group: string; label: string; desc: string; keywords: string; icon: LucideIcon };

export const popular = [
  { q: 'pricing', label: 'Pricing' },
  { q: 'contact', label: 'Contact' },
];

export const palette: PaletteItem[] = [
  { id: 'pal-services', href: '#services', group: 'Pages', label: 'Services', desc: 'Everything we offer', keywords: 'services what we do', icon: Sparkles },
  { id: 'pal-pricing', href: '#pricing', group: 'Pages', label: 'Pricing', desc: 'Plans and what is included', keywords: 'price cost fees plans', icon: Tag },
  { id: 'pal-contact', href: '#contact', group: 'Pages', label: 'Contact', desc: 'Call, email or send a message', keywords: 'contact phone email message', icon: MessageCircle },
  { id: 'pal-place-one', href: '#locations', group: 'Places', label: 'Town name', desc: 'Street address · phone', keywords: 'town county postcode', icon: MapPin },
];
