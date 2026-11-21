/**
 * Layout: the shared chrome around every page. Pages render <Layout>{blocks}</Layout>; the build puts
 * it inside <div id="{prefix}-root">. Variants of the chrome are props or separate layouts (a sub-site
 * header), never chrome copied into a page.
 * Handoff: the app's root layout (Next.js app/layout.tsx or a React Router layout route).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FinderPalette } from './FinderPalette';
import { Footer } from './Footer';
import { Header } from './Header';
import { Motion } from './Motion';
import { UtilityBar } from './UtilityBar';

type Finder = { open: (q?: string) => void; close: () => void; isOpen: boolean; query: string };
const FinderCtx = createContext<Finder>({ open: () => {}, close: () => {}, isOpen: false, query: '' });
export const useFinder = () => useContext(FinderCtx);

export function Layout({ children, chrome = 'default', className = 'min-h-screen bg-white' }: { children: ReactNode; chrome?: 'default' | 'none'; className?: string }) {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const open = useCallback((q?: string) => {
    setQuery(typeof q === 'string' ? q : '');
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const finder = useMemo(() => ({ open, close, isOpen, query }), [open, close, isOpen, query]);

  // "/" and Cmd/Ctrl-K open the finder from anywhere (not while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /input|textarea|select/i.test(t.tagName || '') || t.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        open();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <FinderCtx.Provider value={finder}>
      <div className={className}>
        {chrome === 'default' && (
          <>
            <a id="skip" href="#main" className="skip btn-light btn-sm">
              Skip to content
            </a>
            <UtilityBar />
            <Header />
          </>
        )}
        <main id="main">{children}</main>
        {chrome === 'default' && <Footer />}
        <FinderPalette />
        <Motion />
      </div>
    </FinderCtx.Provider>
  );
}
