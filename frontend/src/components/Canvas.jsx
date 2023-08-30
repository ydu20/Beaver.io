import React, { FC } from 'react';

import { LiveCanvas } from '@use-gpu/react';
import { AutoCanvas } from '@use-gpu/webgpu';


// This is a React component
function Canvas () {
  return (
    <LiveCanvas>
      {(canvas) => (
        <AutoCanvas canvas = {canvas}>
            
        </AutoCanvas>
      )}
    </LiveCanvas>
  );
}

export default Canvas;