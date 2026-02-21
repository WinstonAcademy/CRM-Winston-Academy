'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Timesheet } from './TimesheetTable'; // Assuming Timesheet type is exported from TimesheetTable or a shared types file. 
// If Timesheet type is not exported, I will define a local interface or import from types/timesheet if it exists. 
// For now, I'll assume it needs to be imported or defined.
// To be safe, I'll define a compatible interface here if I can't find the export source easily, 
// but TimesheetTable.tsx definitely has it. I'll import it.

interface TimesheetCalendarProps {
    timesheets: Timesheet[];
}

export default function TimesheetCalendar({ timesheets }: TimesheetCalendarProps) {
    // Map timesheets to FullCalendar events
    const events = timesheets.map(t => {
        // Combine date and time
        let start, end;
        if (t.date && t.startTime) {
            start = `${t.date.split('T')[0]}T${t.startTime}`;
        } else {
            start = t.date; // Fallback to just date
        }

        if (t.date && t.endTime) {
            end = `${t.date.split('T')[0]}T${t.endTime}`;
        }

        // Determine title
        const title = t.employee
            ? `${t.employee.firstName || t.employee.username} (${formatTotalHours(t.totalHours)})`
            : t.totalHours ? `Hours: ${formatTotalHours(t.totalHours)}` : 'Logged';

        // Color coding based on location (optional, matching Table logic)
        const isWFH = t.location === 'Work from Home';
        const backgroundColor = isWFH ? '#9333ea' : '#3b82f6'; // Purple for WFH, Blue for Office
        const borderColor = isWFH ? '#7e22ce' : '#2563eb';

        return {
            id: t.id.toString(),
            title: title,
            start: start,
            end: end,
            allDay: !t.startTime,
            backgroundColor,
            borderColor,
            extendedProps: {
                notes: t.notes,
                location: t.location
            }
        };
    });

    return (
        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
            {/* Custom CSS to handle dark mode override for FullCalendar if needed, 
          but usually it inherits okay or needs specific vars. 
          For now, standard rendering. */}
            <style>{`
        .fc {
          --fc-border-color: #e5e7eb;
          --fc-button-bg-color: #3b82f6;
          --fc-button-border-color: #3b82f6;
          --fc-button-hover-bg-color: #2563eb;
          --fc-button-hover-border-color: #2563eb;
          --fc-button-active-bg-color: #1d4ed8;
          --fc-button-active-border-color: #1d4ed8;
        }
        .dark .fc {
          --fc-page-bg-color: #111827;
          --fc-neutral-bg-color: #1f2937;
          --fc-list-event-hover-bg-color: #374151;
          --fc-border-color: #374151;
          --fc-theme-standard-border-color: #374151;
          --fc-today-bg-color: rgba(59, 130, 246, 0.15);
        }
        .dark .fc-col-header-cell-cushion,
        .dark .fc-daygrid-day-number {
          color: #e5e7eb;
        }
        .dark .fc-toolbar-title {
          color: #f3f4f6;
        }
        .dark .fc-button {
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }
        .dark .fc-button:hover {
          background-color: #2563eb;
          border-color: #2563eb;
        }
        .dark .fc-button-active {
          background-color: #1d4ed8 !important;
          border-color: #1d4ed8 !important;
        }
        .dark .fc-button:disabled {
          background-color: #374151;
          border-color: #374151;
          color: #9ca3af;
        }
        .dark .fc-scrollgrid {
          border-color: #374151;
        }
        .dark .fc td, .dark .fc th {
          border-color: #374151;
        }
        .dark .fc-daygrid-day {
          background-color: #111827;
        }
        .dark .fc-daygrid-day:hover {
          background-color: #1f2937;
        }
        .dark .fc-daygrid-day-frame {
          color: #d1d5db;
        }
        .dark .fc-day-other .fc-daygrid-day-number {
          color: #6b7280;
        }
        .dark .fc-timegrid-slot-label {
          color: #9ca3af;
        }
        .dark .fc-timegrid-axis-cushion {
          color: #9ca3af;
        }
        .dark .fc-list-day-cushion {
          background-color: #1f2937;
          color: #e5e7eb;
        }
        .dark .fc-list-event:hover td {
          background-color: #374151;
        }
      `}</style>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                height="auto"
                aspectRatio={1.35}
            />
        </div>
    );
}

// Helper to format hours
function formatTotalHours(decimalHours: number | null | undefined): string {
    if (decimalHours === null || decimalHours === undefined) return '0h 0m';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
}
