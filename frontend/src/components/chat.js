// sysmind/frontend/src/pages/Chat/ChatLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/chat/Sidebar';
import { useAuth } from '../../context/AuthContext';

const ChatLayout = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Chat App</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button className="text-sm text-primary-600 hover:text-primary-500">
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ChatLayout;