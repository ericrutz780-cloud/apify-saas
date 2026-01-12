import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  date: DateRange;
  setDate: (date: DateRange) => void;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const PRESETS = [
  { label: 'Today', getValue: () => { const d = new Date(); d.setHours(0,0,0,0); return { from: d, to: d }; } },
  { label: 'Yesterday', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0,0,0,0); return { from: d, to: d }; } },
  { label: 'This week', getValue: () => { const d = new Date(); const day = d.getDay(); const from = new Date(d); from.setDate(d.getDate() - day); from.setHours(0,0,0,0); return { from, to: d }; } },
  { label: 'Last week', getValue: () => { const d = new Date(); const from = new Date(); from.setDate(d.getDate() - 7 - d.getDay()); from.setHours(0,0,0,0); const to = new Date(from); to.setDate(from.getDate() + 6); to.setHours(23,59,59,999); return { from, to }; } },
  { label: 'This month', getValue: () => { const d = new Date(); return { from: new Date(d.getFullYear(), d.getMonth(), 1), to: d }; } },
  { label: 'Last month', getValue: () => { const d = new Date(); return { from: new Date(d.getFullYear(), d.getMonth() - 1, 1), to: new Date(d.getFullYear(), d.getMonth(), 0) }; } },
  { label: 'This year', getValue: () => { const d = new Date(); return { from: new Date(d.getFullYear(), 0, 1), to: d }; } },
  { label: 'Last year', getValue: () => { const d = new Date(); return { from: new Date(d.getFullYear() - 1, 0, 1), to: new Date(d.getFullYear() - 1, 11, 31) }; } },
  { label: 'All time', getValue: () => { return { from: new Date(2020, 0, 1), to: new Date() }; } },
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({ date, setDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tempDate, setTempDate] = useState<DateRange>(date);
  const [viewDate, setViewDate] = useState<Date>(date.from || new Date());
  
  // Local state for raw text input in the footer
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTempDate(date);
      setViewDate(date.from || new Date());
      setFromInput(date.from ? formatDateString(date.from) : '');
      setToInput(date.to ? formatDateString(date.to) : '');
    }
  }, [isOpen, date]);

  const handleApply = () => {
    setDate(tempDate);
    setIsOpen(false);
  };

  const isSameDay = (d1?: Date, d2?: Date) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  const isInRange = (day: Date) => {
    if (!tempDate.from || !tempDate.to) return false;
    return day > tempDate.from && day < tempDate.to;
  };

  const handleDayClick = (day: Date) => {
    const { from, to } = tempDate;
    let nextRange: DateRange;
    if (!from || (from && to)) {
      nextRange = { from: day, to: undefined };
    } else {
      if (day < from) {
        nextRange = { from: day, to: undefined };
      } else {
        nextRange = { from, to: day };
      }
    }
    setTempDate(nextRange);
    setFromInput(nextRange.from ? formatDateString(nextRange.from) : '');
    setToInput(nextRange.to ? formatDateString(nextRange.to) : '');
  };

  const formatDateString = (d?: Date) => {
    if (!d) return '';
    return `${d.getMonth() + 1} / ${d.getDate()} / ${d.getFullYear()}`;
  };

  const parseDateString = (str: string): Date | null => {
    const parts = str.split('/').map(p => parseInt(p.trim(), 10));
    if (parts.length === 3) {
      const [m, d, y] = parts;
      const date = new Date(y, m - 1, d);
      if (!isNaN(date.getTime())) return date;
    }
    return null;
  };

  const handleManualFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFromInput(val);
    const parsed = parseDateString(val);
    if (parsed) {
      setTempDate(prev => ({ ...prev, from: parsed }));
      setViewDate(parsed);
    }
  };

  const handleManualToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setToInput(val);
    const parsed = parseDateString(val);
    if (parsed) {
      setTempDate(prev => ({ ...prev, to: parsed }));
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
  };

  const renderMonth = (monthOffset: number) => {
    const currentMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + monthOffset, 1);
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      dayDate.setHours(0,0,0,0);
      
      const isFrom = isSameDay(dayDate, tempDate.from);
      const isTo = isSameDay(dayDate, tempDate.to);
      const inRange = isInRange(dayDate);

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(dayDate)}
          className={`aspect-square flex flex-col items-center justify-center cursor-pointer relative transition-colors ${
            inRange ? 'bg-brand-50' : ''
          } ${isFrom && tempDate.to ? 'rounded-l-full' : ''} ${isTo ? 'rounded-r-full' : ''} ${isFrom && !tempDate.to ? 'rounded-full' : ''}`}
        >
          <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-xs sm:text-sm transition-all ${
            (isFrom || isTo) ? 'bg-brand-500 text-white font-semibold' : 'text-gray-700 hover:bg-gray-100 font-medium'
          }`}>
            {day}
          </div>
          {(isFrom || isTo) && (
            <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full"></div>
          )}
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-[280px] sm:min-w-[340px] p-4 sm:p-6 select-none">
        <div className="flex items-center justify-between mb-8 h-6 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="font-semibold text-gray-800 text-sm sm:text-base tracking-tight">{MONTH_NAMES[month]} {year}</span>
          </div>
          
          {monthOffset === 0 ? (
            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 z-10">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : <div className="w-8 h-8 sm:hidden">
              <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
          </div>}

          {monthOffset === 1 ? (
            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 z-10">
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : <div className="w-8 h-8 sm:hidden">
              <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400">
                <ChevronRight className="w-5 h-5" />
              </button>
          </div>}
        </div>

        <div className="grid grid-cols-7 text-center mb-2">
          {DAY_NAMES.map(dn => (
            <div key={dn} className="text-[11px] sm:text-xs text-gray-400 font-medium py-2">{dn}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-y-1">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-[35px] w-full" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-full w-full flex items-center justify-between gap-2 bg-white border border-gray-200 text-gray-700 px-3 rounded-lg text-sm font-normal hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
      >
        <div className="flex items-center gap-2 overflow-hidden">
            <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
                {date.from ? formatDateString(date.from) : 'Select date'} 
                {date.to && !isSameDay(date.from, date.to) ? ` - ${formatDateString(date.to)}` : ''}
            </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-1 flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[4900] sm:hidden" onClick={() => setIsOpen(false)}></div>
          
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-full sm:left-0 sm:translate-x-0 sm:translate-y-0 sm:mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[5000] flex flex-col sm:flex-row w-[92vw] sm:w-[860px] max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Left Sidebar Presets */}
            <div className="w-full sm:w-44 bg-white border-b sm:border-b-0 sm:border-r border-gray-100 p-2 flex flex-row sm:flex-col overflow-x-auto sm:overflow-y-auto no-scrollbar shrink-0">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    const range = p.getValue();
                    setTempDate(range);
                    setViewDate(range.from || new Date());
                    setFromInput(range.from ? formatDateString(range.from) : '');
                    setToInput(range.to ? formatDateString(range.to) : '');
                  }}
                  className="whitespace-nowrap sm:whitespace-normal px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors flex-shrink-0 text-left"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col flex-1 min-w-0 overflow-y-auto no-scrollbar bg-white">
              {/* Desktop: Side by Side, Mobile: Vertical (scrollable) */}
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-b border-gray-100">
                {renderMonth(0)}
                <div className="hidden sm:block flex-1">
                  {renderMonth(1)}
                </div>
              </div>

              {/* Footer Inputs & Actions */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto bg-white">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={fromInput}
                    onChange={handleManualFromChange}
                    placeholder="M / D / YYYY"
                    className="flex-1 sm:w-44 border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-xs placeholder:text-gray-300"
                  />
                  <span className="text-gray-300 font-light px-1">—</span>
                  <input
                    type="text"
                    value={toInput}
                    onChange={handleManualToChange}
                    placeholder="M / D / YYYY"
                    className="flex-1 sm:w-44 border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-xs placeholder:text-gray-300"
                  />
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="flex-1 sm:w-24 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-700 text-sm hover:bg-gray-50 transition-colors bg-white shadow-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleApply}
                    className="flex-1 sm:w-24 py-2.5 bg-brand-500 text-white rounded-xl font-bold text-sm hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangePicker;