"use client";
import React from "react";
import { UserIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, StarIcon } from "@/icons";

const recentLeads = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 123-4567",
    status: "New Lead",
    source: "Website",
    date: "2 hours ago",
    priority: "High",
    avatar: "SJ"
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "mchen@email.com",
    phone: "+1 (555) 234-5678",
    status: "Contacted",
    source: "Referral",
    date: "4 hours ago",
    priority: "Medium",
    avatar: "MC"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily.r@email.com",
    phone: "+1 (555) 345-6789",
    status: "Potential",
    source: "Social Media",
    date: "6 hours ago",
    priority: "High",
    avatar: "ER"
  },
  {
    id: 4,
    name: "David Thompson",
    email: "dthompson@email.com",
    phone: "+1 (555) 456-7890",
    status: "Student",
    source: "Website",
    date: "1 day ago",
    priority: "Low",
    avatar: "DT"
  },
  {
    id: 5,
    name: "Lisa Wang",
    email: "lwang@email.com",
    phone: "+1 (555) 567-8901",
    status: "Not Interested",
    source: "Cold Call",
    date: "2 days ago",
    priority: "Low",
    avatar: "LW"
  },
  {
    id: 6,
    name: "James Wilson",
    email: "jwilson@email.com",
    phone: "+1 (555) 678-9012",
    status: "Contacted",
    source: "Referral",
    date: "3 days ago",
    priority: "Medium",
    avatar: "JW"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "New Lead":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "Contacted":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "Potential":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "Student":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400";
    case "Not Interested":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "High":
      return <StarIcon className="w-4 h-4 text-red-500" />;
    case "Medium":
      return <StarIcon className="w-4 h-4 text-yellow-500" />;
    case "Low":
      return <StarIcon className="w-4 h-4 text-gray-400" />;
    default:
      return null;
  }
};

const RecentLeads = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Recent Leads
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest lead activities and updates
          </p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {recentLeads.map((lead) => (
          <div key={lead.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900/20">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {lead.avatar}
                </span>
              </div>
            </div>

            {/* Lead Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                  {lead.name}
                </h4>
                <div className="flex items-center gap-2">
                  {getPriorityIcon(lead.priority)}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <EnvelopeIcon className="w-3 h-3" />
                  <span className="truncate">{lead.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <PhoneIcon className="w-3 h-3" />
                  <span>{lead.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  <span>{lead.source}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  <span>{lead.date}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentLeads;
