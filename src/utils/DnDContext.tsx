import { createContext, useContext, useState } from 'react';
 
interface DnDContextType {
  type: string | null;
  setType: (type: string | null) => void;
}

const DnDContext = createContext<[DnDContextType['type'], DnDContextType['setType']]>([null, () => {}]);
 
export const DnDProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const [type, setType] = useState<string | null>(null);
 
  return (
    <DnDContext.Provider value={[type, setType]}>
      {children}
    </DnDContext.Provider>
  );
}
 
export default DnDContext;

// eslint-disable-next-line react-refresh/only-export-components
export const useDnD = () => {
  return useContext(DnDContext);
}
