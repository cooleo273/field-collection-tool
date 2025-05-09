"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/loading-spinner";
import { FileDown, Calendar } from "lucide-react";
import { getSupabaseClient } from "@/lib/services/client";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";
import dynamic from "next/dynamic";

const Chart = dynamic(
  () => import("./reports-charts").then((mod) => mod.Chart),
  { ssr: false }
);

interface ReportFilters {
  locationId: string;
  dateRange: string;
}
interface RawSubmissionData {
  id: string;
  activity_stream: string;
  specific_location: string;
  participant_count: number;
  status: string;
  submitted_at: string;
  created_at: string;
  submitted_by: string;
  community_group_type?: string;
}
interface SubmissionData extends RawSubmissionData {
  location_name?: string;
}
interface ParticipantData {
  name: string;
  age: number;
  gender: string;
  phone_number: string;
  submission_id: string;
}
interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}
export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales?: any;
  plugins?: any;
}

export default function ProjectAdminReportsPage() {
  const { project_id } = useParams();
  const supabase = getSupabaseClient();
  const { toast } = useToast();

  const [filters, setFilters] = useState<ReportFilters>({
    locationId: "all",
    dateRange: "all",
  });
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>(
    []
  );
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [locationNameMap, setLocationNameMap] = useState<Map<string, string>>(
    new Map()
  );
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);

  const [submissionsOverTime, setSubmissionsOverTime] =
    useState<ChartData | null>(null);
  const [submissionsByStatus, setSubmissionsByStatus] =
    useState<ChartData | null>(null);
  const [submissionsByLocation, setSubmissionsByLocation] =
    useState<ChartData | null>(null);
  const [participantsByGroup, setParticipantsByGroup] =
    useState<ChartData | null>(null);

  const lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
  };
  const pieChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: "bottom" as const } },
  };
  const barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
  };

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const { data: locationData, error: locationError } = await supabase
          .from("locations")
          .select("id, name");

        if (locationError) throw locationError;
        const fetchedLocations = locationData || [];
        setLocations(fetchedLocations);

        const newLocationMap = new Map<string, string>();
        fetchedLocations.forEach((loc) => newLocationMap.set(loc.id, loc.name));
        setLocationNameMap(newLocationMap);
      } catch (error: any) {
        console.error("Error loading locations:", error);
        setLoading(false);
        toast({
          title: "Error loading locations",
          description: error.message || "Failed to load location data",
          variant: "destructive",
        });
      }
    };
    if (project_id) {
      loadLocations();
    } else {
      loadLocations();
    }
  }, [project_id, supabase, toast]);

  const fetchReportData = useCallback(async () => {
    if (locations.length > 0 && locationNameMap.size === 0) {
      return;
    }

    setLoading(true);
    let userIdsForLocation: string[] | null = null;
    let fetchedSubmissions: RawSubmissionData[] = [];

    try {
      if (filters.locationId !== "all") {
        const { data: promoterLinks, error: promoterLinkError } = await supabase
          .from("promoter_locations")
          .select("user_id")
          .eq("location_id", filters.locationId);
        if (promoterLinkError) throw promoterLinkError;
        userIdsForLocation = promoterLinks?.map((link) => link.user_id) || [];
        if (userIdsForLocation.length === 0) {
          setSubmissions([]);
          setParticipants([]);
          generateChartData([], []);
          setLoading(false);
          setHasFetchedInitialData(true);
          return;
        }
      }

      let query = supabase
        .from("submissions")
        .select(
          "id, activity_stream, specific_location, community_group_type, participant_count, status, submitted_at, created_at, submitted_by"
        )
        .order("created_at", { ascending: false });

      if (userIdsForLocation) {
        query = query.in("submitted_by", userIdsForLocation);
      }

      if (filters.dateRange !== "all") {
        const now = new Date();
        let startDate = new Date();
        switch (filters.dateRange) {
          case "last7":
            startDate.setDate(now.getDate() - 7);
            break;
          case "last30":
            startDate.setDate(now.getDate() - 30);
            break;
          case "last90":
            startDate.setDate(now.getDate() - 90);
            break;
        }
        startDate.setHours(0, 0, 0, 0);
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data: submissionData, error: submissionError } = await query;
      if (submissionError) throw submissionError;
      fetchedSubmissions = (submissionData as RawSubmissionData[]) || [];

      let submissionsWithLocation: SubmissionData[] = [];
      let currentParticipants: ParticipantData[] = [];

      if (fetchedSubmissions.length > 0) {
        const uniqueUserIds = [
          ...new Set(
            fetchedSubmissions.map((s) => s.submitted_by).filter(Boolean)
          ),
        ];
        const userLocationMap = new Map<string, string>();

        if (uniqueUserIds.length > 0) {
          const { data: userLocationsData, error: userLocationsError } =
            await supabase
              .from("promoter_locations")
              .select("user_id, location_id")
              .in("user_id", uniqueUserIds);
          if (userLocationsError) {
            console.error("Error fetching user locations:", userLocationsError);
          } else {
            userLocationsData?.forEach((link) => {
              if (!userLocationMap.has(link.user_id)) {
                userLocationMap.set(link.user_id, link.location_id);
              }
            });
          }
        }
        submissionsWithLocation = fetchedSubmissions.map((sub) => {
          const locationId = userLocationMap.get(sub.submitted_by);
          const locationName = locationId
            ? locationNameMap.get(locationId)
            : undefined;
          return { ...sub, location_name: locationName || "Unknown" };
        });

        const submissionIds = submissionsWithLocation.map((s) => s.id);
        const { data: participantData, error: participantError } =
          await supabase
            .from("participants")
            .select("name, age, gender, phone_number, submission_id")
            .in("submission_id", submissionIds);
        if (participantError) throw participantError;
        currentParticipants = participantData || [];
      }

      setSubmissions(submissionsWithLocation);
      setParticipants(currentParticipants);
      generateChartData(submissionsWithLocation, currentParticipants);
    } catch (error: any) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Error Loading Report",
        description: error.message || "Failed to load report data",
        variant: "destructive",
      });
      setSubmissions([]);
      setParticipants([]);
      generateChartData([], []);
    } finally {
      setLoading(false);
      setHasFetchedInitialData(true);
    }
  }, [filters, locationNameMap, locations.length, supabase, toast]);

  useEffect(() => {
    const Rlocations = locations.length > 0 && locationNameMap.size > 0;
    const noLocationsToMap = locations.length === 0;

    if (Rlocations || noLocationsToMap) {
      fetchReportData();
    }
  }, [filters, locationNameMap, locations.length, fetchReportData]);

  const generateChartData = (
    currentSubmissions: SubmissionData[],
    currentParticipants: ParticipantData[]
  ) => {
    if (!currentSubmissions || currentSubmissions.length === 0) {
      setSubmissionsOverTime(null);
      setSubmissionsByStatus(null);
      setSubmissionsByLocation(null);
      setParticipantsByGroup(null);
      return;
    }
    const monthData: { [key: string]: number } = {};
    const sortedSubmissions = [...currentSubmissions].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    sortedSubmissions.forEach((sub) => {
      const date = new Date(sub.created_at);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!monthData[monthYear]) monthData[monthYear] = 0;
      monthData[monthYear]++;
    });
    const timeLabelsRaw = Object.keys(monthData).sort();
    const timeLabelsFormatted = timeLabelsRaw.map((my) => {
      const [year, month] = my.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
    });
    setSubmissionsOverTime({
      labels: timeLabelsFormatted,
      datasets: [
        {
          label: "Submissions",
          data: timeLabelsRaw.map((month) => monthData[month]),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    });
    const statusData: { [key: string]: number } = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
    };
    let totalSubmissionsForStatus = 0;
    currentSubmissions.forEach((sub) => {
      if (statusData.hasOwnProperty(sub.status)) {
        statusData[sub.status]++;
        totalSubmissionsForStatus++;
      }
    });
    const activeStatusLabels = Object.keys(statusData).filter(
      (status) => statusData[status] > 0
    );
    const activeStatusData = activeStatusLabels.map(
      (status) => statusData[status]
    );
    const statusColors: { [key: string]: string } = {
      draft: "rgba(255, 206, 86, 0.6)",
      submitted: "rgba(255, 159, 64, 0.6)",
      approved: "rgba(76, 175, 80, 0.6)",
      rejected: "rgba(220, 53, 69, 0.6)",
    };
    const activeStatusBackgrounds = activeStatusLabels.map(
      (status) => statusColors[status]
    );
    setSubmissionsByStatus(
      totalSubmissionsForStatus > 0
        ? {
            labels: activeStatusLabels.map(
              (s) => s.charAt(0).toUpperCase() + s.slice(1)
            ),
            datasets: [
              {
                label: "Status",
                data: activeStatusData,
                backgroundColor: activeStatusBackgrounds,
                borderWidth: 1,
              },
            ],
          }
        : null
    );
    const locationData: { [key: string]: number } = {};
    let totalSubmissionsForLocation = 0;
    currentSubmissions.forEach((sub) => {
      const location = sub.location_name || "Unknown";
      if (!locationData[location]) locationData[location] = 0;
      locationData[location]++;
      totalSubmissionsForLocation++;
    });
    setSubmissionsByLocation(
      totalSubmissionsForLocation > 0
        ? {
            labels: Object.keys(locationData),
            datasets: [
              {
                label: "Submissions",
                data: Object.values(locationData),
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
              },
            ],
          }
        : null
    );
    const groupData: { [key: string]: number } = {};
    let totalParticipantsForGroup = 0;
    currentSubmissions.forEach((sub) => {
      const groupType = sub.community_group_type || "Not Specified";
      if (!groupData[groupType]) groupData[groupType] = 0;
      const count = currentParticipants.filter(
        (p) => p.submission_id === sub.id
      ).length;
      groupData[groupType] += count;
      totalParticipantsForGroup += count;
    });
    setParticipantsByGroup(
      totalParticipantsForGroup > 0
        ? {
            labels: Object.keys(groupData),
            datasets: [
              {
                label: "Participants",
                data: Object.values(groupData),
                backgroundColor: "rgba(153, 102, 255, 0.6)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1,
              },
            ],
          }
        : null
    );
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setHasFetchedInitialData(false);
  };

  const exportToExcel = async () => {
    if (!submissions.length) {
      toast({
        title: "No Data",
        description: "Cannot export empty report.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const wb = XLSX.utils.book_new();
      const submissionsExportData = submissions.map((sub) => ({
        "Submission ID": sub.id,
        Activity: sub.activity_stream,
        Location: sub.location_name,
        "Specific Location": sub.specific_location,
        "Community Group Type": sub.community_group_type || "N/A",
        "Reported Participants": sub.participant_count,
        Status: sub.status,
        "Submission Date": sub.submitted_at
          ? new Date(sub.submitted_at).toLocaleDateString()
          : "N/A",
        "Creation Date": new Date(sub.created_at).toLocaleString(),
        "Submitted By": sub.submitted_by,
      }));
      const submissionsWS = XLSX.utils.json_to_sheet(submissionsExportData);
      XLSX.utils.book_append_sheet(wb, submissionsWS, "Submissions");
      const participantsExportData = participants.map((p) => {
        const relatedSub = submissions.find((s) => s.id === p.submission_id);
        return {
          "Participant Name": p.name,
          Age: p.age,
          Gender: p.gender,
          "Phone Number": p.phone_number ? `'${p.phone_number}` : "N/A",
          "Submission ID": p.submission_id,
          "Related Activity": relatedSub?.activity_stream || "Unknown",
          "Related Location": relatedSub?.location_name || "Unknown",
        };
      });
      const participantsWS = XLSX.utils.json_to_sheet(participantsExportData);
      XLSX.utils.book_append_sheet(wb, participantsWS, "Participants");
      const summaryData = [
        {
          Parameter: "Report Generated Date",
          Value: new Date().toLocaleString(),
        },
        { Parameter: "Project ID", Value: project_id || "N/A" },
        {
          Parameter: "Selected Location",
          Value:
            filters.locationId === "all"
              ? "All Locations"
              : locationNameMap.get(filters.locationId) || filters.locationId,
        },
        {
          Parameter: "Selected Date Range",
          Value:
            filters.dateRange === "all"
              ? "All Time"
              : filters.dateRange === "last7"
              ? "Last 7 Days"
              : filters.dateRange === "last30"
              ? "Last 30 Days"
              : "Last 90 Days",
        },
        {},
        { Parameter: "Total Submissions Found", Value: submissions.length },
        { Parameter: "Total Participants Found", Value: participants.length },
      ];
      const summaryWS = XLSX.utils.json_to_sheet(summaryData, {
        skipHeader: true,
      });
      summaryWS["!cols"] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");
      const dateStamp = new Date().toISOString().split("T")[0];
      const fileName = project_id
        ? `report_${dateStamp}_${project_id}.xlsx`
        : `report_${dateStamp}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast({
        title: "Report Exported",
        description: "Report successfully exported to Excel.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error exporting report:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export report to Excel.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex-grow">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Activity Reports
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            View and export data for submitted activities.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto text-sm sm:text-base"
          onClick={exportToExcel}
          disabled={loading || !submissions.length}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2 pt-3 sm:pt-4">
            <CardTitle className="text-sm font-medium">
              Filter by Location
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <Select
              value={filters.locationId}
              onValueChange={(value) => handleFilterChange("locationId", value)}
              disabled={loading || locations.length === 0}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id} className="text-sm">
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 sm:pt-4">
            <CardTitle className="text-sm font-medium">
              Filter by Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <Select
              value={filters.dateRange}
              onValueChange={(value) => handleFilterChange("dateRange", value)}
              disabled={loading}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">All Time</SelectItem>
                <SelectItem value="last7" className="text-sm">Last 7 Days</SelectItem>
                <SelectItem value="last30" className="text-sm">Last 30 Days</SelectItem>
                <SelectItem value="last90" className="text-sm">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {loading && !hasFetchedInitialData ? (
        <div className="flex justify-center items-center h-60 border rounded-lg bg-muted/10">
          <LoadingSpinner className="h-8 w-8 text-primary" />
          <span className="ml-3 text-muted-foreground">
            Loading initial report data...
          </span>
        </div>
      ) : !loading && submissions.length === 0 && hasFetchedInitialData ? (
        <div className="flex flex-col items-center justify-center h-60 bg-muted/20 rounded-lg border border-dashed p-6 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">No Data Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            There are no submissions matching your current filter criteria.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-3 text-xs sm:text-sm sm:max-w-md sm:mx-auto md:max-w-lg">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            {loading && hasFetchedInitialData && (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner className="h-6 w-6 text-primary" />
                <span className="ml-2 text-muted-foreground">
                  Updating charts...
                </span>
              </div>
            )}
            <div
              className={`grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 ${
                loading && hasFetchedInitialData ? "opacity-50" : ""
              }`}
            >
              {[
                {
                  title: "Submissions Over Time",
                  description: "Monthly counts",
                  data: submissionsOverTime,
                  type: "line",
                  options: lineChartOptions,
                },
                {
                  title: "Submissions by Status",
                  description: "Status distribution",
                  data: submissionsByStatus,
                  type: "pie",
                  options: pieChartOptions,
                  sizeClass: "max-w-[280px] h-[280px] sm:max-w-[300px] sm:h-[300px]",
                },
                {
                  title: "Submissions by Location",
                  description: "Count per location",
                  data: submissionsByLocation,
                  type: "bar",
                  options: barChartOptions,
                },
                {
                  title: "Participants by Group",
                  description: "Count per group type",
                  data: participantsByGroup,
                  type: "bar",
                  options: barChartOptions,
                },
              ].map((chart, index) => (
                <Card key={index}>
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-base sm:text-lg">{chart.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{chart.description}</CardDescription>
                  </CardHeader>
                  <CardContent
                    className={`h-64 sm:h-72 md:h-80 p-2 sm:p-4 ${
                      chart.type === "pie"
                        ? "flex items-center justify-center"
                        : ""
                    }`}
                  >
                    {chart.data ? (
                      <div
                        className={`relative w-full h-full ${
                          chart.sizeClass || ""
                        }`}
                      >
                        <Chart
                          type={chart.type as "line" | "bar" | "pie"}
                          data={chart.data}
                          options={chart.options}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        No data
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="submissions">
            {loading && hasFetchedInitialData && (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner className="h-6 w-6 text-primary" />
                <span className="ml-2 text-muted-foreground">
                  Updating list...
                </span>
              </div>
            )}
            <Card
              className={`${
                loading && hasFetchedInitialData ? "opacity-50" : ""
              }`}
            >
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-base sm:text-lg">Submissions List</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Displaying {submissions.length} submission(s).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full w-full text-xs sm:text-sm divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 sm:p-3 font-medium text-muted-foreground text-left">
                          Activity
                        </th>
                        <th className="p-2 sm:p-3 font-medium text-muted-foreground text-left">
                          Location
                        </th>
                        <th className="p-2 sm:p-3 font-medium text-muted-foreground text-center">
                          Status
                        </th>
                        <th className="p-2 sm:p-3 font-medium text-muted-foreground text-center">
                          Participants
                        </th>
                        <th className="p-2 sm:p-3 font-medium text-muted-foreground text-left whitespace-nowrap">
                          Date Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {submissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-muted/50">
                          <td className="p-2 sm:p-3 align-top">
                            {submission.activity_stream}
                          </td>
                          <td className="p-2 sm:p-3 align-top">
                            {submission.location_name}
                          </td>
                          <td className="p-2 sm:p-3 align-top text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                submission.status === "approved"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : submission.status === "submitted"
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-400 dark:text-blue-200"
                                  : submission.status === "rejected"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                              }`}
                            >
                              {submission.status.charAt(0).toUpperCase() +
                                submission.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-2 sm:p-3 align-top text-center">
                            {
                              participants.filter(
                                (p) => p.submission_id === submission.id
                              ).length
                            }
                            <span className="text-muted-foreground text-xs">
                              {" "}
                              / {submission.participant_count}
                            </span>
                          </td>
                          <td className="p-2 sm:p-3 align-top whitespace-nowrap">
                            {new Date(
                              submission.created_at
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="participants">
            {loading && hasFetchedInitialData && (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner className="h-6 w-6 text-primary" />
                <span className="ml-2 text-muted-foreground">
                  Updating list...
                </span>
              </div>
            )}
            <Card
              className={`${
                loading && hasFetchedInitialData ? "opacity-50" : ""
              }`}
            >
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-base sm:text-lg">Participants List</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Displaying {participants.length} participant(s).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full w-full text-xs sm:text-sm divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 sm:p-3 font-medium text-muted-foreground text-left">
                          Name
                        </th>
                        <th className="p-2 sm:p-3 font-medium text-muted-foreground text-left">
                          Age
                        </th>
                        <th className="p-2 sm:p-3 font-medium text-muted-foreground text-left">
                          Gender
                        </th>
                        <th className="p-2 sm:p-3 font-medium text-muted-foreground text-left">
                          Phone
                        </th>
                        <th className="p-2 sm:p-3 font-medium text-muted-foreground text-left">
                          Associated Activity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {participants.map((participant, index) => {
                        const relatedSubmission = submissions.find(
                          (s) => s.id === participant.submission_id
                        );
                        return (
                          <tr
                            key={`${participant.submission_id}-${
                              participant.phone_number || index
                            }`}
                            className="hover:bg-muted/50"
                          >
                            <td className="p-2 sm:p-3 align-top">
                              {participant.name || "-"}
                            </td>
                            <td className="p-2 sm:p-3 align-top">
                              {participant.age || "-"}
                            </td>
                            <td className="p-2 sm:p-3 align-top">
                              {participant.gender || "-"}
                            </td>
                            <td className="p-2 sm:p-3 align-top whitespace-nowrap">
                              {participant.phone_number || "-"}
                            </td>
                            <td className="p-2 sm:p-3 align-top">
                              {relatedSubmission?.activity_stream ||
                                "Unknown"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}