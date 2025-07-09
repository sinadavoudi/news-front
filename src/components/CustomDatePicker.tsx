import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// Simplified and accurate Jalali conversion functions
const isLeapJalaaliYear = (jy: number): boolean => {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
  ];
  
  let jp = breaks[0];
  let jump = 0;
  
  for (let j = 1; j <= 19; j++) {
    const jm = breaks[j];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  
  const n = jy - jp;
  
  if (n < jump) {
    if (n < 29) {
      return (n % 33) * 682 % 1029 < 30;
    } else {
      return ((n - 29) % 33) * 682 % 1029 < 30;
    }
  }
  
  return false;
};

const jalaliToGregorian = (jy: number, jm: number, jd: number): Date => {
  const epyear = jy - 979;
  const epochday = 365 * epyear + Math.floor(epyear / 33) * 8 + Math.floor((epyear % 33 + 3) / 4);
  
  let auxm: number;
  if (jm < 7) {
    auxm = (jm - 1) * 31;
  } else {
    auxm = (jm - 7) * 30 + 186;
  }
  
  const auxd = jd + epochday + auxm;
  
  let gy = Math.floor(auxd / 365.2422) + 1600;
  let gd = auxd - Math.floor((gy - 1600) * 365.2422);
  
  // Adjust for leap years
  while (gd <= 0) {
    gy--;
    const isLeap = ((gy % 4 === 0) && (gy % 100 !== 0)) || (gy % 400 === 0);
    gd += isLeap ? 366 : 365;
  }
  
  const isLeap = ((gy % 4 === 0) && (gy % 100 !== 0)) || (gy % 400 === 0);
  const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  let gm = 1;
  while (gm <= 12 && gd > daysInMonth[gm - 1]) {
    gd -= daysInMonth[gm - 1];
    gm++;
  }
  
  return new Date(gy, gm - 1, gd);
};

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

interface CustomDatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selectedDate, onDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentJalaliMonth, setCurrentJalaliMonth] = useState(() => {
    const today = new Date();
    return gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getDaysInJalaliMonth = (jYear: number, jMonth: number) => {
    let daysInMonth: number;
    if (jMonth <= 6) {
      daysInMonth = 31;
    } else if (jMonth <= 11) {
      daysInMonth = 30;
    } else {
      daysInMonth = isLeapJalaaliYear(jYear) ? 30 : 29;
    }
    
    // Get the first day of the month in Gregorian
    const firstDayGregorian = jalaliToGregorian(jYear, jMonth, 1);
    
    // Adjust for Saturday start (Persian calendar starts on Saturday)
    const startingDayOfWeek = (firstDayGregorian.getDay() + 1) % 7;

    const days: (null | { year: number; month: number; day: number })[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ year: jYear, month: jMonth, day });
    }
    
    return days;
  };

  const handleDateSelect = (jalaliDate: { year: number; month: number; day: number }) => {
    try {
      const gregorianDate = jalaliToGregorian(jalaliDate.year, jalaliDate.month, jalaliDate.day);
      
      // Format as YYYY-MM-DD
      const year = gregorianDate.getFullYear();
      const month = String(gregorianDate.getMonth() + 1).padStart(2, '0');
      const day = String(gregorianDate.getDate()).padStart(2, '0');
      
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log('Selected Jalali:', jalaliDate);
      console.log('Converted Gregorian:', gregorianDate);
      console.log('Formatted date:', formattedDate);
      
      onDateChange(formattedDate);
      setIsOpen(false);
    } catch (error) {
      console.error('Error converting date:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentJalaliMonth(prev => {
      let newMonth = prev.month;
      let newYear = prev.year;
      
      if (direction === 'next') {
        newMonth++;
        if (newMonth > 12) {
          newMonth = 1;
          newYear++;
        }
      } else {
        newMonth--;
        if (newMonth < 1) {
          newMonth = 12;
          newYear--;
        }
      }
      
      return { year: newYear, month: newMonth, day: 1 };
    });
  };

  const formatDisplayDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      const jalali = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
      return `${englishToPersian(jalali.day)} ${jalaliMonthNames[jalali.month - 1]} ${englishToPersian(jalali.year)}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const jalaliMonthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const dayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const days = getDaysInJalaliMonth(currentJalaliMonth.year, currentJalaliMonth.month);

  // Get current Jalali date for "today" comparison
  const getCurrentJalaliDate = () => {
    const today = new Date();
    return gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
  };

  const getSelectedJalaliDate = () => {
    try {
      const date = new Date(selectedDate);
      if (isNaN(date.getTime())) {
        return getCurrentJalaliDate();
      }
      return gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    } catch (error) {
      console.error('Error getting selected Jalali date:', error);
      return getCurrentJalaliDate();
    }
  };

  const todayJalali = getCurrentJalaliDate();
  const selectedJalali = getSelectedJalaliDate();

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
              {jalaliMonthNames[currentJalaliMonth.month - 1]} {englishToPersian(currentJalaliMonth.year)}
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

              const isSelected = day.year === selectedJalali.year && 
                               day.month === selectedJalali.month && 
                               day.day === selectedJalali.day;
              
              const isToday = day.year === todayJalali.year && 
                             day.month === todayJalali.month && 
                             day.day === todayJalali.day;

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
                  {englishToPersian(day.day)}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <button
            onClick={() => handleDateSelect(todayJalali)}
            className="w-full text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-3 rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400"
          >
            امروز
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;