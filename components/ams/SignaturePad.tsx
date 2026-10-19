'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ onSave, disabled }: SignaturePadProps) {
  const ref = useRef<SignatureCanvas>(null);

  const clear = () => ref.current?.clear();

  const save = () => {
    if (!ref.current || ref.current.isEmpty()) return;
    const dataUrl = ref.current.getTrimmedCanvas().toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div>
      <div className="border border-gray-300 rounded-lg bg-white">
        <SignatureCanvas
          ref={ref}
          penColor="black"
          canvasProps={{ width: 400, height: 150, className: 'w-full' }}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} disabled={disabled}>Clear</Button>
        <Button type="button" size="sm" className="bg-[#1E1B4B] hover:bg-[#2A2675]" onClick={save} disabled={disabled}>
          Confirm Signature
        </Button>
      </div>
    </div>
  );
}
