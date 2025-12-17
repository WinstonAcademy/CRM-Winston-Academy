"use client";

import React, { createContext, useContext, useState } from "react";

type EditFormContextType = {
  isEditFormOpen: boolean;
  setIsEditFormOpen: (open: boolean) => void;
  isAddLeadFormOpen: boolean;
  setIsAddLeadFormOpen: (open: boolean) => void;
  isDocumentModalOpen: boolean;
  setIsDocumentModalOpen: (open: boolean) => void;
};

const EditFormContext = createContext<EditFormContextType | undefined>(undefined);

export const EditFormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isAddLeadFormOpen, setIsAddLeadFormOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  return (
    <EditFormContext.Provider value={{ 
      isEditFormOpen, 
      setIsEditFormOpen,
      isAddLeadFormOpen,
      setIsAddLeadFormOpen,
      isDocumentModalOpen,
      setIsDocumentModalOpen
    }}>
      {children}
    </EditFormContext.Provider>
  );
};

export const useEditForm = () => {
  const context = useContext(EditFormContext);
  if (context === undefined) {
    throw new Error("useEditForm must be used within an EditFormProvider");
  }
  return context;
};
