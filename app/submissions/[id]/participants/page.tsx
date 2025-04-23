"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getSupabaseClient } from "@/lib/services/client";

interface Participant {
  id: string;
  name: string;
  age: number;
  phone_number: string;
  gender: string;
  created_at: string;
}

export default function ParticipantsPage() {
  const router = useRouter();
  const params = useParams();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("participants")
          .select("*")
          .eq("submission_id", params.id);

        if (error) {
          console.error("Error fetching participants:", error);
          return;
        }

        setParticipants(data || []);
      } catch (error) {
        console.error("Error loading participants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-6xl mx-auto px-4 py-6 md:py-10">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Participants</h1>
          <p className="text-muted-foreground mt-2">
            View the list of participants for this submission.
          </p>
        </div>
        {participants.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-lg">
              No participants found for this submission.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-muted-foreground/20">
            <Table className="w-full text-sm text-left text-muted-foreground">
              <TableHeader>
                <TableRow className="bg-muted-foreground/10">
                  <TableHead className="px-6 py-3 font-semibold text-foreground">Name</TableHead>
                  <TableHead className="px-6 py-3 font-semibold text-foreground">Age</TableHead>
                  <TableHead className="px-6 py-3 font-semibold text-foreground">Phone</TableHead>
                  <TableHead className="px-6 py-3 font-semibold text-foreground">Gender</TableHead>
                  <TableHead className="px-6 py-3 font-semibold text-foreground">Added On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => (
                  <TableRow
                    key={participant.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-muted-foreground/5"
                    } hover:bg-muted-foreground/10 transition-colors`}
                  >
                    <TableCell className="px-6 py-4">{participant.name}</TableCell>
                    <TableCell className="px-6 py-4">{participant.age}</TableCell>
                    <TableCell className="px-6 py-4">{participant.phone_number}</TableCell>
                    <TableCell className="px-6 py-4">{participant.gender}</TableCell>
                    <TableCell className="px-6 py-4">
                      {new Date(participant.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}