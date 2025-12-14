
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

const PRESETS = [
  { label: 'Today', getValue: () => { const d = new Date(); return { from: d, to: d }; } },
  { label: 'Last 7 days', getValue: () => { const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 6); return { from, to }; } },
  { label: 'Last 30 days', getValue: () => { const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 29); return { from, to }; } },
  { label: 'All time', getValue: () => ({ from: undefined, to: undefined }) }
];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DateRangePicker: React.FC<DateRangePickerProps> = ({ date, setDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary state for the modal before applying
  const [tempDate, setTempDate] = useState<DateRange>(date);
  const [viewDate, setViewDate] = useState<Date>(date.from || new Date());

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
    // When modal opens, reset temp to actual
    if (isOpen) {
        setTempDate(date);
        setViewDate(date.from || new Date());
    }
  }, [isOpen, date]);

  const handleApply = () => {
      setDate(tempDate);
      setIsOpen(false);
  };

  const handleCancel = () => {
      setIsOpen(false);
  };

  const formatDateDisplay = (d?: Date) => {
      if (!d) return '';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDisplayText = () => {
      if (!date.from && !date.to) return "All time";
      if (date.from && !date.to) {
          // Check if it matches Today
          const today = new Date();
          if (date.from.toDateString() === today.toDateString()) return "Today";
          return formatDateDisplay(date.from);
      }
      if (date.from && date.to) {
          if (date.from.getTime() === date.to.getTime()) {
              const today = new Date();
              if (date.from.toDateString() === today.toDateString()) return "Today";
              return formatDateDisplay(date.from);
          }
          return `${formatDateDisplay(date.from)} - ${formatDateDisplay(date.to)}`;
      }
      return "Select dates";
  };

  const changeMonth = (offset: number) => {
      const newDate = new Date(viewDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setViewDate(newDate);
  };

  const isSameDay = (d1?: Date, d2?: Date) => {
      if (!d1 || !d2) return false;
      return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  const isBetween = (target: Date, start?: Date, end?: Date) => {
      if (!start || !end) return false;
      return target > start && target < end;
  };

  const handleDayClick = (day: Date) => {
      const { from, to } = tempDate;

      // If we are in "Today" mode (start == end), treat it as starting a new selection
      if (from && to && from.getTime() === to.getTime()) {
           setTempDate({ from: day, to: undefined });
           return;
      }

      if (!from || (from && to)) {
          setTempDate({ from: day, to: undefined });
      } else {
          if (day < from) {
              setTempDate({ from: day, to: undefined });
          } else {
              setTempDate({ from: from, to: day });
          }
      }
  };

  const renderCalendar = (monthOffset: number) => {
      const currentMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + monthOffset, 1);
      const year = currentMonthDate.getFullYear();
      const month = currentMonthDate.getMonth();
      
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
      
      const days = [];
      // Empty slots for start
      for (let i = 0; i < firstDayOfWeek; i++) {
          days.push(<div key={`empty-${i}`} className="w-9 h-9"></div>);
      }

      for (let d = 1; d <= daysInMonth; d++) {
          const dayDate = new Date(year, month, d);
          
          const isSelectedStart = isSameDay(dayDate, tempDate.from);
          const isSelectedEnd = isSameDay(dayDate, tempDate.to);
          const isInRange = isBetween(dayDate, tempDate.from, tempDate.to);
          const isToday = isSameDay(dayDate, new Date());

          let className = "w-9 h-9 flex items-center justify-center text-sm rounded-full relative z-10 cursor-pointer transition-colors";
          let wrapperClass = "relative w-9 h-9 flex items-center justify-center";

          if (isSelectedStart && isSelectedEnd) {
              // Single day selected (or start == end)
               className += " bg-brand-600 text-white font-semibold shadow-sm";
          } else if (isSelectedStart) {
               className += " bg-brand-600 text-white font-semibold shadow-sm";
               if (tempDate.to) wrapperClass += " after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1/2 after:bg-brand-50 after:z-0";
          } else if (isSelectedEnd) {
               className += " bg-brand-600 text-white font-semibold shadow-sm";
               if (tempDate.from) wrapperClass += " after:content-[''] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1/2 after:bg-brand-50 after:z-0";
          } else if (isInRange) {
               className += " bg-brand-50 text-brand-900";
               wrapperClass += " bg-brand-50"; // Fill the gap
          } else {
               className += " hover:bg-gray-100 text-gray-700";
          }

          if (isToday && !isSelectedStart && !isSelectedEnd && !isInRange) {
              className += " text-brand-600 font-bold";
          }

          days.push(
              <div key={d} className={wrapperClass} onClick={() => handleDayClick(dayDate)}>
                  <div className={className}>
                      {d}
                  </div>
              </div>
          );
      }

      return (
          <div className="w-full md:w-64 p-2">
              <div className="text-center font-semibold text-gray-900 mb-4">
                  {MONTH_NAMES[month]} {year}
              </div>
              <div className="grid grid-cols-7 text-center mb-2">
                  {DAY_NAMES.map(dn => (
                      <div key={dn} className="text-xs text-gray-400 font-medium">{dn}</div>
                  ))}
              </div>
              <div className="grid grid-cols-7 row-auto gap-y-1">
                  {days}
              </div>
          </div>
      );
  };

  return (
    <div className="relative h-10 w-auto" ref={containerRef}>
        {/* Trigger Button - Updated for hug content width */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="h-full flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm whitespace-nowrap w-auto min-w-[max-content]"
        >
            <CalendarIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-100 w-[calc(100vw-2rem)] md:w-auto origin-top-left">
                
                {/* Left Sidebar: Presets */}
                <div className="w-full md:w-40 border-b md:border-b-0 md:border-r border-gray-200 p-2 bg-gray-50/50 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                    {PRESETS.map((preset) => {
                        const presetVal = preset.getValue();
                        const isActive = 
                            (presetVal.from === undefined && tempDate.from === undefined) || 
                            (presetVal.from && tempDate.from && isSameDay(presetVal.from, tempDate.from) && 
                             presetVal.to && tempDate.to && isSameDay(presetVal.to, tempDate.to));

                        return (
                            <button
                                key={preset.label}
                                onClick={() => {
                                    setTempDate(preset.getValue());
                                    const val = preset.getValue();
                                    if(val.from) setViewDate(val.from);
                                }}
                                className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                                    isActive 
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' 
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>

                {/* Right Area: Calendar & Actions */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-4">
                        <div className="flex items-center justify-between mb-2 px-2">
                             <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                 <ChevronLeft className="w-5 h-5" />
                             </button>
                             <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                 <ChevronRight className="w-5 h-5" />
                             </button>
                        </div>
                        
                        {/* Responsive Calendars: Show 1 on small screens, 2 on medium+ */}
                        <div className="flex justify-center gap-6">
                            {renderCalendar(0)}
                            <div className="hidden lg:block w-px bg-gray-100"></div>
                            <div className="hidden lg:block">
                                {renderCalendar(1)}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between bg-gray-50/30 gap-4">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                             <div className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 shadow-sm flex-1 sm:min-w-[120px] text-center">
                                 {formatDateDisplay(tempDate.from) || 'Start'}
                             </div>
                             <span className="text-gray-400">–</span>
                             <div className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 shadow-sm flex-1 sm:min-w-[120px] text-center">
                                 {formatDateDisplay(tempDate.to) || 'End'}
                             </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button 
                                onClick={handleCancel}
                                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleApply}
                                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-lg shadow-sm hover:bg-brand-700 transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default DateRangePicker;
