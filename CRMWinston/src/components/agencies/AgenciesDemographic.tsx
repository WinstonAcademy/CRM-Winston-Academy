"use client";
import React, { useState, useEffect } from "react";
import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";
import { agencyService, Agency } from "@/services/agencyService";
import dynamic from "next/dynamic";

// Dynamically import VectorMap to avoid SSR issues
const DynamicVectorMap = dynamic(
    () => import("@react-jvectormap/core").then((mod) => mod.VectorMap),
    { ssr: false }
);

interface CountryAgenciesData {
    [countryCode: string]: {
        count: number;
        name: string;
    };
}

// Country name to ISO code mapping (reused)
const countryToCode: { [key: string]: string } = {
    "United States": "US",
    "United Kingdom": "GB",
    "Canada": "CA",
    "Australia": "AU",
    "India": "IN",
    "China": "CN",
    "Germany": "DE",
    "France": "FR",
    "Italy": "IT",
    "Spain": "ES",
    "Brazil": "BR",
    "Mexico": "MX",
    "Japan": "JP",
    "South Korea": "KR",
    "Russia": "RU",
    "South Africa": "ZA",
    "Nigeria": "NG",
    "Egypt": "EG",
    "Saudi Arabia": "SA",
    "UAE": "AE",
    "United Arab Emirates": "AE",
    "Turkey": "TR",
    "Poland": "PL",
    "Netherlands": "NL",
    "Belgium": "BE",
    "Sweden": "SE",
    "Norway": "NO",
    "Denmark": "DK",
    "Finland": "FI",
    "Switzerland": "CH",
    "Austria": "AT",
    "Portugal": "PT",
    "Greece": "GR",
    "Ireland": "IE",
    "New Zealand": "NZ",
    "Singapore": "SG",
    "Malaysia": "MY",
    "Thailand": "TH",
    "Indonesia": "ID",
    "Philippines": "PH",
    "Vietnam": "VN",
    "Pakistan": "PK",
    "Bangladesh": "BD",
    "Sri Lanka": "LK",
    "Nepal": "NP",
    "Afghanistan": "AF",
    "Iran": "IR",
    "Iraq": "IQ",
    "Israel": "IL",
    "Jordan": "JO",
    "Lebanon": "LB",
    "Kuwait": "KW",
    "Qatar": "QA",
    "Oman": "OM",
    "Bahrain": "BH",
    "Yemen": "YE",
    "Syria": "SY",
    "Argentina": "AR",
    "Chile": "CL",
    "Colombia": "CO",
    "Peru": "PE",
    "Venezuela": "VE",
    "Ecuador": "EC",
    "Uruguay": "UY",
    "Paraguay": "PY",
    "Bolivia": "BO",
    "Costa Rica": "CR",
    "Panama": "PA",
    "Guatemala": "GT",
    "Honduras": "HN",
    "El Salvador": "SV",
    "Nicaragua": "NI",
    "Dominican Republic": "DO",
    "Jamaica": "JM",
    "Trinidad and Tobago": "TT",
    "Barbados": "BB",
    "Bahamas": "BS",
    "Ghana": "GH",
    "Kenya": "KE",
    "Tanzania": "TZ",
    "Uganda": "UG",
    "Ethiopia": "ET",
    "Morocco": "MA",
    "Algeria": "DZ",
    "Tunisia": "TN",
    "Libya": "LY",
    "Sudan": "SD",
    "Angola": "AO",
    "Mozambique": "MZ",
    "Zambia": "ZM",
    "Zimbabwe": "ZW",
    "Botswana": "BW",
    "Namibia": "NA",
    "Madagascar": "MG",
    "Mauritius": "MU",
    "Senegal": "SN",
    "Ivory Coast": "CI",
    "Cameroon": "CM",
    "Gabon": "GA",
    "Congo": "CG",
    "DRC": "CD",
    "Democratic Republic of the Congo": "CD",
    "Rwanda": "RW",
    "Burundi": "BI",
    "Malawi": "MW",
    "Lesotho": "LS",
    "Eswatini": "SZ",
    "Swaziland": "SZ",
};

