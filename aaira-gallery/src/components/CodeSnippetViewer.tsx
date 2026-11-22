import React, { useState } from 'react';
import { IconCode, IconCopy, IconCheck } from './Icons';

interface CodeSnippetViewerProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeSnippetViewer: React.FC<CodeSnippetViewerProps> = ({
  code,
  language = 'typescript',
  title = 'Example Code',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-container">
      <div className="code-header">
        <div className="code-title">
          <IconCode size={14} />
          <span>{title}</span>
          <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>({language})</span>
        </div>
        <button className="code-copy-btn" onClick={handleCopy} title="Copy code">
          {copied ? (
            <>
              <IconCheck size={12} style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981' }}>Copied!</span>
            </>
          ) : (
            <>
              <IconCopy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
};
