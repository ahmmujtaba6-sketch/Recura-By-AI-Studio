import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Activity,
  Video,
  Lock,
  Search,
  Sparkles,
  CheckCheck,
  Check,
  Clock,
  User,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { VideoCallModal } from '../../components/video/VideoCallModal.tsx';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachPain, setAttachPain] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Video call from chat
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoRoomUrl, setVideoRoomUrl] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isFreePlanPatient = user?.role === 'patient' && (!user?.plan?.plan || user?.plan?.plan === 'free');

  useEffect(() => {
    fetchContacts();
  }, []);

  // Poll messages every 3 seconds for active conversation
  useEffect(() => {
    if (!selectedContact) return;

    fetchMessages(selectedContact.userId);

    const interval = setInterval(() => {
      fetchMessages(selectedContact.userId, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedContact]);

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const res = await fetch('/api/chat/contacts');
      if (res.ok) {
        const data = await res.json();
        const contactList = data.contacts || [];
        setContacts(contactList);
        if (contactList.length > 0 && !selectedContact) {
          setSelectedContact(contactList[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching chat contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchMessages = async (otherUserId: number, isPolling = false) => {
    try {
      const res = await fetch(`/api/chat/messages/${otherUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (!isPolling) {
          scrollToBottom();
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !inputText.trim()) return;

    if (isFreePlanPatient) {
      showToast('Chat with physiotherapists is available on Basic and Premium plans.', 'info', 'Upgrade Required');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`/api/chat/messages/${selectedContact.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          attachPainScore: attachPain,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setInputText('');
      setAttachPain(false);
      fetchMessages(selectedContact.userId);
      scrollToBottom();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleStartVideoCall = async () => {
    try {
      const res = await fetch('/api/video/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start video call');
      }

      setVideoRoomUrl(data.roomUrl);
      setVideoModalOpen(true);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Clinical Messaging</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Practitioner & Patient Messages
          </h1>
        </div>

        {selectedContact && (
          <button
            onClick={handleStartVideoCall}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Start Video Call</span>
          </button>
        )}
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xs flex overflow-hidden">
        {/* Left: Contacts Sidebar */}
        <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-850">
            {isLoadingContacts ? (
              <div className="py-12 flex justify-center text-zinc-400">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                No active conversations found.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.userId === contact.userId;
                return (
                  <button
                    key={contact.userId}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-teal-50/70 dark:bg-teal-950/40 border-l-4 border-teal-600'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold flex items-center justify-center shrink-0">
                      {contact.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                          {contact.name}
                        </span>
                        {contact.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-teal-600 text-white shrink-0">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {contact.subtitle}
                      </p>
                      {contact.lastMessage && (
                        <p className="text-[11px] text-zinc-400 truncate mt-1 italic">
                          {contact.lastMessage}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Messages Thread */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/50 dark:bg-zinc-950/50">
          {selectedContact ? (
            <>
              {/* Active Contact Header */}
              <div className="px-5 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold flex items-center justify-center">
                    {selectedContact.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      {selectedContact.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      {selectedContact.subtitle} • {selectedContact.city || 'Pakistan'}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Encrypted Channel</span>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {messages.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400 text-xs">
                    No messages yet. Send a message to start this clinical consultation conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                            isMe
                              ? 'bg-teal-600 text-white rounded-br-xs shadow-xs'
                              : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-400 px-1">
                          <span>{msg.created_at?.split(' ')[1]?.slice(0, 5) || msg.created_at?.slice(11, 16)}</span>
                          {isMe && (
                            msg.read_at ? (
                              <CheckCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-zinc-400" />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input or Free Plan Locked Notice */}
              {isFreePlanPatient ? (
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 text-xs">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Direct chat is locked on the Free tier. Upgrade to Basic or Premium to message your therapist.</span>
                  </div>
                  <a
                    href="#plans"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast('Navigate to Plans & Billing to unlock direct chat messaging.', 'info');
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                  >
                    View Plans
                  </a>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-2 shrink-0"
                >
                  {user?.role === 'patient' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAttachPain(!attachPain)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          attachPain
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300'
                            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
                        }`}
                      >
                        <Activity className="w-3 h-3 text-teal-600" />
                        <span>{attachPain ? '✓ Attaching latest VAS pain score' : '+ Attach latest VAS pain score'}</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Message ${selectedContact.name}...`}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !inputText.trim()}
                      className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white shadow-xs transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm font-semibold">Select a conversation</p>
              <p className="text-xs max-w-xs mt-1">
                Choose a therapist or patient from the left column to view message history.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        roomUrl={videoRoomUrl}
      />
    </div>
  );
};
