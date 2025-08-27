import { ChatPage, ToastContainer, Button } from "@/lib/components";
import { AuthProvider, ChatProvider, ConfigProvider, CsrfProvider, TaskProvider, ThemeProvider } from "@/lib/providers";

import { useAuthContext, useBeforeUnload } from "@/lib/hooks";

function AppContent() {
    const { isAuthenticated, login, useAuthorization } = useAuthContext();
    
    // Enable beforeunload warning when chat data is present
    useBeforeUnload();

    if (useAuthorization && !isAuthenticated) {
        return (
            <div className="bg-background flex h-screen items-center justify-center">
                <Button onClick={login}>Login</Button>
            </div>
        );
    }

    return (
        <div className={`relative flex h-screen`}>
            <main className="h-full w-full flex-1 overflow-auto"><ChatPage /></main>
            <ToastContainer />
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <CsrfProvider>
                <ConfigProvider>
                    <AuthProvider>
                        <ChatProvider>
                            <TaskProvider>
                                <AppContent />
                            </TaskProvider>
                        </ChatProvider>
                    </AuthProvider>
                </ConfigProvider>
            </CsrfProvider>
        </ThemeProvider>
    );
}

export default App;
