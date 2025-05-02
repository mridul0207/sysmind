import { NavLink } from 'react-router-dom';
import { FiMessageSquare, FiUsers, FiSettings } from 'react-icons/fi';

const Sidebar = () => {
  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-4">
        <nav className="mt-6">
          <NavLink
            to="/chat"
            className={({ isActive }) => 
              `flex items-center px-4 py-2 rounded-lg ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            <FiMessageSquare className="mr-3" />
            Messages
          </NavLink>
          <NavLink
            to="/chat/contacts"
            className={({ isActive }) => 
              `flex items-center px-4 py-2 rounded-lg mt-2 ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            <FiUsers className="mr-3" />
            Contacts
          </NavLink>
          <NavLink
            to="/chat/settings"
            className={({ isActive }) => 
              `flex items-center px-4 py-2 rounded-lg mt-2 ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            <FiSettings className="mr-3" />
            Settings
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;