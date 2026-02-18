import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import Label from './Label';
import { CalenderIcon } from '../../icons';
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  showClearButton?: boolean;
  onClear?: () => void;
  hideIcon?: boolean;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  showClearButton = false,
  onClear,
  hideIcon = false,
}: PropsType) {
  // Store onChange in a ref so flatpickr is not destroyed/recreated when 
  // parent passes a new inline arrow function on every render
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    // Wait for DOM to be ready
    if (typeof window === 'undefined' || !document.body) return;

    const inputElement = document.getElementById(id);
    if (!inputElement) return;

    const updateCalendarPosition = (instance: flatpickr.Instance) => {
      const calendar = instance.calendarContainer;
      if (!calendar || !calendar.classList.contains('open')) return;

      // Set high z-index and fixed positioning
      calendar.style.zIndex = '9999';
      calendar.style.position = 'fixed';

      // Calculate position relative to input
      const inputRect = inputElement.getBoundingClientRect();
      const calendarHeight = calendar.offsetHeight || 300;
      const viewportHeight = window.innerHeight;

      // Position below input, but adjust if it would go off-screen
      let top = inputRect.bottom + 4;
      if (top + calendarHeight > viewportHeight) {
        top = inputRect.top - calendarHeight - 4;
        if (top < 0) {
          top = 8;
        }
      }

      calendar.style.top = `${top}px`;
      calendar.style.left = `${inputRect.left}px`;
    };

    let flatPickrInstance: flatpickr.Instance | flatpickr.Instance[] | null = null;

    // Stable onChange wrapper that always calls the latest onChange via the ref
    const stableOnChange: Hook = (selectedDates, dateStr, instance) => {
      const handler = onChangeRef.current;
      if (handler) {
        if (Array.isArray(handler)) {
          handler.forEach(fn => fn(selectedDates, dateStr, instance));
        } else {
          handler(selectedDates, dateStr, instance);
        }
      }
    };

    try {
      // Clear any existing instance first
      const existingInput = document.getElementById(id);
      if (existingInput && (existingInput as any)._flatpickr) {
        try {
          (existingInput as any)._flatpickr.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
      }

      flatPickrInstance = flatpickr(`#${id}`, {
        mode: mode || "single",
        appendTo: document.body,
        monthSelectorType: "static",
        dateFormat: "Y-m-d",
        defaultDate: defaultDate || undefined,
        allowInput: true,
        onChange: stableOnChange,
        onOpen: function (_selectedDates, _dateStr, instance) {
          setTimeout(() => {
            if (instance && instance.calendarContainer) {
              updateCalendarPosition(instance);
            }
          }, 10);
        },
      });

      // If defaultDate is undefined/null, ensure the input is cleared
      if (!defaultDate && flatPickrInstance && !Array.isArray(flatPickrInstance)) {
        try {
          flatPickrInstance.clear();
        } catch (e) {
          // Ignore clear errors
        }
      }
    } catch (error) {
      console.error('Error initializing flatpickr:', error);
      return;
    }

    // Update position on scroll and resize
    const handleScroll = () => {
      if (flatPickrInstance && !Array.isArray(flatPickrInstance)) {
        updateCalendarPosition(flatPickrInstance);
      }
    };

    const handleResize = () => {
      if (flatPickrInstance && !Array.isArray(flatPickrInstance)) {
        updateCalendarPosition(flatPickrInstance);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      if (flatPickrInstance && !Array.isArray(flatPickrInstance)) {
        try {
          flatPickrInstance.destroy();
        } catch (error) {
          // Silently ignore destroy errors during cleanup
        }
      }
    };
  }, [mode, id, defaultDate]);

  const handleClear = () => {
    if (typeof document === 'undefined' || !document.body) return;

    const inputElement = document.getElementById(id) as HTMLInputElement;
    if (inputElement) {
      // Clear flatpickr instance if it exists
      if ((inputElement as any)._flatpickr) {
        try {
          (inputElement as any)._flatpickr.clear();
        } catch (e) {
          console.warn('Error clearing flatpickr:', e);
        }
      }
      // Clear input value
      inputElement.value = '';
    }

    // Call onClear callback if provided
    if (onClear) {
      onClear();
    }
  };

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800 ${showClearButton ? 'pr-10' : ''}`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {showClearButton && !hideIcon && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 z-10"
              title="Clear date"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {!hideIcon && (
            <span className="text-gray-500 pointer-events-none dark:text-gray-400">
              <CalenderIcon className="size-6" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
