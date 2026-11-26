import React from 'react';
import { Edition } from '../types/gallery';
import { EDITION_LABEL } from '../data/editions';

/** Small Free / Pro / Enterprise / Gallery demo chip. */
export const EditionChip: React.FC<{ edition: Edition; title?: string }> = ({ edition, title }) => (
  <span className={`edition-chip ${edition}`} data-edition={edition} title={title ?? `${EDITION_LABEL[edition]} edition`}>
    {EDITION_LABEL[edition]}
  </span>
);
