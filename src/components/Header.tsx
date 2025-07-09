import React, { useCallback } from 'react';
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import DatePicker from './DatePicker Asli';
// import CustomDatePicker from './CustomDatePicker';

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
  hasPDF: boolean;
}

// Utility to convert English numbers to Persian
const englishToPersian = (str: string | number): string => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = str.toString();
  for (let i = 0; i < englishNumbers.length; i++) {
    result = result.replace(new RegExp(englishNumbers[i], 'g'), persianNumbers[i]);
  }
  return result;
};

const Header: React.FC<HeaderProps> = ({ 
  currentPage, 
  onPageChange, 
  selectedDate, 
  onDateChange,
  pdfFiles = [],
  numPages,
  hasPDF
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
          {hasPDF && (
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
                  {englishToPersian(page)}
                </button>
              ))}
            </div>
          )}

          {/* Custom Date Picker - Right Side */}
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;