import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

// Jalali to Gregorian conversion
const jalaliToGregorian = (jy: number, jm: number, jd: number): Date => {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  
  let gy = jy <= 979 ? 0 : 621;
  let temp = jy;
  if (jy > 979) {
    gy += 33;
    temp -= 33;
  }
  
  const days = (365 * temp) + ((temp > 2 ? temp + 1 : temp) / 4) + 78 + jd + g_d_m[jm - 1];
  gy += 400 * Math.floor(days / 146097);
  temp = days % 146097;
  
  if (temp > 36524) {
    gy += 100 * Math.floor(--temp / 36524);
    temp %= 36524;
    if (temp >= 365) temp++;
  }
  
  gy += 4 * Math.floor(temp / 1461);
  temp %= 1461;
  
  if (temp > 365) {
    gy += Math.floor((temp - 1) / 365);
    temp = (temp - 1) % 365;
  }
  
  let gd = temp + 1;
  let gm;
  for (gm = 0; gm < 12 && gd > g_d_m[gm]; gm++) {
    gd -= g_d_m[gm];
  }
  
  return new Date(gy, gm, gd);
};

// Gregorian to Jalali conversion
const gregorianToJalali = (gy: number, gm: number, gd: number): { year: number; month: number; day: number } => {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  
  const gy2 = gm > 2 ? gy + 1 : gy;
  const days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + 
               Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  
  jy += 33 * Math.floor(days / 12053);
  let days_remaining = days % 12053;
  
  jy += 4 * Math.floor(days_remaining / 1461);
  days_remaining = days_remaining % 1461;
  
  if (days_remaining >= 366) {
    jy += Math.floor((days_remaining - 1) / 365);
    days_remaining = (days_remaining - 1) % 365;
  }
  
  let jm: number, jd_final: number;
  if (days_remaining < 186) {
    jm = 1 + Math.floor(days_remaining / 31);
    jd_final = 1 + (days_remaining % 31);
  } else {
    jm = 7 + Math.floor((days_remaining - 186) / 30);
    jd_final = 1 + ((days_remaining - 186) % 30);
  }
  
  return { year: jy, month: jm, day: jd_final };
};

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDateObj = new Date(selectedDate);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    // Format date in local timezone to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    onDateChange(dateString);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Convert English numbers to Persian
  const englishToPersian = (str: string | number): string => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    let result = str.toString();
    for (let i = 0; i < englishNumbers.length; i++) {
      result = result.replace(new RegExp(englishNumbers[i], 'g'), persianNumbers[i]);
    }
    return result;
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const jalali = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const day = englishToPersian(jalali.day);
    const month = persianMonthNames[jalali.month - 1];
    const year = englishToPersian(jalali.year);
    return `${day} ${month} ${year}`;
  };

  const persianMonthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const dayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors text-sm border border-gray-300"
        type="button"
      >
        <Calendar className="w-4 h-4 ml-2 text-gray-600" />
        <span className="text-gray-700">{formatDisplayDate(selectedDate)}</span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-6 min-w-80 backdrop-blur-sm">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-800">
              {persianMonthNames[gregorianToJalali(currentMonth.getFullYear(), currentMonth.getMonth() + 1, currentMonth.getDate()).month - 1]} {englishToPersian(gregorianToJalali(currentMonth.getFullYear(), currentMonth.getMonth() + 1, currentMonth.getDate()).year)}
            </h3>
            
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-6">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2"></div>;
              }

              const isSelected = day.toDateString() === selectedDateObj.toDateString();
              const isToday = day.toDateString() === new Date().toDateString();

              const jalaliDay = gregorianToJalali(day.getFullYear(), day.getMonth() + 1, day.getDate());
              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day)}
                  className={`
                    p-2 text-sm rounded-lg transition-all duration-200 font-medium
                    ${isSelected
                      ? 'bg-gray-800 text-white shadow-lg scale-105 hover:bg-gray-700'
                      : isToday
                      ? 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {englishToPersian(jalaliDay.day)}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <button
            onClick={() => handleDateSelect(new Date())}
            className="w-full text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-3 rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400"
          >
            امروز
          </button>
        </div>
      )}
    </div>
  );
};

export default DatePicker;