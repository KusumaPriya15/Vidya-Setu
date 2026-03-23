import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import * as api from '../lib/api';
import { ChatMessage } from '../types';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';

// --- ICONS ---
const MessageSquareIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const XIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SendIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9L12 16l1.9-4.8 4.8-1.9-4.8-1.9L12 3z"/><path d="M5 22v-5l-1.9-4.8-4.8-1.9 4.8-1.9L5 5v5"/><path d="M19 22v-5l1.9-4.8 4.8-1.9-4.8-1.9L19 5v5"/></svg>;
const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const BotIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>;
const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>;
const LoaderIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>;

type ChatMode = 'fast' | 'balanced' | 'smart' | 'search';

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: "Hello! I'm your AI assistant. How can I help you today?" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatMode, setChatMode] = useState<ChatMode>('balanced');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const userMessage = inputValue.trim();
        if (!userMessage || isLoading) return;

        const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMessage }];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        const history = newMessages.slice(0, -1);

        try {
            if (chatMode === 'fast') {
                const stream = await api.sendMessageAndGetStream(history, userMessage);
                let fullResponse = '';
                setMessages(prev => [...prev, { role: 'model', text: '' }]);
                for await (const chunk of stream) {
                    fullResponse += chunk.text;
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1].text = fullResponse;
                        return updated;
                    });
                }
            } else {
                const response = await api.getChatbotResponse(history, userMessage, chatMode);
                setMessages(prev => [...prev, { role: 'model', text: response.text, sources: response.sources }]);
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'model', text: `Sorry, I encountered an error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-violet-600 text-white p-4 rounded-full shadow-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-transform hover:scale-110 z-40"
                aria-label="Toggle AI Assistant"
            >
                {isOpen ? <XIcon className="w-6 h-6" /> : <MessageSquareIcon className="w-6 h-6" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col animate-in fade-in-0 slide-in-from-bottom-5 duration-300 z-40 pointer-events-auto">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-lg text-slate-900 text-center">AI Assistant</h3>
                        <div className="flex justify-center items-center gap-1 mt-2">
                            <ModeButton mode="fast" currentMode={chatMode} setMode={setChatMode} icon={<ZapIcon className="w-4 h-4" />}>Fast</ModeButton>
                            <ModeButton mode="balanced" currentMode={chatMode} setMode={setChatMode} icon={<SparklesIcon className="w-4 h-4" />}>Balanced</ModeButton>
                            <ModeButton mode="smart" currentMode={chatMode} setMode={setChatMode} icon={<BotIcon className="w-4 h-4" />}>Smart</ModeButton>
                            <ModeButton mode="search" currentMode={chatMode} setMode={setChatMode} icon={<GlobeIcon className="w-4 h-4" />}>Web Search</ModeButton>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className={cn("flex items-end gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                {msg.role === 'model' && <BotIcon className="w-6 h-6 p-1 bg-indigo-100 text-indigo-600 rounded-full shrink-0" />}
                                <div className={cn("max-w-[80%] rounded-2xl px-4 py-2", msg.role === 'user' ? "bg-violet-600 text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none")}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-slate-200 space-y-1">
                                            <p className="text-xs font-semibold text-slate-500">Sources:</p>
                                            {msg.sources.map((source, i) => (
                                                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:underline truncate">
                                                    <LinkIcon className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{source.title || source.uri}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-end gap-2 justify-start">
                                <BotIcon className="w-6 h-6 p-1 bg-indigo-100 text-indigo-600 rounded-full shrink-0" />
                                <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3">
                                    <LoaderIcon className="w-5 h-5 text-slate-500 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex items-center gap-2">
                        <Textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e as any);
                                }
                            }}
                            placeholder="Ask anything..."
                            className="flex-1 resize-none bg-white border-slate-200 text-slate-900 min-h-0 h-10"
                            rows={1}
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                            <SendIcon className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            )}
        </>
    );
};

const ModeButton: React.FC<{
    mode: ChatMode;
    currentMode: ChatMode;
    setMode: (mode: ChatMode) => void;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ mode, currentMode, setMode, icon, children }) => (
    <button
        onClick={() => setMode(mode)}
        className={cn(
            "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors",
            currentMode === mode
                ? "bg-violet-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        )}
    >
        {icon}
        {children}
    </button>
);

export default ChatBot;