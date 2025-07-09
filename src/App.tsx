import React, { useEffect } from 'react';
import { Menu, Settings } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NewspaperViewer from './components/NewspaperViewer';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AdminUpload from './pages/AdminUpload';

interface BackendPDF {
  id: number;
  title: string;
  date: string;
  upload_date: string;
  pdf_file: string;
}

function MainApp() {
  const [currentPage, setCurrentPage] = React.useState(1);
  // const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [pdfFiles, setPdfFiles] = React.useState<BackendPDF[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [numPages, setNumPages] = React.useState<number>(8);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPDFs = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/pdfs/');
        const data = await res.json();
        setPdfFiles(data);
      } catch (err) {
        setPdfFiles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPDFs();
  }, []);

  // Find the PDF with the matching 'date' field to selectedDate
  const getCurrentPDF = () => {
    const match = pdfFiles.find(pdf => pdf.date === selectedDate);
    return match || null; // Return null if no match found instead of falling back to first PDF
  };

  // Check if a PDF exists for the current date
  const hasPDFForCurrentDate = getCurrentPDF() !== null;

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <Header
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        pdfFiles={pdfFiles}
        numPages={numPages}
        hasPDF={hasPDFForCurrentDate}
      />
      <div className="flex relative">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        {/* Main content */}
        <main className="flex-1 lg:mr-80 p-6">
          {loading ? (
            <div className="text-center text-gray-500">در حال بارگذاری...</div>
          ) : (
            <NewspaperViewer 
              currentPage={currentPage} 
              pdfFile={getCurrentPDF() || undefined}
              setNumPages={setNumPages}
            />
          )}
        </main>
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-6 right-6 z-50 lg:hidden bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-900 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Admin Panel Page Button */}
        <button
          onClick={() => navigate('/admin-upload')}
          className="fixed bottom-6 left-6 z-50 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/admin-upload" element={<AdminUpload />} />
    </Routes>
  );
}

export default App;