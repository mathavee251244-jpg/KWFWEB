import React from 'react';
import { X, Minus, Square } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PageId } from '../../types';

interface Props {
  title: string;
  icon: React.ReactNode;
  pageId: PageId;
  children: React.ReactNode;
}

export default function AppWindow({ title, icon, children }: Props) {
  const { navigate } = useApp();

  return (
    <div
      className="absolute inset-x-0 top-0 flex flex-col scale-in"
      style={{ bottom: 'calc(52px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Window background */}
      <div className="absolute inset-0 win-window-bg" />

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Title Bar */}
        <div className="win-titlebar flex items-center h-10 px-3 gap-2 shrink-0 select-none">
          <span className="flex items-center text-white/70">{icon}</span>
          <span className="text-[13px] font-medium text-white/85 flex-1 truncate">{title}</span>

          {/* Window Controls */}
          <div className="flex items-center gap-0.5 ml-auto">
            <button className="w-[40px] sm:w-[46px] h-8 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white/90 transition-colors rounded-sm">
              <Minus size={12} />
            </button>
            <button className="w-[40px] sm:w-[46px] h-8 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white/90 transition-colors rounded-sm">
              <Square size={10} />
            </button>
            <button
              onClick={() => navigate('desktop')}
              className="w-[40px] sm:w-[46px] h-8 flex items-center justify-center hover:bg-red-500/85 text-white/50 hover:text-white transition-colors rounded-sm"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
