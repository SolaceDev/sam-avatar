import { useEffect, useMemo, useRef } from "react";

import { ChatInputArea, ChatMessage, LoadingMessageRow } from "@/lib/components/chat";
import { ChatMessageList, CHAT_STYLES } from "@/lib/components/ui";
import { useChatContext, useTaskContext } from "@/lib/hooks";

import type { ChatMessageListRef } from "../ui/chat/chat-message-list";

export function ChatPage() {
    const { agents, sessionId, messages, setMessages, selectedAgentName, setSelectedAgentName } = useChatContext();
    const { isTaskMonitorConnected, isTaskMonitorConnecting, taskMonitorSseError, connectTaskMonitorStream } = useTaskContext();

    // Ref for chat message list
    const chatMessageListRef = useRef<ChatMessageListRef>(null);

    useEffect(() => {
        if (!selectedAgentName && agents.length > 0) {
            const orchestratorAgent = agents.find(agent => agent.name === "OrchestratorAgent");
            const agentName = orchestratorAgent ? orchestratorAgent.name : agents[0].name;

            setSelectedAgentName(agentName);

            const selectedAgent = agents.find(agent => agent.name === agentName);
            const displayedText = selectedAgent?.display_name 
                ? `Hi! I'm the ${selectedAgent?.display_name} Agent. How can I help?` 
                : `Hi! I'm ${agentName}. How can I help?`;

            setMessages(prev => {
                const filteredMessages = prev.filter(msg => !msg.isStatusBubble);
                return [
                    ...filteredMessages,
                    {
                        text: displayedText,
                        isUser: false,
                        isComplete: true,
                        metadata: { sessionId, lastProcessedEventSequence: 0 },
                    },
                ];
            });
        }
    }, [agents, selectedAgentName, sessionId, setMessages, setSelectedAgentName]);

    const lastMessageIndexByTaskId = useMemo(() => {
        const map = new Map<string, number>();
        messages.forEach((message, index) => {
            if (message.taskId) {
                map.set(message.taskId, index);
            }
        });
        return map;
    }, [messages]);

    const loadingMessage = useMemo(() => {
        return messages.find(message => message.isStatusBubble);
    }, [messages]);

    // Handle window focus to reconnect when user returns to chat page
    useEffect(() => {
        const handleWindowFocus = () => {
            // Only attempt reconnection if we're disconnected and have an error
            if (!isTaskMonitorConnected && !isTaskMonitorConnecting && taskMonitorSseError) {
                console.log("ChatPage: Window focused while disconnected, attempting reconnection...");
                connectTaskMonitorStream();
            }
        };

        window.addEventListener("focus", handleWindowFocus);

        return () => {
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, [isTaskMonitorConnected, isTaskMonitorConnecting, taskMonitorSseError, connectTaskMonitorStream]);

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
            {/* Removed header and session sidebar */}
            <div className="flex min-h-0 flex-1">
                <div className="min-h-0 flex-1 overflow-x-auto">
                    <div className="h-full">
                        <div className="flex h-full w-full flex-col py-6">
                            <ChatMessageList className="text-base" ref={chatMessageListRef}>
                                {messages.map((message, index) => {
                                    const isLastWithTaskId = !!(message.taskId && lastMessageIndexByTaskId.get(message.taskId) === index);
                                    return <ChatMessage 
                                        message={message} 
                                        key={`${message.metadata?.sessionId || "session"}-${index}-${message.isUser ? "received" : "sent"}`} 
                                        isLastWithTaskId={isLastWithTaskId} 
                                    />;
                                })}
                            </ChatMessageList>
                            <div style={CHAT_STYLES}>
                                {loadingMessage && <LoadingMessageRow statusText={loadingMessage.text} onViewWorkflow={undefined} />}
                                <ChatInputArea scrollToBottom={chatMessageListRef.current?.scrollToBottom} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Removed ChatSessionDialog */}
        </div>
    );
}