// Get country coordinates for markers
const getCountryCoordinates = (countryCode: string): [number, number] | null => {
    const coordinates: { [key: string]: [number, number] } = {
        "US": [37.0902, -95.7129],
        "GB": [55.3781, -3.4360],
        "CA": [56.1304, -106.3468],
        "AU": [-25.2744, 133.7751],
        "IN": [20.5937, 78.9629],
        "CN": [35.8617, 104.1954],
        "DE": [51.1657, 10.4515],
        "FR": [46.2276, 2.2137],
        "IT": [41.8719, 12.5674],
        "ES": [40.4637, -3.7492],
        "BR": [-14.2350, -51.9253],
        "MX": [23.6345, -102.5528],
        "JP": [36.2048, 138.2529],
        "KR": [35.9078, 127.7669],
        "RU": [61.5240, 105.3188],
        "ZA": [-30.5595, 22.9375],
        "NG": [9.0820, 8.6753],
        "EG": [26.8206, 30.8025],
        "SA": [23.8859, 45.0792],
        "AE": [23.4241, 53.8478],
        "TR": [38.9637, 35.2433],
        "PL": [51.9194, 19.1451],
        "NL": [52.1326, 5.2913],
        "BE": [50.5039, 4.4699],
        "SE": [60.1282, 18.6435],
        "NO": [60.4720, 8.4689],
        "DK": [56.2639, 9.5018],
        "FI": [61.9241, 25.7482],
        "CH": [46.8182, 8.2275],
        "AT": [47.5162, 14.5501],
        "PT": [39.3999, -8.2245],
        "GR": [39.0742, 21.8243],
        "IE": [53.4129, -8.2439],
        "NZ": [-40.9006, 174.8860],
        "SG": [1.3521, 103.8198],
        "MY": [4.2105, 101.9758],
        "TH": [15.8700, 100.9925],
        "ID": [-0.7893, 113.9213],
        "PH": [12.8797, 121.7740],
        "VN": [14.0583, 108.2772],
        "PK": [30.3753, 69.3451],
        "BD": [23.6850, 90.3563],
        "LK": [7.8731, 80.7718],
        "NP": [28.3949, 84.1240],
        "AF": [33.9391, 67.7100],
        "IR": [32.4279, 53.6880],
        "IQ": [33.2232, 43.6793],
        "IL": [31.0461, 34.8516],
        "JO": [30.5852, 36.2384],
        "LB": [33.8547, 35.8623],
        "KW": [29.3117, 47.4818],
        "QA": [25.3548, 51.1839],
        "OM": [21.4735, 55.9754],
        "BH": [25.9304, 50.6378],
        "YE": [15.5527, 48.5164],
        "SY": [34.8021, 38.9968],
        "AR": [-38.4161, -63.6167],
        "CL": [-35.6751, -71.5430],
        "CO": [4.5709, -74.2973],
        "PE": [-9.1900, -75.0152],
        "VE": [6.4238, -66.5897],
        "EC": [-1.8312, -78.1834],
        "UY": [-32.5228, -55.7658],
        "PY": [-23.4425, -58.4438],
        "BO": [-16.2902, -63.5887],
        "CR": [9.7489, -83.7534],
        "PA": [8.5380, -80.7821],
        "GT": [15.7835, -90.2308],
        "HN": [15.2000, -86.2419],
        "SV": [13.7942, -88.8965],
        "NI": [12.2650, -85.2072],
        "DO": [18.7357, -70.1627],
        "JM": [18.1096, -77.2975],
        "TT": [10.6918, -61.2225],
        "BB": [13.1939, -59.5432],
        "BS": [25.0343, -77.3963],
        "GH": [7.9465, -1.0232],
        "KE": [-0.0236, 37.9062],
        "TZ": [-6.3690, 34.8888],
        "UG": [1.3733, 32.2903],
        "ET": [9.1450, 38.7667],
        "MA": [31.7917, -7.0926],
        "DZ": [28.0339, 1.6596],
        "TN": [33.8869, 9.5375],
        "LY": [26.3351, 17.2283],
        "SD": [12.8628, 30.2176],
        "AO": [-11.2027, 17.8739],
        "MZ": [-18.6657, 35.5296],
        "ZM": [-13.1339, 27.8493],
        "ZW": [-19.0154, 29.1549],
        "BW": [-22.3285, 24.6849],
        "NA": [-22.9576, 18.4904],
        "MG": [-18.7669, 46.8691],
        "MU": [-20.3484, 57.5522],
        "SN": [14.4974, -14.4524],
        "CI": [7.5400, -5.5471],
        "CM": [7.3697, 12.3547],
        "GA": [-0.8037, 11.6094],
        "CG": [-0.2280, 15.8277],
        "CD": [-4.0383, 21.7587],
        "RW": [-1.9441, 29.8739],
        "BI": [-3.3731, 29.9189],
        "MW": [-13.2543, 34.3015],
        "LS": [-29.6100, 28.2336],
        "SZ": [-26.5225, 31.4659],
    };
    return coordinates[countryCode] || null;
};

