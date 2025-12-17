import React from "react";

const SidebarWidget = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="flex flex-col gap-2.5 py-4 px-3">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-bodydark2 text-center">
          © {currentYear} Winston Academy
        </p>
        <p className="text-xs text-bodydark2 text-center">
          All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default SidebarWidget;
