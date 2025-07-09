import React, { useCallback } from 'react';
import { Download, Calendar } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import DateObject from 'react-date-object';
import { saveAs } from 'file-saver';

interface BackendPDF {
  id: number;
  title: string;
  date: string;
  upload_date: string;
  pdf_file: string;
  pages?: any[];
}

interface HeaderProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  pdfFiles?: BackendPDF[];
  numPages: number;
}

const Header: React.FC<HeaderProps> = ({ 
  currentPage, 
  onPageChange, 
  selectedDate, 
  onDateChange,
  pdfFiles = [],
  numPages
}) => {
  const pages = Array.from({ length: numPages }, (_, i) => i + 1);
  // Match by date, normalizing to YYYY-MM-DD
  const currentPDF = pdfFiles.find(pdf => pdf.date && pdf.date.slice(0, 10) === selectedDate.slice(0, 10));
  const downloadUrl = currentPDF && currentPDF.pdf_file ? (currentPDF.pdf_file.startsWith('http') ? currentPDF.pdf_file : `http://localhost:8000${currentPDF.pdf_file}`) : undefined;

  // Debug logs
  console.log('selectedDate:', selectedDate);
  console.log('pdfFiles:', pdfFiles);
  console.log('currentPDF:', currentPDF);
  console.log('downloadUrl:', downloadUrl);

  const handleDownload = useCallback(async () => {
    if (!downloadUrl) return;
    const response = await fetch(downloadUrl, { mode: 'cors' });
    const blob = await response.blob();
    saveAs(blob, currentPDF?.title ? `${currentPDF.title}.pdf` : 'newspaper.pdf');
  }, [downloadUrl, currentPDF]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Download Button - Left Side */}
          <button
            onClick={handleDownload}
            className="flex items-center bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors text-sm"
            disabled={!downloadUrl}
            style={{ opacity: downloadUrl ? 1 : 0.5 }}
          >
            <Download className="w-4 h-4 ml-2" />
            <span>دانلود نسخه الکترونیک</span>
          </button>

          {/* Page Numbers - Center */}
          <div className="flex items-center space-x-1 space-x-reverse">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Date Button - Right Side */}
          <DatePicker
            value={selectedDate ? new DateObject({ date: selectedDate, calendar: gregorian }) : undefined}
            onChange={dateObj => {
              // Convert Jalali date to Gregorian string (YYYY-MM-DD)
              const gregorianDate = dateObj?.convert(gregorian).format('YYYY-MM-DD');
              // onDateChange(gregorianDate);
              if (gregorianDate) onDateChange(gregorianDate);
            }}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            render={(value, openCalendar) => (
              <button
                onClick={openCalendar}
                className="flex items-center bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors text-sm border border-gray-300"
                type="button"
              >
                <Calendar className="w-4 h-4 ml-2 text-gray-600" />
                <span className="text-gray-700">{value || 'انتخاب تاریخ'}</span>
              </button>
            )}
            className="min-w-80 z-50"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;