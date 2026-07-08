import React, { useState, useEffect } from 'react';
import { PlantProvider } from './store';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ToastProvider';
import { InstallPromptProvider } from './components/InstallPrompt';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PlantDetail } from './pages/PlantDetail';
import { GrowthSimulation } from './pages/GrowthSimulation';
import { PlantMood } from './pages/PlantMood';
import { VoiceInteraction } from './pages/VoiceInteraction';
import { Welcome } from './pages/Welcome';
import { PlantIdentifier } from './pages/PlantIdentifier';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      let path = window.location.hash || '#/';
      // Ensure we have a valid route, default to welcome if root
      if (path === '' || path === '#') path = '#/';
      setCurrentPath(path);
    };
    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const renderRoute = () => {
    if (currentPath.startsWith('#/voice')) {
      return <VoiceInteraction />;
    }

    if (currentPath.startsWith('#/identify')) {
        return <PlantIdentifier navigate={navigate} />;
    }

    if (currentPath.startsWith('#/plant/') && currentPath.endsWith('/simulate')) {
      const parts = currentPath.split('/');
      const plantId = parts[2]; 
      return <GrowthSimulation plantId={plantId} onBack={() => navigate(`#/plant/${plantId}`)} />;
    }

    if (currentPath.startsWith('#/plant/') && currentPath.endsWith('/mood')) {
      const parts = currentPath.split('/');
      const plantId = parts[2]; 
      return <PlantMood plantId={plantId} onBack={() => navigate(`#/plant/${plantId}`)} />;
    }
    
    if (currentPath.startsWith('#/plant/')) {
      const plantId = currentPath.replace('#/plant/', '');
      return <PlantDetail plantId={plantId} onBack={() => navigate('#/dashboard')} />;
    }

    if (currentPath === '#/dashboard') {
        return <Dashboard navigate={navigate} />;
    }
    
    // Default fallback (though Welcome handles root)
    return <Welcome onStart={() => navigate('#/dashboard')} />;
  };

  // If we are at root or welcome, show Welcome page without Layout (nav shell)
  const isWelcomePage = currentPath === '#/' || currentPath === '' || currentPath === '#' || currentPath === '#/welcome';

  return (
    <ThemeProvider>
      <ToastProvider>
        <InstallPromptProvider>
          <PlantProvider>
            {isWelcomePage ? (
              <Welcome onStart={() => navigate('#/dashboard')} />
            ) : (
              <Layout navigate={navigate} currentPath={currentPath}>
                <div key={currentPath} className="animate-fade-in-up">
                  {renderRoute()}
                </div>
              </Layout>
            )}
          </PlantProvider>
        </InstallPromptProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}