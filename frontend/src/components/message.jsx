// sysmind/frontend/src/components/chat/Message.jsx
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const Message = ({ message, isCurrentUser }) => {
  const { user } = useAuth();
  
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isCurrentUser ? 'bg-primary-600 text-white' : 'bg-white border'}`}
      >
        {!isCurrentUser && (
          <div className="font-semibold text-sm text-gray-700">
            {message.senderEmail || 'Unknown'}
          </div>
        )}
        <div className={isCurrentUser ? 'text-white' : 'text-gray-800'}>
          {message.message}
        </div>
        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-100' : 'text-gray-500'}`}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </div>
      </div>
    </div>
  );
};

export default Message;