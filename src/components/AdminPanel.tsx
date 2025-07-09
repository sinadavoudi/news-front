import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Trash2, Eye, Calendar, Save, X, LogOut, Home, Plus } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import dayjs from 'dayjs';
import DateObject from 'react-date-object';

interface BackendPDF {
  id: number;
  title: string;
  upload_date: string;
  pdf_file: string;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
}

const API_BASE = 'http://localhost:8000/api';
const MEDIA_BASE = 'http://localhost:8000';

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, token }) => {
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<DateObject>(new DateObject({ calendar: persian, locale: persian_fa }));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfs, setPDFs] = useState<BackendPDF[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch PDFs from backend
  const fetchPDFs = async () => {
    try {
      const res = await fetch(`${API_BASE}/pdfs/`);
      const data = await res.json();
      setPDFs(data);
    } catch (err) {
      setError('خطا در دریافت لیست روزنامه‌ها');
    }
  };

  useEffect(() => {
    if (isOpen) fetchPDFs();
  }, [isOpen]);

  // Handle PDF file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setSelectedFile(null);
      setError('فقط فایل PDF مجاز است.');
    }
  };

  // Upload PDF to backend
  const handleUpload = async () => {
    if (!selectedFile || !selectedTitle || !selectedDate) {
      setError('عنوان، تاریخ و فایل PDF را وارد کنید.');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      // Convert Jalali date to Gregorian string (YYYY-MM-DD)
      const gregorianDate = selectedDate.convert(gregorian, persian_fa).format('YYYY-MM-DD');
      const formData = new FormData();
      formData.append('title', selectedTitle);
      formData.append('date', gregorianDate);
      formData.append('pdf_file', selectedFile);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/pdfs/upload/`);
      xhr.setRequestHeader('Accept', 'application/json');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.withCredentials = false;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      };
      xhr.onload = () => {
        setIsUploading(false);
        setUploadProgress(0);
        if (xhr.status === 201) {
          setSelectedFile(null);
          setSelectedTitle('');
          setShowUploadForm(false);
          fetchPDFs();
        } else {
          setError('خطا در آپلود فایل.');
        }
      };
      xhr.onerror = () => {
        setIsUploading(false);
        setError('خطا در ارتباط با سرور.');
      };
      xhr.send(formData);
    } catch (err) {
      setIsUploading(false);
      setError('خطا در آپلود فایل.');
    }
  };

  // Delete PDF
  const handleDelete = async (id: number) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این روزنامه را حذف کنید؟')) {
      try {
        console.log('Deleting PDF with ID:', id);
        const response = await fetch(`${API_BASE}/pdfs/${id}/`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        console.log('Delete response status:', response.status);
        
        if (response.ok || response.status === 204) {
          console.log('PDF deleted successfully');
          fetchPDFs(); // Refresh the list
        } else {
          const errorText = await response.text();
          console.error('Delete error:', errorText);
          setError(`خطا در حذف روزنامه. کد خطا: ${response.status}`);
        }
      } catch (err) {
        console.error('Delete request failed:', err);
        setError('خطا در ارتباط با سرور برای حذف روزنامه.');
      }
    }
  };

  // View PDF
  const handleViewPDF = (pdf: BackendPDF) => {
    const url = pdf.pdf_file.startsWith('http') ? pdf.pdf_file : `${MEDIA_BASE}${pdf.pdf_file}`;
    window.open(url, '_blank');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <header className="bg-gray-800 text-white shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h1 className="text-2xl font-bold">پنل مدیریت روزنامه</h1>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 ml-2" />
              <span className="hidden md:inline">آپلود جدید</span>
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 ml-2" />
              <span className="hidden md:inline">بازگشت به خانه</span>
            </button>
            <button
              onClick={async () => {
                try {
                  // Call backend logout endpoint
                  const response = await fetch(`${API_BASE}/admin/logout/`, {
                    method: 'POST',
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                      ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    credentials: 'include'
                  });
                  
                  if (response.ok) {
                    console.log('Admin logged out successfully');
                  } else {
                    console.error('Logout failed:', response.status);
                  }
                } catch (err) {
                  console.error('Logout request failed:', err);
                } finally {
                  // Clear any stored tokens/session
                  localStorage.removeItem('admin_jwt');
                  sessionStorage.removeItem('admin_jwt');
                  // Redirect to home page
                  window.location.href = '/';
                }
              }}
              className="flex items-center bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 ml-2" />
              <span className="hidden md:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Upload Form Sidebar */}
        {showUploadForm && (
          <div className="w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">آپلود روزنامه جدید</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عنوان روزنامه</label>
                <input
                  type="text"
                  value={selectedTitle}
                  onChange={e => setSelectedTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="عنوان را وارد کنید"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ روزنامه</label>
                <DatePicker
                  value={selectedDate}
                  onChange={date => setSelectedDate(date as DateObject)}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  inputClass="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">آپلود فایل PDF</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center w-full"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <span className="text-gray-600">
                      {isUploading ? 'در حال آپلود...' : 'کلیک کنید یا فایل PDF را انتخاب کنید'}
                    </span>
                    <span className="text-sm text-gray-500 mt-2">فقط PDF</span>
                  </button>
                  {selectedFile && (
                    <div className="mt-2 text-sm text-gray-700">{selectedFile.name}</div>
                  )}
                </div>
                {isUploading && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>در حال آپلود...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
              </div>
              
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !selectedTitle || !selectedDate || isUploading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Save className="w-5 h-5 ml-2" />
                ذخیره روزنامه
              </button>
            </div>
          </div>
        )}

        {/* Files List */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">روزنامه‌های آپلود شده</h2>
            <p className="text-gray-600">لیست تمام روزنامه‌هایی که آپلود کرده‌اید</p>
          </div>

          {pdfs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-24 h-24 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2 text-gray-500">هیچ روزنامه‌ای آپلود نشده</h3>
              <p className="text-gray-400">برای شروع، روی "آپلود جدید" کلیک کنید</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{pdf.title}</h3>
                      <p className="text-sm text-gray-600">
                        آپلود شده: {formatDate(pdf.upload_date)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleViewPDF(pdf)}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 ml-2" />
                        مشاهده
                      </button>
                      <button
                        onClick={() => handleDelete(pdf.id)}
                        className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;