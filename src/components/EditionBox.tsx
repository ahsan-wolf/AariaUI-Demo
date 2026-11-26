import React, { useState } from 'react';
import { ControlDefinition } from '../types/gallery';
import { ACTIVATE_SNIPPET, EDITIONS } from '../data/editions';
import { CodeSnippetViewer } from './CodeSnippetViewer';
import { EditionChip } from './EditionChip';

/** "Package & install" box shown on every control page: which edition and package, how to install, what happens without a key. */
export const EditionBox: React.FC<{ control: ControlDefinition }> = ({ control }) => {
  const [showKey, setShowKey] = useState(false);

  if (control.edition === 'demo') {
    return (
      <div className="edition-box demo" data-testid="edition-box">
        <div className="edition-box-row">
          <EditionChip edition="demo" />
          <span>This control is a <strong>gallery demo</strong>. It is not part of a published package; the code samples show how to build it with the real controllers.</span>
        </div>
      </div>
    );
  }

  const info = EDITIONS[control.edition];
  const paid = control.edition !== 'free';
  const packages = [control.package, control.adapterPackages?.react, control.adapterPackages?.angular].filter(Boolean) as string[];
  const unique = Array.from(new Set(packages));
  const installLine = paid
    ? `npm install ${unique.join(' ')} @wf-controls/license`
    : `npm install ${unique.join(' ')}`;

  return (
    <div className={`edition-box ${control.edition}`} data-testid="edition-box">
      <div className="edition-box-row">
        <EditionChip edition={control.edition} />
        <span>
          <strong>{info.label} edition</strong> &middot; {info.license} &middot; {info.registry}
          {control.featureId && <> &middot; license feature <code>{control.featureId}</code></>}
        </span>
      </div>
      <div className="edition-box-row">
        <span className="edition-box-label">Package</span>
        <code>{control.package}</code>
        {control.adapterPackages?.react && <span>React: <code>{control.adapterPackages.react}</code></span>}
        {control.adapterPackages?.angular && <span>Angular: <code>{control.adapterPackages.angular}</code></span>}
      </div>
      <div className="edition-box-row">
        <span className="edition-box-label">Install</span>
        <code>{installLine}</code>
      </div>
      {paid && (
        <>
          <p className="edition-box-note">
            Without a license key this control runs in <strong>evaluation mode</strong> (data controls show the first 10 rows and block editing;
            other controls show a notice or reduced limits). A signed trial token keeps the caps but allows editing; a {info.label} key removes every limit.
          </p>
          <button className="edition-box-toggle" onClick={() => setShowKey((v) => !v)}>
            {showKey ? 'Hide' : 'Show'} license activation
          </button>
          {showKey && <CodeSnippetViewer code={ACTIVATE_SNIPPET} language="typescript" title="Activate a license (once, at start-up)" />}
        </>
      )}
    </div>
  );
};
