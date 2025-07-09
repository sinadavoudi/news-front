import React from 'react';
import { 
  Archive, 
  BookOpen, 
  Search, 
  Phone,
  X
} from 'lucide-react';
import asrLogo from '../assets/Asr-Logo-16.png';
import homeIcon from '../assets/home.png';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const menuItems = [
    { icon: 'home', label: 'روزنامه امروز', active: true },
    { icon: Archive, label: 'آرشیو', active: false },
    { icon: BookOpen, label: 'یادداشت ها', active: false },
    { icon: Search, label: 'جستجو', active: false },
    { icon: Phone, label: 'تماس با ما', active: false },
  ];

  return (
    
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      {/* Sidebar */}
      <div className={`fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0`}>
        {/* Logo at the very top */}
        <div className="flex justify-center items-center py-4">
          <img src={asrLogo} alt="Asr Logo" className="h-18 w-auto" />
        </div>
        {/* Close button for mobile */}
        <div className="lg:hidden flex justify-end p-4 border-b border-gray-200">
          <button 
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <a
                  href="#"
                  className={`flex items-center w-full px-6 py-4 rounded-lg transition-colors text-lg ${
                    item.active 
                      ? 'bg-gray-100 text-gray-900 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon === 'home' ? (
                    <img src={homeIcon} alt="Home" className="w-7 h-7 ml-3" />
                  ) : (
                    <item.icon className="w-5 h-5 ml-3" />
                  )}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;