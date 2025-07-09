import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

// Jalali calendar conversion functions
const jalaliToGregorian = (jy: number, jm: number, jd: number) => {
  const epbase = jy - 979;
  const epyear = 33 * Math.floor(epbase / 33) + ((epbase % 33 + 3) / 4);
  const auxm = jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186;
  const auxd = jd + Math.floor(epyear * 365.2422) + auxm;
  const gy = Math.floor(auxd / 365.2422) + 1600;
  const gd = auxd - Math.floor((gy - 1600) * 365.2422);
  const sal_a = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  
  let gm = 0;
  if (gd <= 79) {
    const leap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0) ? 1 : 0;
    const sal_b = [0, 31, 59 + leap, 90 + leap, 120 + leap, 151 + leap, 181 + leap, 212 + leap, 243 + leap, 273 + leap, 304 + leap, 334 + leap];
    gm = 0;
    for (let i = 0; i < sal_b.length; i++) {
      const v = sal_b[i];
      if (gd <= v) {
        gm = i;
        break;
      }
    }
    if (gm > 0) {
      const gdd = gd - sal_b[gm - 1];
      return new Date(gy, gm - 1, gdd);
    }
  } else {
    gm = 0;
    for (let i = 0; i < sal_a.length; i++) {
      const v = sal_a[i];
      if (gd <= v) {
        gm = i;
        break;
      }
    }
    if (gm > 0) {
      const gdd = gd - sal_a[gm - 1];
      return new Date(gy, gm - 1, gdd);
    }
  }
  return new Date(gy, 0, 1);
};

const gregorianToJalali = (gy: number, gm: number, gd: number) => {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  const days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  const jy_f = -14 + 33 * Math.floor(days / 12053);
  let jy_c = jy_f + 979;
  let days_f = days - 12053 * Math.floor(days / 12053);
  jy_c += 33 * Math.floor(days_f / 12053);
  days_f %= 12053;
  const leap_adj = Math.floor((days_f + 1) / 1029);
  const leap_cycle = 33 * leap_adj;
  const cyear = Math.floor((days_f - leap_adj) / 365);
  let yday = days_f - leap_adj - 365 * cyear;
  jy_c += leap_cycle + cyear;
  if (yday < 186) {
    const jm = 1 + Math.floor(yday / 31);
    const jd = 1 + (yday % 31);
    return { year: jy_c, month: jm, day: jd };
  } else {
    const jm = 7 + Math.floor((yday - 186) / 30);
    const jd = 1 + ((yday - 186) % 30);
    return { year: jy_c, month: jm, day: jd };
  }
};

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateChange }) => {
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

  // Convert Persian numbers to English
  const persianToEnglish = (str: string) => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    for (let i = 0; i < persianNumbers.length; i++) {
      str = str.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
    }
    return str;
  };

  // Convert English numbers to Persian
  const englishToPersian = (str: string | number) => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    str = str.toString();
    for (let i = 0; i < englishNumbers.length; i++) {
      str = str.replace(new RegExp(englishNumbers[i], 'g'), persianNumbers[i]);
    }
    return str;
  };



  const getDaysInJalaliMonth = (jYear: number, jMonth: number) => {
    const daysInMonth = jMonth <= 6 ? 31 : jMonth <= 11 ? 30 : (isJalaliLeapYear(jYear) ? 30 : 29);
    const firstDay = jalaliToGregorian(jYear, jMonth, 1);
    const startingDayOfWeek = (firstDay.getDay() + 1) % 7; // Adjust for Saturday start

    const days = [];
    
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

  const isJalaliLeapYear = (year: number) => {
    const breaks = [
      -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
      1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
    ];
    
    let jp = breaks[0];
    let jump = 0;
    for (let j = 1; j <= 19; j++) {
      const jm = breaks[j];
      jump = jm - jp;
      if (year < jm) break;
      jp = jm;
    }
    
    const n = year - jp;
    if (n < jump) {
      if (n < 29) {
        return (n % 33) * 682 % 1029 < 30;
      } else {
        return ((n - 29) % 33) * 682 % 1029 < 30;
      }
    }
    return false;
  };

  const handleDateSelect = (jalaliDate: { year: number; month: number; day: number }) => {
    const gregorianDate = jalaliToGregorian(jalaliDate.year, jalaliDate.month, jalaliDate.day);
    onDateChange(gregorianDate.toISOString().split('T')[0]);
    setIsOpen(false);
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

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const jalali = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return `${englishToPersian(jalali.day)} ${jalaliMonthNames[jalali.month - 1]} ${englishToPersian(jalali.year)}`;
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
    const date = new Date(selectedDate);
    return gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };

  const todayJalali = getCurrentJalaliDate();
  const selectedJalali = getSelectedJalaliDate();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md text-sm font-medium"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
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
                      ? 'bg-blue-600 text-white shadow-lg scale-105 hover:bg-blue-700'
                      : isToday
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
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
            className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-3 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300"
          >
            امروز
          </button>
        </div>
      )}
    </div>
  );
};

// Demo Component
const App = () => {
  const [selectedDate, setSelectedDate] = useState('2024-07-09');

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">انتخاب تاریخ</h1>
        <DatePicker 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate} 
        />
        <p className="mt-4 text-sm text-gray-600">
          تاریخ انتخاب شده: {selectedDate}
        </p>
      </div>
    </div>
  );
};

export default App;