export const AgenciesDemographic = () => {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countryAgencies, setCountryAgencies] = useState<CountryAgenciesData>({});

    useEffect(() => {
        fetchAgencies();
    }, []);

    const fetchAgencies = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await agencyService.fetchAgencies();
            setAgencies(data || []);
        } catch (error) {
            console.error('Error fetching agencies:', error);
            setError('Failed to fetch agencies');
            setAgencies([]);
            setCountryAgencies({});
        } finally {
            setLoading(false);
        }
    };

    const calculateCountryAgencies = (agenciesData: Agency[]) => {
        const countryCounts: CountryAgenciesData = {};

        agenciesData.forEach(agency => {
            const country = agency.country;
            if (country) {
                const countryCode = countryToCode[country] || country;
                const countryName = Object.entries(countryToCode).find(([, code]) => code === countryCode)?.[0] || country;

                if (!countryCounts[countryCode]) {
                    countryCounts[countryCode] = {
                        count: 0,
                        name: countryName
                    };
                }
                countryCounts[countryCode].count++;
            }
        });

        setCountryAgencies(countryCounts);
    };

    useEffect(() => {
        if (agencies.length > 0) {
            calculateCountryAgencies(agencies);
        }
    }, [agencies]);

    // Get top countries sorted by agency count
    const topCountries = Object.entries(countryAgencies)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10);

    const totalAgencies = Object.values(countryAgencies).reduce((sum, country) => sum + country.count, 0);

    // Create markers for countries with agencies
    const markers = React.useMemo(() => {
        return topCountries
            .map(([code]) => {
                const coords = getCountryCoordinates(code);
                if (coords && countryAgencies[code]) {
                    return {
                        latLng: coords,
                        name: countryAgencies[code].name,
                        style: {
                            fill: "#3b82f6",
                            borderWidth: 2,
                            borderColor: "white",
                            r: 6,
                        },
                    };
                }
                return null;
            })
            .filter(Boolean);
    }, [countryAgencies, topCountries]);

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <span className="text-red-600 text-xl">⚠️</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Demographic</h3>
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                    <button
                        onClick={fetchAgencies}
                        className="ml-auto rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Agencies Geographic Distribution
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Agencies distribution by country
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* World Map */}
                    <div className="h-80 w-full">
                        <DynamicVectorMap
                            key={`map-${topCountries.length}`}
                            map={worldMill}
                            backgroundColor="transparent"
                            zoomOnScroll={false}
                            zoomMax={4}
                            zoomMin={1}
                            markers={markers as any}
                            markerStyle={{
                                initial: {
                                    fill: "#3b82f6",
                                    r: 6,
                                    stroke: "white",
                                    strokeWidth: 2,
                                } as any,
                                hover: {
                                    fill: "#2563eb",
                                    r: 8,
                                } as any,
                            }}
                            regionStyle={{
                                initial: {
                                    fill: "#e5e7eb",
                                    fillOpacity: 0.6,
                                    stroke: "#ffffff",
                                    strokeWidth: 0.5,
                                    strokeOpacity: 1,
                                },
                                hover: {
                                    fillOpacity: 0.8,
                                    cursor: "pointer",
                                },
                            }}
                        />
                    </div>

                    {/* Country List - Scrollable */}
                    <div className="h-80 overflow-y-auto pr-2 space-y-4" style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent'
                    }}>
                        {topCountries.length > 0 ? (
                            topCountries.map(([code, data]) => {
                                const percentage = totalAgencies > 0 ? (data.count / totalAgencies * 100).toFixed(1) : '0';
                                return (
                                    <div key={code} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        {/* Country Flag Placeholder */}
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                            {data.name.substring(0, 2).toUpperCase()}
                                        </div>

                                        {/* Country Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {data.name}
                                                </h4>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white ml-2">
                                                    {percentage}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                {data.count} {data.count === 1 ? 'Agency' : 'Agencies'}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <p>No agencies with country information available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
