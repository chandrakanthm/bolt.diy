import React, { useState } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { FigmaService } from '~/lib/services/figmaService';

interface FigmaImportButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export const FigmaImportButton: React.FC<FigmaImportButtonProps> = ({ className, importChat }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleImport = async () => {
    if (!figmaUrl.trim()) {
      toast.error('Please enter a Figma URL');
      return;
    }

    if (!apiKey.trim()) {
      toast.error('Please enter your Figma API key');
      return;
    }

    const fileId = FigmaService.extractFileId(figmaUrl);

    if (!fileId) {
      toast.error('Invalid Figma URL. Please check the URL format.');
      return;
    }

    setIsLoading(true);

    const loadingToast = toast.loading('Importing Figma design...');

    try {
      const response = await fetch('/api/figma-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          figmaUrl: figmaUrl.trim(),
          apiKey: apiKey.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import Figma design');
      }

      if (importChat && data.messages) {
        await importChat('Figma Design Import', data.messages);
      }

      toast.success('Figma design imported successfully');
      setShowDialog(false);
      setFigmaUrl('');
      setApiKey('');
    } catch (error) {
      console.error('Failed to import Figma design:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import Figma design');
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        title="Import from Figma"
        variant="default"
        size="lg"
        className={classNames(
          'gap-2 bg-bolt-elements-background-depth-1',
          'text-bolt-elements-textPrimary',
          'hover:bg-bolt-elements-background-depth-2',
          'border border-bolt-elements-borderColor',
          'h-10 px-4 py-2 min-w-[120px] justify-center',
          'transition-all duration-200 ease-in-out',
          className,
        )}
        disabled={isLoading}
      >
        <span className="i-ph:figma-logo w-4 h-4" />
        Import Figma
      </Button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bolt-elements-background-depth-1 p-6 rounded-lg border border-bolt-elements-borderColor max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">Import from Figma</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Figma URL</label>
                <input
                  type="url"
                  placeholder="https://www.figma.com/file/..."
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary placeholder-bolt-elements-textSecondary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Figma API Key</label>
                <input
                  type="password"
                  placeholder="Enter your Figma API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary placeholder-bolt-elements-textSecondary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-bolt-elements-textSecondary mt-1">
                  Get your API key from{' '}
                  <a
                    href="https://www.figma.com/developers/api#access-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400"
                  >
                    Figma Settings
                  </a>
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowDialog(false);
                  setFigmaUrl('');
                  setApiKey('');
                }}
                variant="secondary"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isLoading || !figmaUrl.trim() || !apiKey.trim()}>
                {isLoading ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
