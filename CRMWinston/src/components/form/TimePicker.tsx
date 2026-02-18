"use client";
import React, { useState, useRef, useEffect } from "react";

interface TimePickerProps {
    id?: string;
    value: string; // "HH:mm" format (24h)
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
    id,
    value,
    onChange,
    label,
    placeholder = "Select time",
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hourListRef = useRef<HTMLDivElement>(null);
    const minuteListRef = useRef<HTMLDivElement>(null);

    // Parse value
    const parsed = value ? value.split(":") : ["", ""];
    const selectedHour24 = parsed[0] ? parseInt(parsed[0], 10) : -1;
    const selectedMinute = parsed[1] ? parseInt(parsed[1], 10) : -1;

    // Convert to 12h for display
    const isPM = selectedHour24 >= 12;
    const selectedHour12 = selectedHour24 === -1 ? -1 : selectedHour24 === 0 ? 12 : selectedHour24 > 12 ? selectedHour24 - 12 : selectedHour24;
    const [period, setPeriod] = useState<"AM" | "PM">(isPM ? "PM" : "AM");

    // Sync period with value
    useEffect(() => {
        if (selectedHour24 !== -1) {
            setPeriod(selectedHour24 >= 12 ? "PM" : "AM");
        }
    }, [selectedHour24]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll to selected values when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (hourListRef.current && selectedHour12 > 0) {
                    const el = hourListRef.current.querySelector(`[data-hour="${selectedHour12}"]`);
                    el?.scrollIntoView({ block: "center", behavior: "smooth" });
                }
                if (minuteListRef.current && selectedMinute >= 0) {
                    const el = minuteListRef.current.querySelector(`[data-minute="${selectedMinute}"]`);
                    el?.scrollIntoView({ block: "center", behavior: "smooth" });
                }
            }, 50);
        }
    }, [isOpen, selectedHour12, selectedMinute]);

    const buildTimeString = (hour12: number, minute: number, ampm: "AM" | "PM") => {
        let hour24 = hour12;
        if (ampm === "AM" && hour12 === 12) hour24 = 0;
        else if (ampm === "PM" && hour12 !== 12) hour24 = hour12 + 12;
        return `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    };

    const handleHourClick = (h: number) => {
        const min = selectedMinute >= 0 ? selectedMinute : 0;
        onChange(buildTimeString(h, min, period));
    };

    const handleMinuteClick = (m: number) => {
        const hr = selectedHour12 > 0 ? selectedHour12 : 12;
        onChange(buildTimeString(hr, m, period));
    };

    const handlePeriodClick = (p: "AM" | "PM") => {
        setPeriod(p);
        if (selectedHour12 > 0 && selectedMinute >= 0) {
            onChange(buildTimeString(selectedHour12, selectedMinute, p));
        }
    };

    const handleNowClick = () => {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        onChange(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
        setIsOpen(false);
    };

    // Display value
    const displayValue = value
        ? `${selectedHour12 === -1 ? "--" : selectedHour12}:${selectedMinute === -1 ? "--" : selectedMinute.toString().padStart(2, "0")} ${period}`
        : "";

    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55

    return (
        <div ref={containerRef} className="relative">
            {/* Input Display */}
            <button
                type="button"
                id={id}
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm text-left flex items-center justify-between transition-colors
          ${disabled
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-900 dark:border-gray-700 dark:text-gray-500"
                        : isOpen
                            ? "border-blue-500 ring-1 ring-blue-500 bg-white dark:bg-gray-900 dark:border-blue-500 text-gray-900 dark:text-white"
                            : "border-gray-300 bg-white hover:border-gray-400 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:hover:border-gray-600"
                    }`}
            >
                <span className={displayValue ? "" : "text-gray-400 dark:text-gray-500"}>
                    {displayValue || placeholder}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Column Headers */}
                    <div className="grid grid-cols-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 py-2 px-1">
                        <span>Hour</span>
                        <span>Minute</span>
                        <span>AM/PM</span>
                    </div>

                    {/* Scrollable Columns */}
                    <div className="grid grid-cols-3 gap-0" style={{ height: "200px" }}>
                        {/* Hours */}
                        <div
                            ref={hourListRef}
                            className="overflow-y-auto border-r border-gray-100 dark:border-gray-700 py-1 scrollbar-thin"
                        >
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    data-hour={h}
                                    onClick={() => handleHourClick(h)}
                                    className={`w-full py-2 text-sm text-center transition-colors rounded-md mx-auto
                    ${selectedHour12 === h
                                            ? "bg-blue-600 text-white font-semibold"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        }`}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>

                        {/* Minutes */}
                        <div
                            ref={minuteListRef}
                            className="overflow-y-auto border-r border-gray-100 dark:border-gray-700 py-1 scrollbar-thin"
                        >
                            {minutes.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    data-minute={m}
                                    onClick={() => handleMinuteClick(m)}
                                    className={`w-full py-2 text-sm text-center transition-colors rounded-md mx-auto
                    ${selectedMinute === m
                                            ? "bg-blue-600 text-white font-semibold"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        }`}
                                >
                                    {m.toString().padStart(2, "0")}
                                </button>
                            ))}
                        </div>

                        {/* AM/PM */}
                        <div className="flex flex-col justify-center gap-2 py-1 px-2">
                            {(["AM", "PM"] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => handlePeriodClick(p)}
                                    className={`w-full py-3 text-sm font-medium text-center transition-colors rounded-lg
                    ${period === p
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600"
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-3 py-2">
                        <button
                            type="button"
                            onClick={handleNowClick}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            Current Time
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimePicker;
